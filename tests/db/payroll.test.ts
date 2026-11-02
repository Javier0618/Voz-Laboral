// Nóminas guardadas (migración 2500): cada persona ve y cambia solo las suyas.
import { beforeAll, describe, expect, it } from 'vitest';
import { as, createDb, createUser, errorOf, type Db } from './harness';

let db: Db;
let ana: { id: string };
let beto: { id: string };
let admin: { id: string };

const save = (who: { id: string }, calc: string, key: string, net = 1500000, data = '{"salario":1750905}') =>
  as(db, who, () => db.query(
    `insert into public.payroll_records (calculator, period_key, data, net_estimate, worked_days) values ($1, $2, $3::jsonb, $4, 12)
     on conflict (user_id, calculator, period_key) do update set data = excluded.data, net_estimate = excluded.net_estimate`,
    [calc, key, data, net],
  ));
const mine = (who: { id: string } | 'anon') =>
  as(db, who, () => db.query<{ period_key: string; net_estimate: number }>(`select period_key, net_estimate from public.payroll_records order by period_key`)).then((r) => r.rows);

beforeAll(async () => {
  db = await createDb();
  ana = await createUser(db, { alias: 'ana_n' });
  beto = await createUser(db, { alias: 'beto_n' });
  admin = await createUser(db, { alias: 'coordinacion_n', role: 'admin' });
}, 60_000);

describe('nóminas guardadas', () => {
  it('cada persona guarda y actualiza sus períodos', async () => {
    await save(ana, 'vigilantes', '2026-11-mensual');
    await save(ana, 'vigilantes', '2026-11-mensual', 1650000);
    await save(ana, 'operativos', '2026-10-q2', 800000);
    expect(await mine(ana)).toEqual([
      { period_key: '2026-10-q2', net_estimate: 800000 },
      { period_key: '2026-11-mensual', net_estimate: 1650000 },
    ]);
  });

  it('nadie más las ve ni las cambia, tampoco la administración ni anónimos', async () => {
    expect(await mine(beto)).toEqual([]);
    expect(await mine(admin)).toEqual([]);
    expect(await errorOf(mine('anon'))).toMatch(/permission denied/);
    await as(db, beto, () => db.query(`update public.payroll_records set net_estimate = 0`));
    await as(db, beto, () => db.query(`delete from public.payroll_records`));
    expect((await mine(ana)).length).toBe(2);
    expect(await errorOf(as(db, beto, () => db.query(
      `insert into public.payroll_records (user_id, calculator, period_key, data) values ($1, 'vigilantes', '2026-09-mensual', '{}')`, [ana.id],
    )))).toMatch(/row-level security/);
  });

  it('valida calculadora, período y tamaño', async () => {
    expect(await errorOf(save(ana, 'prima', '2026-11-mensual'))).toMatch(/check/);
    expect(await errorOf(save(ana, 'vigilantes', '2026-11'))).toMatch(/check/);
    expect(await errorOf(save(ana, 'vigilantes', '2026-12-mensual', 1, JSON.stringify({ x: 'a'.repeat(70000) })))).toMatch(/check/);
  });

  it('se borran al eliminar la cuenta', async () => {
    await db.query(`delete from auth.users where id = $1`, [ana.id]);
    const { rows } = await db.query(`select 1 from public.payroll_records where user_id = $1`, [ana.id]);
    expect(rows).toEqual([]);
  });
});
