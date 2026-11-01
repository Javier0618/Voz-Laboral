// Carga la parte 5 (reformas y mundo del trabajo) y comprueba que las guías
// quedan pendientes, con fuentes, sin enlaces rotos y que es idempotente.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { as, createDb, type Db } from './harness';

let db: Db;
const archivo = (n: string) => readFileSync(join(process.cwd(), 'supabase', 'contenido', n), 'utf8');
const parte5 = archivo('guias-trabajo-2026-parte-5.sql');
const NUEVAS = [
  'contrato-de-aprendizaje-sena',
  'plataformas-digitales-de-reparto',
  'reforma-laboral-ley-2466-que-cambio',
  'sindicatos-asociacion-y-huelga',
  'teletrabajo-trabajo-remoto-y-desconexion',
];

beforeAll(async () => {
  db = await createDb();
  for (const n of ['guias-derechos-2026.sql', 'guias-derechos-2026-parte-2.sql', 'guias-derechos-2026-parte-3.sql', 'guias-derechos-2026-parte-4.sql']) {
    await db.exec(archivo(n));
  }
  await db.exec(parte5);
  await db.exec(parte5);
}, 60_000);

describe('guías, parte 5', () => {
  it('crea las cinco guías pendientes de verificación y con fuentes, sin duplicar', async () => {
    const { rows } = await db.query<{ slug: string; status: string; fuentes: number }>(
      `select r.slug, r.status, (select count(*)::int from public.legal_resource_sources s where s.resource_id = r.id) as fuentes
         from public.legal_resources r where r.slug = any($1) order by r.slug`,
      [NUEVAS],
    );
    expect(rows.map((r) => r.slug)).toEqual(NUEVAS);
    for (const r of rows) {
      expect(r.status).toBe('pendiente_verificacion');
      expect(r.fuentes).toBeGreaterThan(0);
    }
  });

  it('siguen la plantilla editorial', async () => {
    const { rows } = await db.query<{ content: string }>(`select content from public.legal_resources where slug = any($1)`, [NUEVAS]);
    for (const { content } of rows) {
      for (const h of ['## Qué dice la ley', '## En la práctica', '## Errores comunes', '## Qué puedes hacer', '## Herramientas y lecturas relacionadas']) {
        expect(content).toContain(h);
      }
    }
  });

  it('solo enlazan a guías que existen', async () => {
    const { rows } = await db.query<{ content: string }>(`select content from public.legal_resources where slug = any($1)`, [NUEVAS]);
    const { rows: todas } = await db.query<{ slug: string }>(`select slug from public.legal_resources`);
    const existentes = new Set(todas.map((r) => r.slug));
    const enlazadas = rows.flatMap((r) => [...r.content.matchAll(/\/derechos\/([a-z0-9-]+)/g)].map((m) => m[1]));
    expect(enlazadas.length).toBeGreaterThan(0);
    for (const slug of enlazadas) expect(existentes.has(slug), slug).toBe(true);
  });

  it('no son visibles para el público mientras estén pendientes', async () => {
    const { rows } = await as(db, 'anon', () => db.query(`select slug from public.legal_resources where slug = any($1)`, [NUEVAS]));
    expect(rows).toEqual([]);
  });
});
