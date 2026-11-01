// deleteGuide funciona con la función de borrado y, si la base de datos aún no
// la tiene (migraciones pendientes), con el borrado directo del esquema anterior.
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  rpc: { data: null as unknown, error: null as unknown },
  direct: { data: null as unknown, error: null as unknown },
  rpcArgs: null as unknown,
  removed: [] as string[],
}));

vi.mock('../../src/lib/supabase', async (orig) => {
  const real = await orig<typeof import('../../src/lib/supabase')>();
  const client = {
    rpc: (_fn: string, args: unknown) => { state.rpcArgs = args; return Promise.resolve(state.rpc); },
    from: () => ({ delete: () => ({ eq: () => ({ select: () => Promise.resolve(state.direct) }) }) }),
    storage: { from: () => ({
      list: () => Promise.resolve({ data: [{ name: 'a.png' }] }),
      remove: (p: string[]) => { state.removed.push(...p); return Promise.resolve({}); },
    }) },
  };
  return { ...real, isConfigured: true, supabase: client, requireClient: () => client };
});

import { deleteGuide } from '../../src/lib/adminApi';

const sinFuncion = { code: 'PGRST202', message: 'Could not find the function public.delete_legal_resource(p_id) in the schema cache' };

describe('deleteGuide', () => {
  beforeEach(() => { state.removed = []; state.rpcArgs = null; });

  it('usa la función de borrado con el motivo por defecto y limpia las imágenes', async () => {
    state.rpc = { data: 'guia-x', error: null };
    await expect(deleteGuide('g1')).resolves.toBe('guia-x');
    expect(state.rpcArgs).toEqual({ p_id: 'g1', p_reason: 'Guía borrada desde el panel' });
    expect(state.removed).toEqual(['guia-x/a.png']);
  });

  it('si la función no existe, borra directamente', async () => {
    state.rpc = { data: null, error: sinFuncion };
    state.direct = { data: [{ slug: 'guia-y' }], error: null };
    await expect(deleteGuide('g2')).resolves.toBe('guia-y');
    expect(state.removed).toEqual(['guia-y/a.png']);
  });

  it('si tampoco se puede borrar directamente, explica qué migraciones faltan', async () => {
    state.rpc = { data: null, error: sinFuncion };
    state.direct = { data: null, error: { code: '42501', message: 'permission denied for table legal_resources' } };
    await expect(deleteGuide('g3')).rejects.toThrow(/20261101001800_delete_guide\.sql/);
  });

  it('si el borrado directo no afecta ninguna fila, avisa de permisos', async () => {
    state.rpc = { data: null, error: sinFuncion };
    state.direct = { data: [], error: null };
    await expect(deleteGuide('g4')).rejects.toThrow(/permiso/);
  });

  it('otros errores de la función se muestran tal cual', async () => {
    state.rpc = { data: null, error: { message: 'VL403: solo la administración puede borrar guías' } };
    await expect(deleteGuide('g5')).rejects.toThrow('No tienes permiso para realizar esta acción.');
  });
});
