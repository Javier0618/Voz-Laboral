// Parte 6: corrige las guías de la parte 5 ya publicadas (sin pisar ediciones
// manuales) y añade la guía de reforma pensional pendiente de verificación.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { as, createDb, createUser, type Db } from './harness';

let db: Db;
const archivo = (n: string) => readFileSync(join(process.cwd(), 'supabase', 'contenido', n), 'utf8');
const parte6 = archivo('guias-trabajo-2026-parte-6.sql');
const CORREGIDAS = [
  'contrato-de-aprendizaje-sena',
  'plataformas-digitales-de-reparto',
  'reforma-laboral-ley-2466-que-cambio',
  'teletrabajo-trabajo-remoto-y-desconexion',
];
const EDITADA = 'sindicatos-asociacion-y-huelga';
const contenido = async (slug: string) =>
  (await db.query<{ content: string }>(`select content from public.legal_resources where slug = $1`, [slug])).rows[0].content;

beforeAll(async () => {
  db = await createDb();
  const admin = await createUser(db, { alias: 'coordinacion_p6', role: 'admin' });
  for (const n of [
    'guias-derechos-2026.sql', 'guias-derechos-2026-parte-2.sql', 'guias-derechos-2026-parte-3.sql',
    'guias-derechos-2026-parte-4.sql', 'guias-trabajo-2026-parte-5.sql',
  ]) await db.exec(archivo(n));
  // Como en producción: las guías de la parte 5 ya se publicaron, y una se editó a mano.
  await as(db, admin, async () => {
    await db.query(`update public.legal_resources set status = 'publicado', last_verified_at = date '2026-11-01', verified_by = $1 where slug = any($2)`, [admin.id, [...CORREGIDAS, EDITADA]]);
    await db.query(`update public.legal_resources set content = content || E'\n\nNota añadida a mano.' where slug = $1`, [EDITADA]);
  });
  await db.exec(parte6);
  await db.exec(parte6);
}, 60_000);

describe('guías, parte 6', () => {
  it('corrige las guías publicadas y quita las marcas de verificación pendiente', async () => {
    for (const slug of CORREGIDAS) {
      const c = await contenido(slug);
      expect(c, slug).not.toContain('pendiente de verificación');
      expect(c, slug).toContain('## Qué dice la ley');
    }
    expect(await contenido('plataformas-digitales-de-reparto')).toContain('12 meses después');
    expect(await contenido('reforma-laboral-ley-2466-que-cambio')).toContain('endometriosis');
    expect(await contenido('teletrabajo-trabajo-remoto-y-desconexion')).toContain('auxilio de conectividad');
  });

  it('no pisa una guía editada a mano', async () => {
    const c = await contenido(EDITADA);
    expect(c).toContain('Nota añadida a mano.');
    expect(c).toContain('(pendiente de verificación: requisitos actuales)');
  });

  it('las guías corregidas siguen publicadas', async () => {
    const { rows } = await as(db, 'anon', () => db.query<{ slug: string }>(`select slug from public.legal_resources where slug = any($1) order by slug`, [CORREGIDAS]));
    expect(rows.map((r) => r.slug)).toEqual(CORREGIDAS);
  });

  it('crea la guía de reforma pensional pendiente, con fuentes y sin enlaces rotos', async () => {
    const { rows } = await db.query<{ status: string; fuentes: number; content: string }>(
      `select r.status, r.content, (select count(*)::int from public.legal_resource_sources s where s.resource_id = r.id) as fuentes
         from public.legal_resources r where r.slug = 'reforma-pensional-que-cambia'`,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe('pendiente_verificacion');
    expect(rows[0].fuentes).toBe(2);
    const { rows: todas } = await db.query<{ slug: string }>(`select slug from public.legal_resources`);
    const existentes = new Set(todas.map((r) => r.slug));
    for (const m of rows[0].content.matchAll(/\/derechos\/([a-z0-9-]+)/g)) expect(existentes.has(m[1]), m[1]).toBe(true);
  });

  it('no duplica fuentes al ejecutarse dos veces', async () => {
    const { rows } = await db.query<{ n: number }>(
      `select count(*)::int as n from (select resource_id, url from public.legal_resource_sources group by 1, 2 having count(*) > 1) d`,
    );
    expect(rows[0].n).toBe(0);
  });
});
