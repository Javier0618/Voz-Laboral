// Parte 10: guía «Subsidio de desempleo», pendiente, con
// fuentes, con la plantilla editorial y sin enlaces rotos.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { as, createDb, type Db } from './harness';

let db: Db;
const archivo = (n: string) => readFileSync(join(process.cwd(), 'supabase', 'contenido', n), 'utf8');
const SLUG = 'subsidio-de-desempleo-proteccion-al-cesante';

beforeAll(async () => {
  db = await createDb();
  for (const n of [
    'guias-derechos-2026.sql', 'guias-derechos-2026-parte-2.sql', 'guias-derechos-2026-parte-3.sql',
    'guias-derechos-2026-parte-4.sql', 'guias-trabajo-2026-parte-5.sql', 'guias-trabajo-2026-parte-6.sql', 'guias-trabajo-2026-parte-7.sql', 'guias-trabajo-2026-parte-8.sql', 'guias-trabajo-2026-parte-9.sql',
  ]) await db.exec(archivo(n));
  await db.exec(archivo('guias-trabajo-2026-parte-10.sql'));
  await db.exec(archivo('guias-trabajo-2026-parte-10.sql'));
}, 60_000);

describe('guías, parte 8', () => {
  it('crea la guía pendiente, con 1 fuente y la plantilla editorial', async () => {
    const { rows } = await db.query<{ status: string; content: string; fuentes: number }>(
      `select r.status, r.content, (select count(*)::int from public.legal_resource_sources s where s.resource_id = r.id) as fuentes
         from public.legal_resources r where r.slug = $1`, [SLUG]);
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe('pendiente_verificacion');
    expect(rows[0].fuentes).toBe(1);
    for (const h of ['## Qué dice la ley', '## En la práctica', '## Errores comunes', '## Qué puedes hacer', '## Herramientas y lecturas relacionadas']) {
      expect(rows[0].content).toContain(h);
    }
    const { rows: todas } = await db.query<{ slug: string }>(`select slug from public.legal_resources`);
    const existentes = new Set(todas.map((r) => r.slug));
    for (const m of rows[0].content.matchAll(/\/derechos\/([a-z0-9-]+)/g)) expect(existentes.has(m[1]), m[1]).toBe(true);
  });

  it('no es visible para el público mientras esté pendiente', async () => {
    const { rows } = await as(db, 'anon', () => db.query(`select 1 from public.legal_resources where slug = $1`, [SLUG]));
    expect(rows).toEqual([]);
  });
});
