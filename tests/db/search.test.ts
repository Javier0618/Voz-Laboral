// Buscador del sitio (migración 2400): búsqueda de guías sin tildes y
// registro anónimo de búsquedas, visible solo para redacción y administración.
import { beforeAll, describe, expect, it } from 'vitest';
import { as, createDb, createUser, errorOf, type Db } from './harness';

let db: Db;
let admin: { id: string };
let redactor: { id: string };
let user: { id: string };

const search = (who: Parameters<typeof as>[1], q: string) =>
  as(db, who, () => db.query<{ slug: string }>(`select slug from public.search_guides($1)`, [q])).then((r) => r.rows.map((x) => x.slug));
const log = (q: string, n: number) => as(db, 'anon', () => db.query(`select public.log_search($1, $2)`, [q, n]));

beforeAll(async () => {
  db = await createDb();
  admin = await createUser(db, { alias: 'coordinacion_b', role: 'admin' });
  redactor = await createUser(db, { alias: 'redaccion_b', role: 'redactor' });
  user = await createUser(db, { alias: 'lector_b' });
  await db.exec(`insert into public.legal_resources (slug, title, summary, content, status) values
    ('prima-de-servicios', 'Prima de servicios en Colombia', 'Cuándo y cuánto te pagan de prima.', 'La prima equivale a treinta días de salario por año trabajado, en dos pagos.', 'borrador'),
    ('vacaciones', 'Vacaciones: cuántos días te corresponden', 'Quince días hábiles de descanso por cada año.', 'El artículo 186 del Código Sustantivo del Trabajo fija quince días hábiles.', 'borrador'),
    ('borrador-oculto', 'Prima secreta en borrador', 'Este borrador no debe aparecer en la búsqueda.', 'Texto del borrador sobre la prima, que nadie debe encontrar todavía.', 'borrador')`);
  // Publicar exige una fuente: se añade y después se publica.
  await db.exec(`insert into public.legal_resource_sources (resource_id, label, publisher, url, accessed_at)
      select id, 'Código Sustantivo del Trabajo', 'Colpensiones', 'https://normativa.colpensiones.gov.co/' || slug, current_date
        from public.legal_resources where slug in ('prima-de-servicios', 'vacaciones');
    update public.legal_resources set status = 'publicado', last_verified_at = current_date where slug in ('prima-de-servicios', 'vacaciones');`);
}, 60_000);

describe('buscador del sitio', () => {
  it('encuentra guías publicadas sin distinguir tildes ni mayúsculas', async () => {
    expect(await search('anon', 'PRIMA')).toEqual(['prima-de-servicios']);
    expect(await search('anon', 'cuantos dias vacaciones')).toEqual(['vacaciones']);
    expect(await search('anon', 'articulo 186')).toEqual(['vacaciones']);
    expect(await search(user, 'liquidación por despido')).toEqual([]);
  });

  it('registra búsquedas anónimas y descarta términos que podrían ser datos personales', async () => {
    await log('Licencia de paternidad', 0);
    await log('licencia de páternidad', 0);
    await log('ab', 0);
    await log('cedula 1012345678', 0);
    await log('prima', 1);
    const { rows } = await db.query<{ term: string; searches: number }>(`select term, searches from public.search_log order by term`);
    expect(rows).toEqual([{ term: 'licencia de paternidad', searches: 2 }, { term: 'prima', searches: 1 }]);
    const cols = await db.query<{ column_name: string }>(`select column_name from information_schema.columns where table_name = 'search_log'`);
    expect(cols.rows.map((c) => c.column_name).sort()).toEqual(['day', 'last_seen', 'results', 'searches', 'term']);
  });

  it('solo redacción y administración ven las búsquedas sin resultado', async () => {
    expect(await errorOf(as(db, 'anon', () => db.query(`select * from public.search_log`)))).toMatch(/permission denied/);
    expect(await errorOf(as(db, user, () => db.query(`select * from public.editorial_search_gaps()`)))).toMatch(/VL403/);
    for (const who of [admin, redactor]) {
      const { rows } = await as(db, who, () => db.query<{ term: string; searches: string }>(`select term, searches from public.editorial_search_gaps()`));
      expect(rows).toEqual([{ term: 'licencia de paternidad', searches: 2 }]);
    }
  });

  it('borra los registros de más de 180 días', async () => {
    await db.query(`insert into public.search_log (term, day) values ('termino viejo', current_date - 200)`);
    await log('otra busqueda', 0);
    const { rows } = await db.query(`select 1 from public.search_log where term = 'termino viejo'`);
    expect(rows).toEqual([]);
  });
});
