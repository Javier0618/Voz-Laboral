// Carga el archivo real de guías y comprueba el flujo de publicación.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { as, createDb, createUser, errorOf, type Db } from './harness';

let db: Db;
let admin: { id: string };
let user: { id: string };

beforeAll(async () => {
  db = await createDb();
  admin = await createUser(db, { alias: 'coordinacion_g', role: 'admin' });
  user = await createUser(db, { alias: 'lector_g' });
  const sql = readFileSync(join(process.cwd(), 'supabase', 'contenido', 'guias-derechos-2026.sql'), 'utf8');
  await db.exec(sql);
  await db.exec(sql); // idempotente
}, 60_000);

describe('guías de derechos', () => {
  it('carga 10 guías pendientes, una por categoría, todas con fuente', async () => {
    const { rows } = await db.query<{ slug: string; status: string; category_slug: string; fuentes: number }>(
      `select r.slug, r.status, r.category_slug, count(s.id)::int as fuentes
         from public.legal_resources r left join public.legal_resource_sources s on s.resource_id = r.id
        group by r.id`,
    );
    expect(rows).toHaveLength(10);
    expect(rows.every((r) => r.status === 'pendiente_verificacion' && r.fuentes >= 1)).toBe(true);
    const cats = await db.query<{ n: number }>(`select count(*)::int n from public.experience_categories`);
    expect(new Set(rows.map((r) => r.category_slug)).size).toBe(cats.rows[0].n);
  });

  it('las guías pendientes no son públicas', async () => {
    const { rows } = await as(db, 'anon', () => db.query(`select id from public.legal_resources`));
    expect(rows).toHaveLength(0);
  });

  it('un usuario sin rol no puede publicarlas', async () => {
    const result = await as(db, user, () =>
      db.query(`update public.legal_resources set status = 'publicado', last_verified_at = current_date where slug = 'pago-del-salario'`),
    );
    expect(result.affectedRows ?? 0).toBe(0);
  });

  it('la administración publica una guía y entonces es pública con sus fuentes', async () => {
    await as(db, admin, () =>
      db.query(`update public.legal_resources set status = 'publicado', last_verified_at = current_date, verified_by = $1 where slug = 'pago-del-salario'`, [admin.id]),
    );
    const { rows } = await as(db, 'anon', () =>
      db.query<{ slug: string; fuentes: number }>(
        `select r.slug, (select count(*)::int from public.legal_resource_sources s where s.resource_id = r.id) as fuentes from public.legal_resources r`,
      ),
    );
    expect(rows).toEqual([{ slug: 'pago-del-salario', fuentes: 3 }]);
  });

  it('no se puede publicar sin fecha de verificación', async () => {
    expect(
      await errorOf(as(db, admin, () => db.query(`update public.legal_resources set status = 'publicado', last_verified_at = null where slug = 'licencias-remuneradas'`))),
    ).toMatch(/legal_resources_publish_requires_verification/);
  });
});
