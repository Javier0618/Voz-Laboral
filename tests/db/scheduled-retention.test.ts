// Tarea programada de conservación: elimina las cuentas vencidas y purga.
import { beforeAll, describe, expect, it } from 'vitest';
import { as, createCompany, createDb, createUser, SAMPLE_BODY, type Db } from './harness';

let db: Db;
let vencida: { id: string };
let reciente: { id: string };
let expId: string;

beforeAll(async () => {
  db = await createDb();
  const admin = await createUser(db, { alias: 'coordinacion_ret', role: 'admin' });
  vencida = await createUser(db, { alias: 'persona_vencida' });
  reciente = await createUser(db, { alias: 'persona_reciente' });
  const empresa = await createCompany(db, admin, 'Empresa Retención', 'empresa-retencion');
  const cat = (await db.query<{ slug: string }>(`select slug from public.experience_categories limit 1`)).rows[0].slug;
  const { rows } = await as(db, vencida, () => db.query<{ id: string }>(
    `insert into public.experiences (company_id, category_slug, period_start, relationship, body, rules_accepted, tone)
     values ($1, $2, date '2025-03-01', 'anterior', $3, true, 'mixta') returning id`, [empresa, cat, SAMPLE_BODY]));
  expId = rows[0].id;
  for (const u of [vencida, reciente]) await as(db, u, () => db.query(`select public.request_account_deletion()`));
  await db.query(`update public.profiles set deletion_requested_at = now() - interval '16 days' where id = $1`, [vencida.id]);
  await db.query(`insert into public.security_events (event_type, details, created_at) values ('prueba_antigua', '{}', now() - interval '13 months')`);
}, 60_000);

describe('tarea programada de conservación', () => {
  it('elimina solo las cuentas cuyo plazo de 15 días venció, conserva sus experiencias sin autor y purga', async () => {
    const { rows } = await db.query<{ r: Record<string, number> }>(`select private.run_scheduled_retention() as r`);
    expect(rows[0].r).toMatchObject({ cuentas_eliminadas: 1, cuentas_con_error: 0, security_events: 1 });
    expect((await db.query(`select 1 from auth.users where id = $1`, [vencida.id])).rows).toEqual([]);
    expect((await db.query(`select 1 from public.profiles where id = $1`, [vencida.id])).rows).toEqual([]);
    expect((await db.query(`select 1 from auth.users where id = $1`, [reciente.id])).rows).toHaveLength(1);
    const exp = await db.query<{ author_id: string | null; anonymized: boolean }>(`select author_id, anonymized from public.experiences where id = $1`, [expId]);
    expect(exp.rows[0]).toEqual({ author_id: null, anonymized: true });
    expect((await db.query(`select 1 from public.security_events where event_type = 'prueba_antigua'`)).rows).toEqual([]);
  });

  it('no la puede ejecutar ninguna persona usuaria', async () => {
    const otra = await createUser(db, { alias: 'persona_curiosa' });
    await expect(as(db, otra, () => db.query(`select private.run_scheduled_retention()`))).rejects.toThrow();
    await expect(as(db, 'anon', () => db.query(`select private.run_scheduled_retention()`))).rejects.toThrow();
  });

  it('la auditoría sigue siendo inmutable: solo se permite quitar la referencia a la persona', async () => {
    const otro = await createUser(db, { alias: 'persona_auditada' });
    await as(db, otro, () => db.query(`select public.request_account_deletion()`));
    const ev = (await db.query<{ id: number }>(`select id from public.moderation_events where actor_id = $1 limit 1`, [otro.id])).rows[0];
    await expect(db.query(`update public.moderation_events set reason = 'Cambiado' where id = $1`, [ev.id])).rejects.toThrow(/VL403/);
    await expect(db.query(`update public.moderation_events set actor_id = null, reason = 'Cambiado' where id = $1`, [ev.id])).rejects.toThrow(/VL403/);
    await expect(db.query(`delete from public.moderation_events where id = $1`, [ev.id])).rejects.toThrow(/VL403/);
    await db.query(`update public.moderation_events set actor_id = null where id = $1`, [ev.id]);
    const r = await db.query<{ actor_id: string | null; reason: string }>(`select actor_id, reason from public.moderation_events where id = $1`, [ev.id]);
    expect(r.rows[0].actor_id).toBeNull();
    expect(r.rows[0].reason).toBe('Solicitud de eliminación del titular');
  });

  it('también se puede eliminar una cuenta a mano desde el panel (borrar el usuario de Auth)', async () => {
    const manual = await createUser(db, { alias: 'persona_manual' });
    await as(db, manual, () => db.query(`select public.request_account_deletion()`));
    await db.query(`delete from auth.users where id = $1`, [manual.id]);
    expect((await db.query(`select 1 from auth.users where id = $1`, [manual.id])).rows).toEqual([]);
  });
});
