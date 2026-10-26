// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest';
import { createDb, createUser, rows, LONG_TEXT, type Db } from './harness';

const ALICE = '11111111-1111-1111-1111-111111111111';
const BOB = '22222222-2222-2222-2222-222222222222';
const MOD = '33333333-3333-3333-3333-333333333333';
const ADMIN = '44444444-4444-4444-4444-444444444444';
const REP = '55555555-5555-5555-5555-555555555555';

let db: Db;
let companyId: string;

async function insertExperience(userId: string, overrides: Record<string, unknown> = {}, text = LONG_TEXT) {
  const values = {
    author_id: userId,
    company_id: companyId,
    category_id: 1,
    period_start: '2025-01-01',
    relationship: 'anterior',
    account_direct: text,
    ...overrides,
  };
  const cols = Object.keys(values);
  const params = Object.values(values);
  const sql = `insert into public.experiences (${cols.join(', ')})
               values (${cols.map((_, i) => `$${i + 1}`).join(', ')}) returning id, status`;
  const [row] = await rows<{ id: string; status: string }>(db, 'authenticated', userId, sql, params);
  return row;
}

async function moderate(userId: string, experienceId: string, status: string, reason = 'Cumple las reglas') {
  return rows<{ moderate_experience: string }>(
    db,
    'authenticated',
    userId,
    'select public.moderate_experience($1, $2::public.experience_status, $3, $4)',
    [experienceId, status, reason, 'Nota interna de prueba'],
  );
}

beforeAll(async () => {
  db = await createDb();
  await createUser(db, ALICE, 'alicia.prueba@example.test', 'Trabajadora_Norte');
  await createUser(db, BOB, 'bob.prueba@example.test', 'Operario_Sur');
  await createUser(db, MOD, 'mod.prueba@example.test', 'Revisora_Uno');
  await createUser(db, ADMIN, 'adm.prueba@example.test', 'Gestora_Dos');
  await createUser(db, REP, 'rep.prueba@example.test', 'Representante_Ficticio');
  await db.exec(`
    insert into public.admin_roles (user_id, role) values
      ('${MOD}', 'moderator'), ('${ADMIN}', 'admin');
    insert into public.companies (name, slug, city, sector, status)
      values ('Empresa Ficticia de Prueba S.A.S.', 'empresa-ficticia-de-prueba', 'Bogotá', 'Servicios', 'activa');
  `);
  companyId = (await db.query<{ id: string }>('select id from public.companies limit 1')).rows[0].id;
});

describe('perfiles y alias', () => {
  it('crea el perfil con el alias al registrarse', async () => {
    const r = await rows(db, 'authenticated', ALICE, 'select alias from public.profiles where id = $1', [ALICE]);
    expect(r).toEqual([{ alias: 'Trabajadora_Norte' }]);
  });

  it('rechaza alias duplicado sin distinguir mayúsculas', async () => {
    await expect(
      rows(db, 'authenticated', BOB, `update public.profiles set alias = 'trabajadora_norte' where id = $1`, [BOB]),
    ).rejects.toThrow(/duplicate key|unique/i);
  });

  it('rechaza palabras reservadas', async () => {
    await expect(
      rows(db, 'authenticated', BOB, `update public.profiles set alias = 'ElAdmin77' where id = $1`, [BOB]),
    ).rejects.toThrow(/reservada/);
    await expect(
      rows(db, 'authenticated', BOB, `update public.profiles set alias = 'Equipo_VozLaboral' where id = $1`, [BOB]),
    ).rejects.toThrow(/reservada/);
  });

  it('rechaza alias parecido al correo', async () => {
    await expect(
      rows(db, 'authenticated', BOB, `update public.profiles set alias = 'Bob_Prueba' where id = $1`, [BOB]),
    ).rejects.toThrow(/correo/);
  });

  it('un usuario no ve el perfil de otro', async () => {
    const r = await rows(db, 'authenticated', BOB, 'select id from public.profiles where id = $1', [ALICE]);
    expect(r).toEqual([]);
  });
});

describe('publicaciones', () => {
  let aliceExp: string;

  beforeAll(async () => {
    aliceExp = (await insertExperience(ALICE)).id;
  });

  it('la experiencia nueva queda en revisión aunque el cliente pida publicada', async () => {
    await expect(insertExperience(ALICE, { status: 'publicada' }, LONG_TEXT + ' Segundo intento.')).rejects.toThrow(
      /permission denied/,
    );
    const r = await rows<{ status: string }>(db, 'authenticated', ALICE,
      'select status from public.experiences where id = $1', [aliceExp]);
    expect(r[0].status).toBe('en_revision');
  });

  it('un usuario no ve publicaciones no publicadas de otra cuenta', async () => {
    const base = await rows(db, 'authenticated', BOB, 'select id from public.experiences where id = $1', [aliceExp]);
    expect(base).toEqual([]);
    const view = await rows(db, 'authenticated', BOB, 'select id from public.public_experiences where id = $1', [aliceExp]);
    expect(view).toEqual([]);
  });

  it('no puede suplantar el author_id', async () => {
    await expect(insertExperience(BOB, { author_id: ALICE }, LONG_TEXT + ' Suplantación.')).rejects.toThrow(
      /otra cuenta|row-level security/,
    );
    await expect(
      rows(db, 'authenticated', ALICE, 'update public.experiences set author_id = $1 where id = $2', [BOB, aliceExp]),
    ).rejects.toThrow(/permission denied/);
  });

  it('no puede aprobar su propio contenido', async () => {
    await expect(
      rows(db, 'authenticated', ALICE, `update public.experiences set status = 'publicada' where id = $1`, [aliceExp]),
    ).rejects.toThrow(/permission denied/);
    await expect(moderate(ALICE, aliceExp, 'publicada')).rejects.toThrow(/permisos de moderación/);
  });

  it('un moderador tampoco puede aprobar lo que él mismo escribió', async () => {
    const modExp = (await insertExperience(MOD, {}, LONG_TEXT + ' Texto del moderador.')).id;
    await expect(moderate(MOD, modExp, 'publicada')).rejects.toThrow(/propio contenido/);
  });

  it('rechaza relatos fuera de 200 a 5000 caracteres', async () => {
    await expect(insertExperience(BOB, {}, 'Demasiado corto.')).rejects.toThrow(/experiences_account_length/);
    await expect(insertExperience(BOB, {}, 'x'.repeat(5001))).rejects.toThrow(/experiences_account_length/);
  });

  it('rechaza el mismo relato dos veces por el mismo autor', async () => {
    await expect(insertExperience(ALICE, { category_id: 2 })).rejects.toThrow(/duplicate key|unique/i);
  });

  it('limita a 3 publicaciones cada 24 horas', async () => {
    await insertExperience(BOB, {}, LONG_TEXT + ' Uno.');
    await insertExperience(BOB, {}, LONG_TEXT + ' Dos.');
    await insertExperience(BOB, {}, LONG_TEXT + ' Tres.');
    await expect(insertExperience(BOB, {}, LONG_TEXT + ' Cuatro.')).rejects.toThrow(/límite de 3/);
  });

  it('un moderador puede moderar y queda registro completo', async () => {
    const [r] = await moderate(MOD, aliceExp, 'publicada', 'Cumple las reglas de la comunidad');
    expect(r.moderate_experience).toBe('publicada');

    const events = await rows<Record<string, unknown>>(db, 'authenticated', MOD,
      `select previous_status, new_status, reason, internal_note, moderator_id, created_at
       from public.moderation_events where entity_type = 'experience' and entity_id = $1`, [aliceExp]);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      previous_status: 'en_revision',
      new_status: 'publicada',
      reason: 'Cumple las reglas de la comunidad',
      internal_note: 'Nota interna de prueba',
      moderator_id: MOD,
    });
    expect(events[0].created_at).toBeInstanceOf(Date);

    const pub = await rows<{ author_alias: string }>(db, 'anon', null,
      'select * from public.public_experiences where id = $1', [aliceExp]);
    expect(pub).toHaveLength(1);
    expect(pub[0].author_alias).toBe('Trabajadora_Norte');
    expect(Object.keys(pub[0])).not.toContain('author_id');
  });

  it('el autor ve el motivo pero no la nota interna', async () => {
    const r = await rows<{ status: string; moderation_reason: string }>(db, 'authenticated', ALICE,
      'select status, moderation_reason from public.experiences where id = $1', [aliceExp]);
    expect(r[0]).toEqual({ status: 'publicada', moderation_reason: 'Cumple las reglas de la comunidad' });
    const events = await rows(db, 'authenticated', ALICE, 'select * from public.moderation_events');
    expect(events).toEqual([]);
  });

  it('el autor no puede editar una experiencia publicada', async () => {
    await expect(
      rows(db, 'authenticated', ALICE, `update public.experiences set title = 'Nuevo' where id = $1 returning id`, [aliceExp]),
    ).resolves.toEqual([]);
  });

  it('al editar tras requerir ajustes vuelve a revisión y queda registro', async () => {
    const exp = (await insertExperience(ALICE, { category_id: 3 }, LONG_TEXT + ' Ajustable.')).id;
    await moderate(MOD, exp, 'requiere_ajustes', 'Quita el nombre de la persona');
    await rows(db, 'authenticated', ALICE,
      `update public.experiences set account_direct = $1 where id = $2`, [LONG_TEXT + ' Ajustado.', exp]);
    const r = await rows<{ status: string }>(db, 'authenticated', ALICE,
      'select status from public.experiences where id = $1', [exp]);
    expect(r[0].status).toBe('en_revision');
    const events = await rows<{ new_status: string }>(db, 'authenticated', MOD,
      `select new_status from public.moderation_events where entity_id = $1 order by id`, [exp]);
    expect(events.map((e) => e.new_status)).toEqual(['requiere_ajustes', 'en_revision']);
  });
});

describe('roles y auditoría', () => {
  it('no puede asignarse un rol', async () => {
    await expect(
      rows(db, 'authenticated', BOB, `insert into public.admin_roles (user_id, role) values ($1, 'admin')`, [BOB]),
    ).rejects.toThrow(/permission denied/);
    await expect(
      rows(db, 'authenticated', MOD, `update public.admin_roles set role = 'admin' where user_id = $1`, [MOD]),
    ).rejects.toThrow(/permission denied/);
    await expect(
      rows(db, 'authenticated', BOB, `select public.admin_set_role($1, 'admin')`, [BOB]),
    ).rejects.toThrow(/Solo la administración/);
    await expect(
      rows(db, 'authenticated', MOD, `select public.admin_set_role($1, 'admin')`, [MOD]),
    ).rejects.toThrow(/Solo la administración/);
    const r = await db.query('select role from public.admin_roles where user_id = $1', [BOB]);
    expect(r.rows).toEqual([]);
  });

  it('un admin asigna roles a otros, no a sí mismo, y queda registro', async () => {
    await rows(db, 'authenticated', ADMIN, `select public.admin_set_role($1, 'moderator')`, [REP]);
    await expect(
      rows(db, 'authenticated', ADMIN, `select public.admin_set_role($1, null)`, [ADMIN]),
    ).rejects.toThrow(/propio rol/);
    const ev = await rows<{ event_type: string }>(db, 'authenticated', ADMIN,
      `select event_type from public.security_events where event_type = 'role_changed'`);
    expect(ev).toHaveLength(1);
    await rows(db, 'authenticated', ADMIN, `select public.admin_set_role($1, null)`, [REP]);
  });

  it('moderation_events es inmutable', async () => {
    for (const userId of [ALICE, MOD, ADMIN]) {
      await expect(
        rows(db, 'authenticated', userId, `update public.moderation_events set reason = 'alterado'`),
      ).rejects.toThrow(/permission denied/);
      await expect(
        rows(db, 'authenticated', userId, `delete from public.moderation_events`),
      ).rejects.toThrow(/permission denied/);
      await expect(
        rows(db, 'authenticated', userId,
          `insert into public.moderation_events (entity_type, entity_id, new_status, reason)
           values ('experience', gen_random_uuid(), 'publicada', 'falso')`),
      ).rejects.toThrow(/permission denied/);
    }
    // Ni siquiera el propietario de la tabla puede modificarla.
    await expect(db.query(`update public.moderation_events set reason = 'alterado'`)).rejects.toThrow(/solo inserción/);
    await expect(db.query(`delete from public.moderation_events`)).rejects.toThrow(/solo inserción/);
  });

  it('security_events es inmutable', async () => {
    await expect(
      rows(db, 'authenticated', ADMIN, `delete from public.security_events`),
    ).rejects.toThrow(/permission denied/);
    await expect(db.query(`update public.security_events set event_type = 'otro'`)).rejects.toThrow(/solo inserción/);
  });

  it('las RPC administrativas fallan sin rol', async () => {
    const someId = '99999999-9999-9999-9999-999999999999';
    const calls = [
      [`select public.moderate_experience($1, 'publicada', 'motivo', null)`, [someId]],
      [`select public.set_company_status($1, 'oculta', 'motivo', null)`, [companyId]],
      [`select public.add_company_alias($1, 'Alias')`, [companyId]],
      [`select public.resolve_report($1, 'resuelto', 'motivo', null)`, [someId]],
      [`select public.review_company_claim($1, 'aprobada', 'motivo', null)`, [someId]],
      [`select public.moderate_company_response($1, 'publicada', 'motivo', null)`, [someId]],
      [`select public.resolve_appeal($1, 'aceptada', 'motivo', null)`, [someId]],
      [`select public.process_account_deletion($1)`, [someId]],
    ] as const;
    for (const [sql, params] of calls) {
      await expect(rows(db, 'authenticated', BOB, sql, [...params])).rejects.toThrow(/permisos|Solo la administración/);
      await expect(rows(db, 'anon', null, sql, [...params])).rejects.toThrow(/permission denied/);
    }
  });
});

describe('acceso anónimo', () => {
  it('anon no ve emails, borradores, reclamaciones ni moderación', async () => {
    const denied = [
      'select email from auth.users',
      'select * from public.profiles',
      'select * from public.experiences',
      'select * from public.company_claims',
      'select * from public.moderation_events',
      'select * from public.security_events',
      'select * from public.admin_roles',
      'select * from public.content_reports',
      'select * from public.appeals',
      'select * from public.evidence_files',
      'select proposed_by from public.companies',
    ];
    for (const sql of denied) {
      await expect(rows(db, 'anon', null, sql)).rejects.toThrow(/permission denied/);
    }
    const drafts = await rows(db, 'anon', null,
      `select id from public.public_experiences where status not in ('publicada', 'en_disputa')`);
    expect(drafts).toEqual([]);
  });

  it('anon no puede escribir', async () => {
    await expect(
      rows(db, 'anon', null, `insert into public.companies (name, slug) values ('X', 'x')`),
    ).rejects.toThrow(/permission denied/);
    await expect(rows(db, 'anon', null, `select public.propose_company('X')`)).rejects.toThrow(/permission denied/);
  });

  it('las vistas públicas no exponen identificadores de cuenta', async () => {
    const cols = await db.query<{ table_name: string; column_name: string }>(`
      select table_name, column_name from information_schema.columns
      where table_schema = 'public' and table_name in ('public_experiences', 'public_company_responses')`);
    const names = cols.rows.map((c) => c.column_name);
    for (const forbidden of ['author_id', 'responder_id', 'email', 'reporter_id', 'content_hash']) {
      expect(names).not.toContain(forbidden);
    }
  });
});

describe('reclamaciones y respuestas de empresas', () => {
  let publishedExp: string;
  let claimId: string;

  beforeAll(async () => {
    publishedExp = (
      await rows<{ id: string }>(db, 'anon', null, 'select id from public.public_experiences limit 1')
    )[0].id;
  });

  it('crea una reclamación de representación sin acceso a los datos del autor', async () => {
    const [c] = await rows<{ id: string }>(db, 'authenticated', REP,
      `insert into public.company_claims
         (company_id, claimant_id, claim_type, claimant_name, claimant_position, contact_email, message)
       values ($1, $2, 'representacion', 'Persona Ficticia', 'Gerencia', 'rrhh@example.test',
               'Represento a la empresa ficticia y quiero responder públicamente.')
       returning id`, [companyId, REP]);
    claimId = c.id;
    await rows(db, 'authenticated', MOD, `select public.review_company_claim($1, 'aprobada', 'Verificada por correo corporativo', null)`, [claimId]);
  });

  it('las reclamaciones no revelan al autor', async () => {
    const base = await rows(db, 'authenticated', REP, 'select author_id from public.experiences where id = $1', [publishedExp]);
    expect(base).toEqual([]);
    await expect(
      rows(db, 'authenticated', REP, 'select * from public.profiles where id = $1', [ALICE]),
    ).resolves.toEqual([]);
    const claim = await rows<Record<string, unknown>>(db, 'authenticated', REP,
      'select * from public.company_claims where id = $1', [claimId]);
    expect(Object.keys(claim[0])).not.toContain('author_id');
    expect(JSON.stringify(claim[0])).not.toContain(ALICE);
  });

  it('otra cuenta no ve reclamaciones ajenas', async () => {
    const r = await rows(db, 'authenticated', BOB, 'select id from public.company_claims');
    expect(r).toEqual([]);
  });

  it('un representante aprobado responde y la respuesta queda en revisión', async () => {
    const [resp] = await rows<{ id: string; status: string }>(db, 'authenticated', REP,
      `insert into public.company_responses (company_id, experience_id, responder_id, body)
       values ($1, $2, $3, 'Gracias por el comentario, revisamos los pagos de ese periodo.') returning id, status`,
      [companyId, publishedExp, REP]);
    expect(resp.status).toBe('en_revision');
    expect(await rows(db, 'anon', null, 'select id from public.public_company_responses')).toEqual([]);
    await rows(db, 'authenticated', MOD, `select public.moderate_company_response($1, 'publicada', 'Respuesta respetuosa', null)`, [resp.id]);
    const pub = await rows<Record<string, unknown>>(db, 'anon', null, 'select * from public.public_company_responses');
    expect(pub).toHaveLength(1);
    expect(Object.keys(pub[0])).not.toContain('responder_id');
  });

  it('quien no representa a la empresa no puede responder', async () => {
    await expect(
      rows(db, 'authenticated', BOB,
        `insert into public.company_responses (company_id, experience_id, responder_id, body)
         values ($1, $2, $3, 'Respuesta falsa en nombre de la empresa.')`, [companyId, publishedExp, BOB]),
    ).rejects.toThrow(/row-level security/);
  });
});

describe('reportes y apelaciones', () => {
  it('cualquier cuenta reporta contenido publicado, una vez', async () => {
    const pub = (await rows<{ id: string }>(db, 'anon', null, 'select id from public.public_experiences limit 1'))[0].id;
    await rows(db, 'authenticated', BOB,
      `insert into public.content_reports (experience_id, reporter_id, reason, details) values ($1, $2, 'datos_personales', 'Aparece un nombre')`,
      [pub, BOB]);
    await expect(
      rows(db, 'authenticated', BOB,
        `insert into public.content_reports (experience_id, reporter_id, reason) values ($1, $2, 'otro')`, [pub, BOB]),
    ).rejects.toThrow(/duplicate key|unique/i);
    expect(await rows(db, 'authenticated', ALICE, 'select id from public.content_reports')).toEqual([]);
  });

  it('no se puede reportar contenido no publicado (no revela su existencia)', async () => {
    const draft = (await rows<{ id: string }>(db, 'authenticated', BOB,
      `select id from public.experiences where author_id = $1 and status = 'en_revision' limit 1`, [BOB]))[0].id;
    await expect(
      rows(db, 'authenticated', ALICE,
        `insert into public.content_reports (experience_id, reporter_id, reason) values ($1, $2, 'otro')`, [draft, ALICE]),
    ).rejects.toThrow(/row-level security/);
  });

  it('el autor apela una restricción; otra cuenta no puede', async () => {
    const exp = (await rows<{ id: string }>(db, 'authenticated', ALICE,
      `select id from public.experiences where author_id = $1 and status = 'publicada' limit 1`, [ALICE]))[0].id;
    await moderate(MOD, exp, 'restringida', 'Contiene datos de terceros');
    await expect(
      rows(db, 'authenticated', BOB,
        `insert into public.appeals (experience_id, appellant_id, reason) values ($1, $2, 'Quiero apelar algo que no es mío.')`, [exp, BOB]),
    ).rejects.toThrow(/row-level security/);
    const [a] = await rows<{ id: string }>(db, 'authenticated', ALICE,
      `insert into public.appeals (experience_id, appellant_id, reason) values ($1, $2, 'Retiré el dato y pido que se revise de nuevo.') returning id`,
      [exp, ALICE]);
    await rows(db, 'authenticated', MOD, `select public.resolve_appeal($1, 'aceptada', 'Se revisará de nuevo', null)`, [a.id]);
    await moderate(MOD, exp, 'publicada', 'Republicada tras apelación');
    const ev = await rows<{ entity_type: string }>(db, 'authenticated', MOD,
      `select entity_type from public.moderation_events where entity_id = $1`, [a.id]);
    expect(ev).toEqual([{ entity_type: 'appeal' }]);
  });
});

describe('estadísticas públicas', () => {
  it('oculta categorías con menos de 3 publicaciones', async () => {
    const [r] = await rows<{ company_stats: { visible_count: number; categories: unknown[]; hidden_categories: number } }>(
      db, 'anon', null, 'select public.company_stats($1)', [companyId]);
    expect(r.company_stats.visible_count).toBe(1);
    expect(r.company_stats.categories).toEqual([]);
    expect(r.company_stats.hidden_categories).toBe(1);
  });

  it('muestra la categoría al llegar a 3', async () => {
    const bobExps = await rows<{ id: string }>(db, 'authenticated', BOB,
      `select id from public.experiences where author_id = $1 and status = 'en_revision'`, [BOB]);
    for (const e of bobExps.slice(0, 2)) await moderate(MOD, e.id, 'publicada');
    const [r] = await rows<{ company_stats: { visible_count: number; categories: { count: number; name: string }[] } }>(
      db, 'anon', null, 'select public.company_stats($1)', [companyId]);
    expect(r.company_stats.visible_count).toBe(3);
    expect(r.company_stats.categories).toEqual([{ category_id: 1, name: 'Pago de salarios', count: 3 }]);
  });

  it('la búsqueda encuentra por nombre aproximado y por alias', async () => {
    await rows(db, 'authenticated', MOD, `select public.add_company_alias($1, 'EFP')`, [companyId]);
    const byName = await rows<{ slug: string; total_count: number }>(db, 'anon', null,
      `select slug, total_count from public.search_companies('ficticia prueba', null, null, 10, 0)`);
    expect(byName[0].slug).toBe('empresa-ficticia-de-prueba');
    const byAlias = await rows<{ slug: string }>(db, 'anon', null,
      `select slug from public.search_companies('efp', 'bogota', null, 10, 0)`);
    expect(byAlias.map((r) => r.slug)).toEqual(['empresa-ficticia-de-prueba']);
    const none = await rows(db, 'anon', null, `select slug from public.search_companies('efp', 'cali', null, 10, 0)`);
    expect(none).toEqual([]);
  });
});

describe('propuesta de empresas', () => {
  it('una empresa propuesta no es pública hasta que se active', async () => {
    const [p] = await rows<{ propose_company: string }>(db, 'authenticated', BOB,
      `select public.propose_company('Compañía Inventada Para Pruebas', 'Medellín', 'Comercio')`);
    expect(await rows(db, 'anon', null, 'select id from public.companies where id = $1', [p.propose_company])).toEqual([]);
    expect(await rows(db, 'authenticated', BOB, 'select id from public.companies where id = $1', [p.propose_company]))
      .toHaveLength(1);
    const [again] = await rows<{ propose_company: string }>(db, 'authenticated', BOB,
      `select public.propose_company('compañia inventada para pruebas', 'medellin', null)`);
    expect(again.propose_company).toBe(p.propose_company);
  });
});

describe('eliminación de cuenta', () => {
  it('anonimiza las publicaciones y conserva la auditoría', async () => {
    const before = await rows<{ author_alias: string }>(db, 'anon', null,
      `select author_alias from public.public_experiences where author_alias = 'Operario_Sur'`);
    expect(before.length).toBeGreaterThan(0);

    await expect(
      rows(db, 'authenticated', ADMIN, 'select public.process_account_deletion($1)', [BOB]),
    ).rejects.toThrow(/No hay una solicitud/);
    await rows(db, 'authenticated', BOB, 'select public.request_account_deletion()');
    await expect(insertExperience(BOB, {}, LONG_TEXT + ' Tras pedir la baja.')).rejects.toThrow();
    await rows(db, 'authenticated', ADMIN, 'select public.process_account_deletion($1)', [BOB]);

    expect((await db.query('select id from auth.users where id = $1', [BOB])).rows).toEqual([]);
    const after = await rows<{ author_alias: string }>(db, 'anon', null,
      `select author_alias from public.public_experiences where author_alias = 'Operario_Sur'`);
    expect(after).toEqual([]);
    const anon = await db.query<{ n: number }>(
      `select count(*)::int as n from public.experiences where author_id is null and anonymized_at is not null`);
    expect(anon.rows[0].n).toBeGreaterThan(0);
    const audit = await db.query<{ n: number }>(
      `select count(*)::int as n from public.security_events where user_id = $1`, [BOB]);
    expect(audit.rows[0].n).toBeGreaterThan(0);
  });
});
