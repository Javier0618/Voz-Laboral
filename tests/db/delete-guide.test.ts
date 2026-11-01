// Borrado de guías: solo administración, con motivo y registro en moderación.
import { beforeAll, describe, expect, it } from 'vitest';
import { as, createDb, createUser, type Db } from './harness';

let db: Db;
let admin: { id: string };
let user: { id: string };

async function nuevaGuia(slug: string, publicada: boolean) {
  const { rows } = await as(db, admin, () =>
    db.query<{ id: string }>(
      `insert into public.legal_resources (slug, title, summary, content, status) values ($1, 'Guía de prueba para borrar', 'Resumen de prueba suficientemente largo.', $2, 'borrador') returning id`,
      [slug, 'Contenido de prueba suficientemente largo para cumplir la regla del mínimo de caracteres.'],
    ),
  );
  const id = rows[0].id;
  await as(db, admin, async () => {
    await db.query(`insert into public.legal_resource_sources (resource_id, label, publisher, url, accessed_at) values ($1, 'Ley de prueba', 'Editor', 'https://example.org/ley', current_date)`, [id]);
    if (publicada) {
      await db.query(`update public.legal_resources set status = 'publicado', last_verified_at = current_date, verified_by = $2 where id = $1`, [id, admin.id]);
    }
  });
  return id;
}

beforeAll(async () => {
  db = await createDb();
  admin = await createUser(db, { alias: 'coordinacion_borrar', role: 'admin' });
  user = await createUser(db, { alias: 'persona_comun_b' });
}, 60_000);

describe('borrar guías', () => {
  it('la administración borra una guía publicada con sus fuentes y queda registro', async () => {
    const id = await nuevaGuia('guia-publicada-a-borrar', true);
    const { rows } = await as(db, admin, () => db.query<{ slug: string }>(`select public.delete_legal_resource($1, 'Contenido duplicado') as slug`, [id]));
    expect(rows[0].slug).toBe('guia-publicada-a-borrar');
    expect((await db.query(`select 1 from public.legal_resources where id = $1`, [id])).rows).toEqual([]);
    expect((await db.query(`select 1 from public.legal_resource_sources where resource_id = $1`, [id])).rows).toEqual([]);
    const ev = await db.query<{ previous_status: string; new_status: string; reason: string; internal_note: string; actor_id: string }>(
      `select previous_status, new_status, reason, internal_note, actor_id from public.moderation_events where target_id = $1 and new_status = 'eliminado'`,
      [id],
    );
    expect(ev.rows).toHaveLength(1);
    expect(ev.rows[0]).toMatchObject({ previous_status: 'publicado', reason: 'Contenido duplicado', actor_id: admin.id });
    expect(ev.rows[0].internal_note).toContain('/derechos/guia-publicada-a-borrar');
  });

  it('exige un motivo', async () => {
    const id = await nuevaGuia('guia-sin-motivo', false);
    await expect(as(db, admin, () => db.query(`select public.delete_legal_resource($1, ' ')`, [id]))).rejects.toThrow(/VL072/);
  });

  it('una persona sin rol no puede borrar, ni con la función ni directamente', async () => {
    const id = await nuevaGuia('guia-protegida', true);
    await expect(as(db, user, () => db.query(`select public.delete_legal_resource($1, 'Quiero borrarla')`, [id]))).rejects.toThrow(/VL403/);
    await expect(as(db, 'anon', () => db.query(`select public.delete_legal_resource($1, 'Quiero borrarla')`, [id]))).rejects.toThrow();
    await as(db, user, () => db.query(`delete from public.legal_resources where id = $1`, [id])).catch(() => undefined);
    expect((await db.query(`select 1 from public.legal_resources where id = $1`, [id])).rows).toHaveLength(1);
  });

  it('ni la administración puede borrar sin pasar por la función', async () => {
    const id = await nuevaGuia('guia-borrado-directo', false);
    await expect(as(db, admin, () => db.query(`delete from public.legal_resources where id = $1`, [id]))).rejects.toThrow(/permission denied/);
  });
});
