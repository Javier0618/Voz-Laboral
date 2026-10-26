// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest';
import { createDb, rows, type Db } from './harness';

// Antes de confiar en las demás pruebas, comprobamos que PGlite aplica RLS
// de verdad con SET ROLE y que los privilegios por defecto son los de Supabase.
describe('PGlite aplica RLS de verdad', () => {
  let db: Db;
  beforeAll(async () => {
    db = await createDb();
    await db.exec(`
      create table public.rls_probe (id int, owner uuid);
      alter table public.rls_probe enable row level security;
      create policy rls_probe_own on public.rls_probe for select to authenticated using (owner = auth.uid());
      insert into public.rls_probe values
        (1, '00000000-0000-0000-0000-00000000000a'),
        (2, '00000000-0000-0000-0000-00000000000b');
    `);
  });

  it('el rol activo es authenticated y no es superusuario', async () => {
    const [r] = await rows<{ current_user: string; rolsuper: boolean }>(
      db,
      'authenticated',
      '00000000-0000-0000-0000-00000000000a',
      `select current_user, (select rolsuper from pg_roles where rolname = current_user) as rolsuper`,
    );
    expect(r.current_user).toBe('authenticated');
    expect(r.rolsuper).toBe(false);
  });

  it('una tabla nueva tiene privilegios por defecto para anon (como en Supabase)', async () => {
    const [r] = await rows<{ ok: boolean }>(db, 'anon', null,
      `select has_table_privilege('anon', 'public.rls_probe', 'select') as ok`);
    expect(r.ok).toBe(true);
  });

  it('las políticas filtran filas por auth.uid()', async () => {
    const own = await rows(db, 'authenticated', '00000000-0000-0000-0000-00000000000a', 'select id from public.rls_probe');
    expect(own).toEqual([{ id: 1 }]);
    const none = await rows(db, 'anon', null, 'select id from public.rls_probe');
    expect(none).toEqual([]);
  });

  it('todas las tablas de public tienen RLS activado', async () => {
    const res = await db.query<{ relname: string }>(`
      select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity`);
    expect(res.rows).toEqual([]);
  });
});
