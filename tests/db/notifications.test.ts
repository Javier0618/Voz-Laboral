// Pruebas de la migración 1500: página pública de una experiencia y avisos
// para quien publica.
import { beforeAll, describe, expect, it } from 'vitest';
import { as, createCompany, createDb, createExperience, createUser, errorOf, SAMPLE_BODY, type Db } from './harness';

let db: Db;
let admin: { id: string; email: string };
let moderator: { id: string; email: string };
let autora: { id: string; email: string };
let lectora: { id: string; email: string };
let companyId: string;
let published: string;
let draft: string;

type Row = { kind: string; count: number; new_status: string | null; read_at: string | null };
const mine = (who: { id: string }) =>
  as(db, who, () => db.query<Row>(`select kind, count, new_status, read_at from public.my_notifications() order by created_at`)).then((r) => r.rows);

beforeAll(async () => {
  db = await createDb();
  admin = await createUser(db, { alias: 'coordinacion_1', role: 'admin' });
  moderator = await createUser(db, { alias: 'revisora_1', role: 'moderator' });
  autora = await createUser(db, { alias: 'ana_turnos' });
  lectora = await createUser(db, { alias: 'lucia_caja' });
  companyId = await createCompany(db, admin, 'Empresa Demo Tres S.A.S.', 'empresa-demo-tres');
  published = await createExperience(db, autora, companyId);
  draft = await createExperience(db, autora, companyId, `${SAMPLE_BODY} Segundo relato en revisión.`);
  await as(db, moderator, () => db.query(`select public.moderate_experience($1, 'publicada', 'Cumple las reglas de publicación.')`, [published]));
}, 60_000);

describe('página pública de una experiencia', () => {
  it('devuelve una experiencia publicada sin datos de la cuenta', async () => {
    const { rows } = await as(db, 'anon', () => db.query(`select * from public.get_public_experience($1)`, [published]));
    expect(rows).toHaveLength(1);
    expect(JSON.stringify(rows[0])).not.toContain(autora.id);
    expect(rows[0]).toMatchObject({ author_alias: 'ana_turnos', status: 'publicada' });
  });

  it('no devuelve experiencias en revisión', async () => {
    const { rows } = await as(db, 'anon', () => db.query(`select * from public.get_public_experience($1)`, [draft]));
    expect(rows).toEqual([]);
  });
});

describe('avisos', () => {
  it('la moderación genera un aviso de cambio de estado para la autora', async () => {
    const rows = await mine(autora);
    expect(rows).toEqual([{ kind: 'estado', count: 1, new_status: 'publicada', read_at: null }]);
  });

  it('retirar la propia experiencia no genera aviso', async () => {
    const own = await createExperience(db, autora, companyId, `${SAMPLE_BODY} Tercer relato que retiraré.`);
    await as(db, autora, () => db.query(`select public.withdraw_my_experience($1)`, [own]));
    const rows = await mine(autora);
    expect(rows.filter((r) => r.new_status === 'retirada')).toEqual([]);
  });

  it('las reacciones y los comentarios de otras personas se agrupan en un aviso no leído', async () => {
    await as(db, lectora, () => db.query(`insert into public.experience_reactions (experience_id, kind) values ($1, 'me_paso'), ($1, 'gracias')`, [published]));
    await as(db, lectora, () => db.query(`insert into public.experience_comments (experience_id, body) values ($1, 'Gracias por contarlo.')`, [published]));
    await as(db, lectora, () => db.query(`insert into public.experience_comments (experience_id, body) values ($1, 'A mí también me pasó.')`, [published]));
    const rows = await mine(autora);
    expect(rows.find((r) => r.kind === 'reaccion')?.count).toBe(2);
    expect(rows.find((r) => r.kind === 'comentario')?.count).toBe(2);
  });

  it('reaccionar o comentar en lo propio no genera aviso', async () => {
    const before = (await mine(autora)).length;
    await as(db, autora, () => db.query(`insert into public.experience_reactions (experience_id, kind) values ($1, 'me_sirvio')`, [published]));
    await as(db, autora, () => db.query(`insert into public.experience_comments (experience_id, body) values ($1, 'Respondo como autora.')`, [published]));
    const after = await mine(autora);
    expect(after.length).toBe(before);
    expect(after.find((r) => r.kind === 'reaccion')?.count).toBe(2);
  });

  it('un comentario retenido solo avisa cuando la moderación lo publica', async () => {
    await as(db, autora, () => db.query(`select public.mark_notifications_read()`));
    await as(db, lectora, () => db.query(`insert into public.experience_comments (experience_id, body) values ($1, 'Escríbanme a lucia@correo.co')`, [published]));
    expect((await mine(autora)).filter((r) => r.read_at === null)).toEqual([]);
    const { rows } = await db.query<{ id: string }>(`select id from public.experience_comments where status = 'retenido' limit 1`);
    await as(db, moderator, () => db.query(`select public.moderate_comment($1, 'publicado', 'El correo es institucional y público.')`, [rows[0].id]));
    expect((await mine(autora)).filter((r) => r.read_at === null).map((r) => r.kind)).toEqual(['comentario']);
  });

  it('marcar como leído y el contador solo afectan a los avisos propios', async () => {
    const unread = await as(db, autora, () => db.query<{ n: number }>(`select public.unread_notifications_count() as n`));
    expect(unread.rows[0].n).toBe(1);
    await as(db, lectora, () => db.query(`select public.mark_notifications_read()`));
    const still = await as(db, autora, () => db.query<{ n: number }>(`select public.unread_notifications_count() as n`));
    expect(still.rows[0].n).toBe(1);
    await as(db, autora, () => db.query(`select public.mark_notifications_read()`));
    const none = await as(db, autora, () => db.query<{ n: number }>(`select public.unread_notifications_count() as n`));
    expect(none.rows[0].n).toBe(0);
  });

  it('nadie lee ni escribe avisos ajenos', async () => {
    expect(await errorOf(as(db, 'anon', () => db.query(`select * from public.notifications`)))).toMatch(/permission denied/);
    const other = await as(db, lectora, () => db.query(`select id from public.notifications`));
    expect(other.rows).toEqual([]);
    expect(
      await errorOf(as(db, lectora, () => db.query(`insert into public.notifications (user_id, kind, experience_id) values ($1, 'estado', $2)`, [autora.id, published]))),
    ).toMatch(/permission denied/);
    expect(await errorOf(as(db, lectora, () => db.query(`update public.notifications set read_at = now()`)))).toMatch(/permission denied/);
    expect(await errorOf(as(db, 'anon', () => db.query(`select public.my_notifications()`)))).toMatch(/permission denied/);
  });
});

describe('respuestas a comentarios', () => {
  let parentId: string;

  beforeAll(async () => {
    await as(db, lectora, () => db.query(`insert into public.experience_comments (experience_id, body) values ($1, 'Comentario al que responderán.')`, [published]));
    const { rows } = await as(db, lectora, () => db.query<{ id: string }>(`select id from public.list_comments($1) where body = 'Comentario al que responderán.'`, [published]));
    parentId = rows[0].id;
    await as(db, lectora, () => db.query(`select public.mark_notifications_read()`));
    await as(db, autora, () => db.query(`select public.mark_notifications_read()`));
  });

  it('se responde a un comentario y la respuesta indica a qué comentario responde', async () => {
    const tercera = await createUser(db, { alias: 'tercera_vez' });
    await as(db, tercera, () => db.query(`insert into public.experience_comments (experience_id, parent_id, body) values ($1, $2, 'Te respondo a ti.')`, [published, parentId]));
    const { rows } = await as(db, 'anon', () => db.query<{ parent_id: string }>(`select parent_id from public.list_comments($1) where body = 'Te respondo a ti.'`, [published]));
    expect(rows[0].parent_id).toBe(parentId);
  });

  it('avisa a quien escribió el comentario y al autor de la experiencia', async () => {
    const lect = await mine(lectora);
    expect(lect.filter((r) => r.read_at === null).map((r) => r.kind)).toEqual(['respuesta']);
    const aut = await mine(autora);
    expect(aut.filter((r) => r.read_at === null).map((r) => r.kind)).toEqual(['comentario']);
  });

  it('no se responde a una respuesta ni a un comentario de otra experiencia', async () => {
    const { rows } = await as(db, 'anon', () => db.query<{ id: string }>(`select id from public.list_comments($1) where body = 'Te respondo a ti.'`, [published]));
    expect(
      await errorOf(as(db, autora, () => db.query(`insert into public.experience_comments (experience_id, parent_id, body) values ($1, $2, 'Respuesta a respuesta.')`, [published, rows[0].id]))),
    ).toMatch(/VL063/);
    const otraAutora = await createUser(db, { alias: 'otra_autora' });
    const other = await createExperience(db, otraAutora, companyId, `${SAMPLE_BODY} Otro relato publicado para respuestas.`);
    await as(db, moderator, () => db.query(`select public.moderate_experience($1, 'publicada', 'Cumple las reglas de publicación.')`, [other]));
    expect(
      await errorOf(as(db, lectora, () => db.query(`insert into public.experience_comments (experience_id, parent_id, body) values ($1, $2, 'Cruzado.')`, [other, parentId]))),
    ).toMatch(/VL063/);
  });
});

describe('balance de tono en el perfil de empresa', () => {
  it('oculta el balance con menos de 3 experiencias y lo muestra a partir de 3', async () => {
    const solo = await createCompany(db, admin, 'Empresa Demo Cuatro S.A.S.', 'empresa-demo-cuatro');
    const ids: string[] = [];
    for (let i = 0; i < 3; i++) {
      const author = await createUser(db, { alias: `persona_balance_${i}` });
      const id = await createExperience(db, author, solo, `${SAMPLE_BODY} Balance ${i}.`);
      await as(db, moderator, () => db.query(`select public.moderate_experience($1, 'publicada', 'Cumple las reglas de publicación.')`, [id]));
      ids.push(id);
      if (i === 1) {
        const p = await as(db, 'anon', () => db.query<{ p: { tones: unknown } }>(`select public.company_profile('empresa-demo-cuatro') as p`));
        expect(p.rows[0].p.tones).toBeNull();
      }
    }
    await db.query(`update public.experiences set tone = 'positiva' where id = $1`, [ids[0]]);
    const p = await as(db, 'anon', () => db.query<{ p: { tones: Record<string, number>; categories: { positiva: number; count: number }[] } }>(`select public.company_profile('empresa-demo-cuatro') as p`));
    expect(p.rows[0].p.tones).toEqual({ positiva: 1, mixta: 2, negativa: 0 });
    expect(p.rows[0].p.categories[0]).toMatchObject({ count: 3, positiva: 1 });
  });
});
