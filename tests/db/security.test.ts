// Pruebas de seguridad contra un Postgres real con las migraciones del proyecto.
// Cada prueba hace las peticiones como lo haría un cliente manipulado: no se
// fía de que un botón no aparezca en la interfaz.
import { beforeAll, describe, expect, it } from 'vitest';
import { as, createCompany, createDb, createExperience, createUser, errorOf, SAMPLE_BODY, type Db } from './harness';

let db: Db;
let admin: { id: string; email: string };
let moderator: { id: string; email: string };
let ana: { id: string; email: string };
let beto: { id: string; email: string };
let companyId: string;

beforeAll(async () => {
  db = await createDb();
  admin = await createUser(db, { alias: 'coordinacion_1', role: 'admin' });
  moderator = await createUser(db, { alias: 'revisora_1', role: 'moderator' });
  ana = await createUser(db, { alias: 'ana_turnos' });
  beto = await createUser(db, { alias: 'beto_bodega' });
  companyId = await createCompany(db, admin, 'Empresa Demo Uno S.A.S.', 'empresa-demo-uno');
}, 60_000);

const variant = (n: number) => `${SAMPLE_BODY} Variante número ${n}.`;

describe('RLS habilitado', () => {
  it('todas las tablas del esquema public tienen RLS activo', async () => {
    const { rows } = await db.query<{ tablename: string }>(
      `select tablename from pg_tables where schemaname = 'public' and not rowsecurity`,
    );
    expect(rows).toEqual([]);
  });
});

describe('visitantes sin sesión', () => {
  it('no pueden leer perfiles, correos ni registros internos', async () => {
    for (const sql of [
      'select * from public.profiles',
      'select email from auth.users',
      'select * from public.moderation_events',
      'select * from public.security_events',
      'select * from public.company_claims',
      'select * from public.content_reports',
      'select * from public.company_private_data',
      'select * from public.evidence_files',
      'select * from public.admin_roles',
    ]) {
      expect(await errorOf(as(db, 'anon', () => db.query(sql)))).toMatch(/permission denied/);
    }
  });

  it('no pueden leer el autor de una experiencia', async () => {
    expect(await errorOf(as(db, 'anon', () => db.query('select author_id from public.experiences')))).toMatch(/permission denied/);
  });

  it('pueden buscar empresas y ver su perfil público', async () => {
    const search = await as(db, 'anon', () => db.query<{ slug: string }>(`select slug from public.search_companies('demo uno')`));
    expect(search.rows.map((r) => r.slug)).toContain('empresa-demo-uno');
    const profile = await as(db, 'anon', () => db.query<{ p: { company: { slug: string } } }>(`select public.company_profile('empresa-demo-uno') as p`));
    expect(profile.rows[0].p.company.slug).toBe('empresa-demo-uno');
  });

  it('no pueden ejecutar funciones de moderación ni crear empresas', async () => {
    expect(await errorOf(as(db, 'anon', () => db.query(`select * from public.moderation_queue()`)))).toMatch(/permission denied/);
    expect(
      await errorOf(as(db, 'anon', () => db.query(`insert into public.companies (slug, trade_name, sector, city, department) values ('x-y', 'Xy', 'A', 'B', 'C')`))),
    ).toMatch(/permission denied/);
  });
});

describe('publicaciones y autoría', () => {
  it('una experiencia nueva siempre entra en revisión y no la ve otra cuenta', async () => {
    const id = await createExperience(db, ana, companyId, variant(1));
    const own = await as(db, ana, () => db.query<{ status: string }>(`select status from public.experiences where id = $1`, [id]));
    expect(own.rows[0].status).toBe('en_revision');

    const other = await as(db, beto, () => db.query(`select id from public.experiences where id = $1`, [id]));
    expect(other.rows).toHaveLength(0);
    const anon = await as(db, 'anon', () => db.query(`select id from public.list_experiences() where id = $1`, [id]));
    expect(anon.rows).toHaveLength(0);
  });

  it('no se puede enviar una experiencia ya publicada ni con otro autor', async () => {
    const withStatus = as(db, ana, () =>
      db.query(
        `insert into public.experiences (company_id, category_slug, period_start, relationship, body, rules_accepted, status)
         values ($1, 'pago-salarios', '2025-01-01', 'actual', $2, true, 'publicada')`,
        [companyId, variant(2)],
      ),
    );
    expect(await errorOf(withStatus)).toMatch(/permission denied/);

    const withAuthor = as(db, ana, () =>
      db.query(
        `insert into public.experiences (company_id, category_slug, period_start, relationship, body, rules_accepted, author_id)
         values ($1, 'pago-salarios', '2025-01-01', 'actual', $2, true, $3)`,
        [companyId, variant(3), beto.id],
      ),
    );
    expect(await errorOf(withAuthor)).toMatch(/permission denied/);
  });

  it('el autor no puede aprobar su propio contenido', async () => {
    const id = await createExperience(db, beto, companyId, variant(4));
    expect(await errorOf(as(db, beto, () => db.query(`update public.experiences set status = 'publicada' where id = $1`, [id])))).toMatch(/permission denied/);
    expect(
      await errorOf(as(db, beto, () => db.query(`select public.moderate_experience($1, 'publicada', 'Aprobado por mí mismo')`, [id]))),
    ).toMatch(/VL403/);
  });

  it('un usuario no puede modificar experiencias ajenas', async () => {
    const id = await createExperience(db, ana, companyId, variant(5));
    const result = await as(db, beto, () => db.query(`update public.experiences set body = $2 where id = $1`, [id, variant(99)]));
    expect(result.affectedRows ?? 0).toBe(0);
    const { rows } = await db.query<{ body: string }>(`select body from public.experiences where id = $1`, [id]);
    expect(rows[0].body).toBe(variant(5));
  });

  it('bloquea textos repetidos y más de 3 envíos en 24 horas', async () => {
    const carla = await createUser(db, { alias: 'carla_caja' });
    await createExperience(db, carla, companyId, variant(10));
    expect(await errorOf(createExperience(db, carla, companyId, variant(10)))).toMatch(/VL035/);
    await createExperience(db, carla, companyId, variant(11));
    await createExperience(db, carla, companyId, variant(12));
    expect(await errorOf(createExperience(db, carla, companyId, variant(13)))).toMatch(/VL033/);
  });

  it('marca datos personales evidentes para revisión humana', async () => {
    const dani = await createUser(db, { alias: 'dani_ruta' });
    const id = await createExperience(db, dani, companyId, `${variant(20)} Escriban a jefe.turno@empresa.test o al 310 555 1234.`);
    const { rows } = await db.query<{ auto_flags: string[]; status: string }>(`select auto_flags, status from public.experiences where id = $1`, [id]);
    expect(rows[0].auto_flags).toEqual(expect.arrayContaining(['correo', 'telefono']));
    expect(rows[0].status).toBe('en_revision');
  });

  it('exige alias antes de publicar', async () => {
    const sinAlias = await createUser(db);
    expect(await errorOf(createExperience(db, sinAlias, companyId, variant(30)))).toMatch(/VL030/);
  });
});

describe('roles y cuentas', () => {
  it('un usuario no puede darse un rol ni cambiar su estado', async () => {
    expect(
      await errorOf(as(db, ana, () => db.query(`insert into public.admin_roles (user_id, role) values ($1, 'admin')`, [ana.id]))),
    ).toMatch(/permission denied/);
    expect(await errorOf(as(db, ana, () => db.query(`select public.admin_set_role($1, 'admin', true)`, [ana.id])))).toMatch(/VL403/);
    expect(await errorOf(as(db, ana, () => db.query(`update public.profiles set status = 'activa' where id = $1`, [ana.id])))).toMatch(
      /permission denied/,
    );
    const { rows } = await db.query(`select * from public.admin_roles where user_id = $1`, [ana.id]);
    expect(rows).toHaveLength(0);
  });

  it('un usuario no ve el perfil de otra cuenta', async () => {
    const { rows } = await as(db, ana, () => db.query(`select id from public.profiles where id = $1`, [beto.id]));
    expect(rows).toHaveLength(0);
  });

  it('valida alias reservados, duplicados y parecidos al correo', async () => {
    const eva = await createUser(db);
    const setAlias = (alias: string) => as(db, eva, () => db.query(`update public.profiles set alias = $1 where id = $2`, [alias, eva.id]));
    expect(await errorOf(setAlias('Moderador_Oficial'))).toMatch(/VL012/);
    expect(await errorOf(setAlias('ANA_TURNOS'))).toMatch(/duplicate key|unique/);
    expect(await errorOf(setAlias(eva.email.split('@')[0]))).toMatch(/VL013/);
    expect(await errorOf(setAlias('a@b'))).toMatch(/VL011/);
  });

  it('un administrador sí puede asignar roles y queda registro de seguridad', async () => {
    await as(db, admin, () => db.query(`select public.admin_set_role($1, 'moderator', true)`, [beto.id]));
    const { rows } = await db.query<{ event_type: string }>(`select event_type from public.security_events where details->>'target' = $1`, [beto.id]);
    expect(rows.map((r) => r.event_type)).toContain('rol_concedido');
    await as(db, admin, () => db.query(`select public.admin_set_role($1, 'moderator', false)`, [beto.id]));
  });
});

describe('moderación auditada', () => {
  it('un moderador publica con motivo y queda el registro completo', async () => {
    const id = await createExperience(db, ana, companyId, variant(40));
    await as(db, moderator, () => db.query(`select public.moderate_experience($1, 'publicada', 'Cumple las reglas de publicación', 'Sin datos personales')`, [id]));

    const { rows } = await db.query<{ previous_status: string; new_status: string; actor_id: string; reason: string }>(
      `select previous_status, new_status, actor_id, reason from public.moderation_events where target_id = $1`,
      [id],
    );
    expect(rows).toEqual([{ previous_status: 'en_revision', new_status: 'publicada', actor_id: moderator.id, reason: 'Cumple las reglas de publicación' }]);

    const pub = await as(db, 'anon', () => db.query<{ author_alias: string }>(`select author_alias from public.list_experiences() where id = $1`, [id]));
    expect(pub.rows[0].author_alias).toBe('ana_turnos');
  });

  it('el autor consulta el motivo, pero no la nota interna ni quién moderó', async () => {
    const id = await createExperience(db, beto, companyId, variant(41));
    await as(db, moderator, () => db.query(`select public.moderate_experience($1, 'requiere_ajustes', 'Quita el nombre propio del segundo párrafo', 'Nombre de supervisor')`, [id]));
    const { rows, fields } = await as(db, beto, () => db.query(`select * from public.my_experience_history($1)`, [id]));
    expect(rows).toHaveLength(1);
    expect(fields.map((f) => f.name)).not.toContain('internal_note');
    expect(fields.map((f) => f.name)).not.toContain('actor_id');

    // Al corregir, vuelve a revisión automáticamente.
    await as(db, beto, () => db.query(`update public.experiences set body = $2 where id = $1`, [id, variant(42)]));
    const after = await db.query<{ status: string }>(`select status from public.experiences where id = $1`, [id]);
    expect(after.rows[0].status).toBe('en_revision');
  });

  it('un moderador no puede moderar su propio contenido', async () => {
    const id = await createExperience(db, moderator, companyId, variant(43));
    expect(await errorOf(as(db, moderator, () => db.query(`select public.moderate_experience($1, 'publicada', 'Autoaprobación de prueba')`, [id])))).toMatch(/VL052/);
  });

  it('los registros de moderación no se pueden modificar ni borrar', async () => {
    expect(await errorOf(as(db, ana, () => db.query(`update public.moderation_events set reason = 'x'`)))).toMatch(/permission denied/);
    expect(await errorOf(as(db, moderator, () => db.query(`delete from public.moderation_events`)))).toMatch(/permission denied/);
    // Ni siquiera el propietario de la base de datos fuera de la purga.
    expect(await errorOf(db.query(`update public.moderation_events set reason = 'alterado'`))).toMatch(/VL403/);
    const own = await as(db, ana, () => db.query(`select * from public.moderation_events`));
    expect(own.rows).toHaveLength(0);
  });
});

describe('reclamaciones empresariales', () => {
  it('una reclamación no revela al autor', async () => {
    const rep = await createUser(db, { alias: 'representante_x' });
    const gabi = await createUser(db, { alias: 'gabi_planta' });
    const id = await createExperience(db, gabi, companyId, variant(50));
    await as(db, moderator, () => db.query(`select public.moderate_experience($1, 'publicada', 'Cumple las reglas de publicación')`, [id]));

    await as(db, rep, () =>
      db.query(
        `insert into public.company_claims (company_id, experience_id, claimant_name, claimant_role, contact_email, claim_type, description, requested_action)
         values ($1, $2, 'Persona Representante', 'Jefatura de talento humano', 'rep@empresa.test', 'error_verificable',
                 'La fecha indicada no coincide con nuestros registros de nómina de ese periodo concreto.', 'revision')`,
        [companyId, id],
      ),
    );

    expect(await errorOf(as(db, rep, () => db.query(`select author_id from public.experiences where id = $1`, [id])))).toMatch(/permission denied/);
    const visible = await as(db, rep, () => db.query(`select * from public.list_experiences() where id = $1`, [id]));
    expect(Object.keys(visible.rows[0] as object)).not.toContain('author_id');
    expect(JSON.stringify(visible.rows[0])).not.toContain(gabi.id);
    expect(JSON.stringify(visible.rows[0])).not.toContain(gabi.email);

    const claims = await as(db, rep, () => db.query(`select id, company_id, experience_id, claimant_name, claimant_role, contact_email, claim_type, description, requested_action, status, resolution_public, created_at from public.company_claims`));
    expect(await errorOf(as(db, rep, () => db.query(`select claimant_id from public.company_claims`)))).toMatch(/permission denied/);
    expect(claims.rows).toHaveLength(1);
    expect(JSON.stringify(claims.rows[0])).not.toContain(gabi.id);

    // Otra cuenta no ve la reclamación.
    const other = await as(db, beto, () => db.query(`select id from public.company_claims`));
    expect(other.rows).toHaveLength(0);
  });
});

describe('estadísticas y privacidad', () => {
  it('oculta el desglose por categoría cuando hay muy pocas experiencias', async () => {
    const otherCompany = await createCompany(db, admin, 'Empresa Demo Dos S.A.S.', 'empresa-demo-dos');
    const id = await createExperience(db, beto, otherCompany, variant(60));
    await as(db, moderator, () => db.query(`select public.moderate_experience($1, 'publicada', 'Cumple las reglas de publicación')`, [id]));
    const { rows } = await as(db, 'anon', () => db.query<{ p: { breakdown_hidden: boolean; categories: unknown[]; visible_experiences: number } }>(
      `select public.company_profile('empresa-demo-dos') as p`,
    ));
    expect(rows[0].p.visible_experiences).toBe(1);
    expect(rows[0].p.breakdown_hidden).toBe(true);
    expect(rows[0].p.categories).toEqual([]);
  });

  it('no se puede publicar una guía sin fuente oficial', async () => {
    const insert = as(db, admin, () =>
      db.query(
        `insert into public.legal_resources (slug, title, summary, content, status, last_verified_at)
         values ('guia-prueba', 'Guía de prueba', 'Resumen suficientemente largo para la guía.', repeat('Contenido de prueba. ', 5), 'publicado', current_date)`,
      ),
    );
    expect(await errorOf(insert)).toMatch(/VL070/);
  });
});

describe('búsqueda por NIT', () => {
  const search = (q: string) =>
    as(db, 'anon', () => db.query<Record<string, unknown>>(`select * from public.search_companies($1)`, [q]));

  beforeAll(async () => {
    const id = await createCompany(db, admin, 'Empresa Demo Nit S.A.S.', 'empresa-demo-nit');
    await as(db, admin, () => db.query(`insert into public.company_private_data (company_id, tax_id) values ($1, '899999068')`, [id]));
  });

  it('encuentra la empresa con el NIT completo, con o sin puntos y dígito de verificación', async () => {
    for (const q of ['899999068', '899.999.068', '899.999.068-1', '8999990681', ' 899 999 068 ']) {
      const { rows } = await search(q);
      expect(rows.map((r) => r.slug), q).toEqual(['empresa-demo-nit']);
    }
  });

  it('no encuentra nada con un NIT parcial', async () => {
    for (const q of ['8999', '899999', '89999906', '99999068']) {
      const { rows } = await search(q);
      expect(rows, q).toHaveLength(0);
    }
  });

  it('nunca devuelve el NIT en los resultados', async () => {
    const { rows, fields } = await search('899999068');
    expect(fields.map((f) => f.name)).not.toContain('tax_id');
    expect(JSON.stringify(rows)).not.toContain('899999068');
  });
});

describe('eliminación de cuenta', () => {
  it('anonimiza las publicaciones tras el plazo de cancelación', async () => {
    const fede = await createUser(db, { alias: 'fede_noche' });
    const published = await createExperience(db, fede, companyId, variant(70));
    const pending = await createExperience(db, fede, companyId, variant(71));
    await as(db, moderator, () => db.query(`select public.moderate_experience($1, 'publicada', 'Cumple las reglas de publicación')`, [published]));

    await as(db, fede, () => db.query(`select public.request_account_deletion()`));
    expect(await errorOf(as(db, admin, () => db.query(`select public.process_account_deletion($1)`, [fede.id])))).toMatch(/VL083/);
    expect(await errorOf(as(db, ana, () => db.query(`select public.process_account_deletion($1)`, [fede.id])))).toMatch(/VL403/);

    await db.query(`update public.profiles set deletion_requested_at = now() - interval '16 days' where id = $1`, [fede.id]);
    await as(db, admin, () => db.query(`select public.process_account_deletion($1)`, [fede.id]));

    const { rows } = await db.query<{ id: string; author_id: string | null; status: string }>(
      `select id, author_id, status from public.experiences where id in ($1, $2) order by status`,
      [published, pending],
    );
    expect(rows.every((r) => r.author_id === null)).toBe(true);
    expect(rows.find((r) => r.id === pending)?.status).toBe('retirada');
    const pub = await as(db, 'anon', () => db.query<{ author_alias: string }>(`select author_alias from public.list_experiences() where id = $1`, [published]));
    expect(pub.rows[0].author_alias).toBe('Autor anónimo');
  });
});
