// Pruebas de seguridad de lo añadido en la migración 1400: tono, envíos sin
// cuenta con enlace de seguimiento, reacciones y comentarios.
import { beforeAll, describe, expect, it } from 'vitest';
import { as, createCompany, createDb, createExperience, createUser, errorOf, SAMPLE_BODY, type Db } from './harness';

let db: Db;
let admin: { id: string; email: string };
let moderator: { id: string; email: string };
let autora: { id: string; email: string };
let lectora: { id: string; email: string };
let sinAlias: { id: string; email: string };
let companyId: string;
let published: string;

const anonBody = (n: number) => `${SAMPLE_BODY} Envío sin cuenta número ${n}.`;

async function publish(id: string) {
  await as(db, moderator, () => db.query(`select public.moderate_experience($1, 'publicada', 'Cumple las reglas de publicación.')`, [id]));
}

async function submitAnonymous(body: string, tone = 'positiva') {
  const { rows } = await as(db, 'anon', () =>
    db.query<{ r: { id: string; token: string } }>(
      `select public.submit_anonymous_experience($1, 'pago-salarios', $2, date '2025-01-01', null, 'anterior', null, $3, false, true) as r`,
      [companyId, tone, body],
    ),
  );
  return rows[0].r;
}

beforeAll(async () => {
  db = await createDb();
  admin = await createUser(db, { alias: 'coordinacion_1', role: 'admin' });
  moderator = await createUser(db, { alias: 'revisora_1', role: 'moderator' });
  autora = await createUser(db, { alias: 'ana_turnos' });
  lectora = await createUser(db, { alias: 'lucia_caja' });
  sinAlias = await createUser(db);
  companyId = await createCompany(db, admin, 'Empresa Demo Dos S.A.S.', 'empresa-demo-dos');
  published = await createExperience(db, autora, companyId);
  await publish(published);
}, 60_000);

describe('tono y categorías', () => {
  it('las experiencias tienen tono y se pueden filtrar por él', async () => {
    const { rows } = await as(db, 'anon', () =>
      db.query<{ tone: string }>(`select tone from public.list_experiences(p_tone => 'mixta')`),
    );
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.tone === 'mixta')).toBe(true);
    const draft = await createExperience(db, autora, companyId, `${SAMPLE_BODY} Borrador para probar el tono.`);
    expect(await errorOf(as(db, autora, () => db.query(`update public.experiences set tone = 'feliz' where id = $1`, [draft])))).toMatch(
      /experiences_tone_check/,
    );
  });

  it('las categorías tienen nombres neutros', async () => {
    const { rows } = await db.query<{ name: string }>(`select name from public.experience_categories where slug = 'pago-salarios'`);
    expect(rows[0].name).toBe('Salario y pagos');
  });
});

describe('envíos sin cuenta', () => {
  it('se puede compartir sin cuenta y queda en revisión con un enlace de seguimiento', async () => {
    const r = await submitAnonymous(anonBody(1));
    expect(r.token).toMatch(/^[0-9a-f]{64}$/);
    const track = await as(db, 'anon', () => db.query<{ t: { status: string; tone: string } }>(`select public.get_tracked_experience($1) as t`, [r.token]));
    expect(track.rows[0].t.status).toBe('en_revision');
    expect(track.rows[0].t.tone).toBe('positiva');
  });

  it('solo se guarda el hash del token, nunca el token', async () => {
    const r = await submitAnonymous(anonBody(2));
    const { rows } = await db.query<{ tracking_hash: string }>(`select tracking_hash from public.experiences where id = $1`, [r.id]);
    expect(rows[0].tracking_hash).not.toBe(r.token);
    expect(rows[0].tracking_hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('nadie puede leer el hash de seguimiento ni insertar sin cuenta directamente', async () => {
    expect(await errorOf(as(db, 'anon', () => db.query(`select tracking_hash from public.experiences`)))).toMatch(/permission denied/);
    expect(await errorOf(as(db, lectora, () => db.query(`select tracking_hash from public.experiences`)))).toMatch(/permission denied/);
    expect(
      await errorOf(as(db, 'anon', () => db.query(
        `insert into public.experiences (company_id, category_slug, period_start, relationship, body, rules_accepted) values ($1, 'otras', date '2025-01-01', 'anterior', $2, true)`,
        [companyId, anonBody(3)],
      ))),
    ).toMatch(/permission denied/);
  });

  it('un token inventado no devuelve nada', async () => {
    const { rows } = await as(db, 'anon', () => db.query<{ t: unknown }>(`select public.get_tracked_experience($1) as t`, ['0'.repeat(64)]));
    expect(rows[0].t).toBeNull();
  });

  it('rechaza el mismo texto enviado dos veces sin cuenta', async () => {
    await submitAnonymous(anonBody(4));
    expect(await errorOf(submitAnonymous(anonBody(4)))).toMatch(/VL035/);
  });

  it('una sesión iniciada debe compartir desde su cuenta', async () => {
    expect(
      await errorOf(as(db, lectora, () => db.query(
        `select public.submit_anonymous_experience($1, 'pago-salarios', 'mixta', date '2025-01-01', null, 'anterior', null, $2, false, true)`,
        [companyId, anonBody(5)],
      ))),
    ).toMatch(/VL038/);
  });

  it('quien tiene el enlace puede vincular la experiencia a su cuenta, una sola vez', async () => {
    const r = await submitAnonymous(anonBody(6));
    expect(await errorOf(as(db, sinAlias, () => db.query(`select public.claim_tracked_experience($1)`, [r.token])))).toMatch(/VL030/);
    await as(db, lectora, () => db.query(`select public.claim_tracked_experience($1)`, [r.token]));
    const mine = await as(db, lectora, () => db.query<{ id: string }>(`select id from public.my_experiences()`));
    expect(mine.rows.map((x) => x.id)).toContain(r.id);
    expect(await errorOf(as(db, autora, () => db.query(`select public.claim_tracked_experience($1)`, [r.token])))).toMatch(/VL404/);
  });

  it('se muestra como «Persona sin cuenta» al publicarse', async () => {
    const r = await submitAnonymous(anonBody(7));
    await publish(r.id);
    const { rows } = await as(db, 'anon', () =>
      db.query<{ author_alias: string }>(`select author_alias from public.list_experiences() where id = $1`, [r.id]),
    );
    expect(rows[0].author_alias).toBe('Persona sin cuenta');
  });
});

describe('reacciones', () => {
  it('sin cuenta no se puede reaccionar, pero sí ver los totales', async () => {
    expect(
      await errorOf(as(db, 'anon', () => db.query(`insert into public.experience_reactions (experience_id, kind) values ($1, 'gracias')`, [published]))),
    ).toMatch(/permission denied/);
    const { rows } = await as(db, 'anon', () => db.query<{ gracias: number }>(`select gracias from public.experience_engagement(array[$1::uuid])`, [published]));
    expect(Number(rows[0].gracias)).toBe(0);
  });

  it('una cuenta reacciona una vez por tipo y puede quitar su reacción', async () => {
    await as(db, lectora, () => db.query(`insert into public.experience_reactions (experience_id, kind) values ($1, 'me_paso')`, [published]));
    expect(
      await errorOf(as(db, lectora, () => db.query(`insert into public.experience_reactions (experience_id, kind) values ($1, 'me_paso')`, [published]))),
    ).toMatch(/duplicate key|unique/);
    const eng = await as(db, lectora, () => db.query<{ me_paso: number; my_reactions: string[] }>(`select me_paso, my_reactions from public.experience_engagement(array[$1::uuid])`, [published]));
    expect(Number(eng.rows[0].me_paso)).toBe(1);
    expect(eng.rows[0].my_reactions).toEqual(['me_paso']);
    await as(db, lectora, () => db.query(`delete from public.experience_reactions where experience_id = $1 and kind = 'me_paso'`, [published]));
  });

  it('no se puede reaccionar en nombre de otra cuenta ni a experiencias no publicadas', async () => {
    expect(
      await errorOf(as(db, lectora, () => db.query(`insert into public.experience_reactions (experience_id, user_id, kind) values ($1, $2, 'gracias')`, [published, autora.id]))),
    ).toMatch(/permission denied/);
    const draft = await createExperience(db, autora, companyId, `${SAMPLE_BODY} Borrador para reaccionar.`);
    expect(
      await errorOf(as(db, lectora, () => db.query(`insert into public.experience_reactions (experience_id, kind) values ($1, 'gracias')`, [draft]))),
    ).toMatch(/row-level security/);
  });

  it('nadie ve quién reaccionó', async () => {
    await as(db, autora, () => db.query(`insert into public.experience_reactions (experience_id, kind) values ($1, 'gracias')`, [published]));
    const { rows } = await as(db, lectora, () => db.query(`select * from public.experience_reactions where experience_id = $1`, [published]).catch((e) => ({ rows: [e.message] })));
    expect(JSON.stringify(rows)).not.toContain(autora.id);
  });
});

describe('comentarios', () => {
  it('con cuenta se comenta y se publica al instante', async () => {
    await as(db, lectora, () => db.query(`insert into public.experience_comments (experience_id, body) values ($1, 'A mí me pasó algo parecido en otra sede.')`, [published]));
    const { rows } = await as(db, 'anon', () => db.query<{ author_alias: string; body: string }>(`select author_alias, body from public.list_comments($1)`, [published]));
    expect(rows).toEqual([{ author_alias: 'lucia_caja', body: 'A mí me pasó algo parecido en otra sede.' }]);
  });

  it('sin cuenta o sin alias no se puede comentar', async () => {
    expect(
      await errorOf(as(db, 'anon', () => db.query(`insert into public.experience_comments (experience_id, body) values ($1, 'Hola')`, [published]))),
    ).toMatch(/permission denied/);
    expect(
      await errorOf(as(db, sinAlias, () => db.query(`insert into public.experience_comments (experience_id, body) values ($1, 'Hola')`, [published]))),
    ).toMatch(/VL060/);
  });

  it('un comentario con datos personales queda retenido y solo lo ve quien lo escribió', async () => {
    await as(db, lectora, () => db.query(`insert into public.experience_comments (experience_id, body) values ($1, 'Escríbanle al jefe: jefe@empresa.com')`, [published]));
    const pub = await as(db, 'anon', () => db.query<{ body: string }>(`select body from public.list_comments($1)`, [published]));
    expect(pub.rows.map((r) => r.body)).not.toContain('Escríbanle al jefe: jefe@empresa.com');
    const own = await as(db, lectora, () => db.query<{ body: string; status: string }>(`select body, status from public.list_comments($1) where status = 'retenido'`, [published]));
    expect(own.rows).toHaveLength(1);
  });

  it('los comentarios no exponen identificadores de cuenta', async () => {
    expect(await errorOf(as(db, lectora, () => db.query(`select author_id from public.experience_comments`)))).toMatch(/permission denied/);
    const { rows } = await as(db, 'anon', () => db.query(`select * from public.list_comments($1)`, [published]));
    expect(JSON.stringify(rows)).not.toContain(lectora.id);
  });

  it('el autor puede desactivar los comentarios; otra cuenta no', async () => {
    expect(await errorOf(as(db, lectora, () => db.query(`select public.set_comments_enabled($1, false)`, [published])))).toMatch(/VL404/);
    await as(db, autora, () => db.query(`select public.set_comments_enabled($1, false)`, [published]));
    expect(
      await errorOf(as(db, lectora, () => db.query(`insert into public.experience_comments (experience_id, body) values ($1, 'Otro comentario')`, [published]))),
    ).toMatch(/VL061/);
    const { rows } = await db.query<{ status: string }>(`select status from public.experiences where id = $1`, [published]);
    expect(rows[0].status).toBe('publicada');
    await as(db, autora, () => db.query(`select public.set_comments_enabled($1, true)`, [published]));
  });

  it('se pueden reportar comentarios visibles y solo la moderación los oculta', async () => {
    const c = await as(db, lectora, () => db.query<{ id: string }>(`select id from public.list_comments($1) where status = 'publicado' limit 1`, [published]));
    const commentId = c.rows[0].id;
    await as(db, autora, () => db.query(`insert into public.content_reports (experience_id, comment_id, reason) values ($1, $2, 'otro')`, [published, commentId]));
    expect(await errorOf(as(db, autora, () => db.query(`select public.moderate_comment($1, 'oculto', 'Motivo suficientemente largo')`, [commentId])))).toMatch(/VL403/);
    expect(await errorOf(as(db, lectora, () => db.query(`select public.moderate_comment($1, 'oculto', 'Motivo suficientemente largo')`, [commentId])))).toMatch(/VL403/);
    const reported = await as(db, moderator, () => db.query<{ id: string }>(`select id from public.moderation_comments('reportados')`));
    expect(reported.rows.map((r) => r.id)).toContain(commentId);
    await as(db, moderator, () => db.query(`select public.moderate_comment($1, 'oculto', 'Incluye una acusación sin relación con la experiencia.')`, [commentId]));
    const { rows } = await db.query<{ n: number }>(`select count(*)::int as n from public.moderation_events where target_type = 'comment' and target_id = $1`, [commentId]);
    expect(rows[0].n).toBe(1);
  });

  it('quien comentó puede borrar su comentario; otra cuenta no', async () => {
    const body = 'Comentario que luego borraré.';
    await as(db, lectora, () => db.query(`insert into public.experience_comments (experience_id, body) values ($1, $2)`, [published, body]));
    const mine = await as(db, lectora, () => db.query<{ id: string }>(`select id from public.list_comments($1) where is_mine and body = $2`, [published, body]));
    const id = mine.rows[0].id;
    expect(await errorOf(as(db, autora, () => db.query(`select public.delete_my_comment($1)`, [id])))).toMatch(/VL404/);
    await as(db, lectora, () => db.query(`select public.delete_my_comment($1)`, [id]));
    const left = await as(db, 'anon', () => db.query<{ id: string }>(`select id from public.list_comments($1)`, [published]));
    expect(left.rows.map((r) => r.id)).not.toContain(id);
  });

});
