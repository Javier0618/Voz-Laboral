// Parte 12: reescritura de la guía «Reforma pensional» con el estilo
// editorial, sus fuentes nuevas y la revisión de calidad.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
// @ts-expect-error módulo de Node sin tipos
import { revisarGuia } from '../../scripts/revisar-guia.mjs';
import { createDb, type Db } from './harness';

let db: Db;
const archivo = (n: string) => readFileSync(join(process.cwd(), 'supabase', 'contenido', n), 'utf8');
const SLUG = 'reforma-pensional-que-cambia';

beforeAll(async () => {
  db = await createDb();
  for (const n of [
    'guias-derechos-2026.sql', 'guias-derechos-2026-parte-2.sql', 'guias-derechos-2026-parte-3.sql',
    'guias-derechos-2026-parte-4.sql', 'guias-trabajo-2026-parte-5.sql', 'guias-trabajo-2026-parte-6.sql',
  ]) await db.exec(archivo(n));
  await db.exec(archivo('guias-trabajo-2026-parte-12.sql'));
  await db.exec(archivo('guias-trabajo-2026-parte-12.sql'));
}, 60_000);

describe('guías, parte 12', () => {
  it('reescribe la guía con entradilla, fecha de verificación y fuentes nuevas sin duplicarlas', async () => {
    const { rows } = await db.query<{ content: string; last_verified_at: string; fuentes: number }>(
      `select r.content, r.last_verified_at::text, (select count(*)::int from public.legal_resource_sources s where s.resource_id = r.id) as fuentes
         from public.legal_resources r where r.slug = $1`, [SLUG]);
    expect(rows).toHaveLength(1);
    expect(rows[0].content.startsWith('El 28 de octubre de 2026')).toBe(true);
    expect(rows[0].content).toContain('## Preguntas frecuentes');
    expect(rows[0].last_verified_at).toBe('2026-11-02');
    expect(rows[0].fuentes).toBe(4);
  });

  it('cumple la revisión de calidad sin errores ni avisos de estilo', async () => {
    const { rows } = await db.query<{ content: string }>(`select content from public.legal_resources where slug = $1`, [SLUG]);
    const r = revisarGuia({ content: rows[0].content, tipo: 'legal' }, { propuesta: true });
    expect(r.errores).toEqual([]);
    expect(r.avisos.join(' ')).not.toMatch(/estilo/);
  });
});
