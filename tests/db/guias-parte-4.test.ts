// Carga la parte 4 sobre las guías originales y comprueba que es idempotente
// y que el enlace a la guía nueva solo aparece cuando ya está publicada.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { as, createDb, createUser, type Db } from './harness';

let db: Db;
let admin: { id: string };
const archivo = (n: string) => readFileSync(join(process.cwd(), 'supabase', 'contenido', n), 'utf8');
const parte4 = archivo('guias-derechos-2026-parte-4.sql');
const jornada = async () =>
  (await db.query<{ content: string }>(`select content from public.legal_resources where slug = 'jornada-horas-extra-y-recargos'`)).rows[0].content;
const veces = (t: string, s: string) => t.split(s).length - 1;

beforeAll(async () => {
  db = await createDb();
  admin = await createUser(db, { alias: 'coordinacion_p4', role: 'admin' });
  await db.exec(archivo('guias-derechos-2026.sql'));
  await db.exec(parte4);
  await db.exec(parte4);
}, 60_000);

describe('guías, parte 4', () => {
  it('crea la guía de descanso dominical pendiente y con fuentes', async () => {
    const { rows } = await db.query<{ status: string; fuentes: number }>(
      `select r.status, (select count(*)::int from public.legal_resource_sources s where s.resource_id = r.id) as fuentes
         from public.legal_resources r where r.slug = 'descanso-dominical-y-festivos'`,
    );
    expect(rows).toEqual([{ status: 'pendiente_verificacion', fuentes: 3 }]);
  });

  it('añade a la guía de jornada los arts. 167 y 167A una sola vez, sin enlace roto', async () => {
    const c = await jornada();
    expect(veces(c, '## Límite de horas extra')).toBe(1);
    expect(veces(c, '## El descanso dentro de la jornada')).toBe(1);
    expect(c.indexOf('## Límite de horas extra')).toBeLessThan(c.indexOf('## Domingos y festivos'));
    expect(c).not.toContain('/derechos/descanso-dominical-y-festivos');
  });

  it('al publicar la guía nueva y volver a ejecutar, la guía de jornada la enlaza', async () => {
    await as(db, admin, () =>
      db.query(`update public.legal_resources set status = 'publicado', last_verified_at = current_date, verified_by = $1 where slug = 'descanso-dominical-y-festivos'`, [admin.id]),
    );
    await db.exec(parte4);
    await db.exec(parte4);
    expect(veces(await jornada(), '/derechos/descanso-dominical-y-festivos')).toBe(1);
  });

  it('cualquier visitante puede ver qué guías están publicadas', async () => {
    const { rows } = await as(db, 'anon', () => db.query<{ slug: string }>(`select slug from public.legal_resources where status = 'publicado'`));
    expect(rows.map((r) => r.slug)).toEqual(['descanso-dominical-y-festivos']);
  });
});
