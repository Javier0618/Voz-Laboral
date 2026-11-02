// Protección contra bots (migración 2100): el envío sin cuenta exige un token
// de Cloudflare Turnstile solo cuando hay clave secreta configurada.
import { beforeAll, describe, expect, it } from 'vitest';
import { as, createCompany, createDb, createUser, errorOf, SAMPLE_BODY, type Db } from './harness';

let db: Db;
let companyId: string;
let n = 0;

function submit(captcha?: string | null) {
  n += 1;
  const body = `${SAMPLE_BODY} Envío de prueba de verificación número ${n}.`;
  const args = [companyId, body];
  const extra = captcha === undefined ? '' : ', p_captcha => $3';
  if (captcha !== undefined) args.push(captcha as string);
  return as(db, 'anon', () =>
    db.query<{ r: { id: string; status: string } }>(
      `select public.submit_anonymous_experience(p_company_id => $1, p_category => 'pago-salarios', p_tone => 'mixta',
         p_period_start => date '2025-01-01', p_period_end => null, p_relationship => 'anterior', p_title => null,
         p_body => $2, p_has_documents => false, p_rules_accepted => true${extra}) as r`,
      args,
    ),
  );
}

beforeAll(async () => {
  db = await createDb();
  const admin = await createUser(db, { alias: 'coordinacion_t', role: 'admin' });
  companyId = await createCompany(db, admin, 'Empresa Turnstile S.A.S.', 'empresa-turnstile');
  // Simula la extensión http de Supabase: Cloudflare valida solo el token «token-valido-123».
  await db.exec(`
    create table extensions.llamadas (uri text, cuerpo text, tipo text);
    create function extensions.http_post(a varchar, b varchar, c varchar)
    returns table (status int, content text) language sql as $$
      insert into extensions.llamadas values (a, b, c);
      select 200, json_build_object('success', (b::jsonb ->> 'response') = 'token-valido-123')::text;
    $$;
  `);
}, 60_000);

describe('Turnstile en el envío sin cuenta', () => {
  it('sin clave secreta funciona igual que antes, con o sin token', async () => {
    expect((await submit()).rows[0].r.status).toBe('en_revision');
    expect((await submit('cualquier-cosa')).rows[0].r.status).toBe('en_revision');
    const { rows } = await db.query<{ c: number }>(`select count(*)::int as c from extensions.llamadas`);
    expect(rows[0].c).toBe(0);
  });

  it('con clave secreta rechaza envíos sin token o con un token inválido', async () => {
    await db.query(`insert into private.app_settings (name, value) values ('turnstile_secret', '0xSECRETO-DE-PRUEBA')`);
    expect(await errorOf(submit())).toMatch(/VL039/);
    expect(await errorOf(submit(''))).toMatch(/VL039/);
    expect(await errorOf(submit('token-falso-999'))).toMatch(/VL039/);
  });

  it('con clave secreta acepta un token que Cloudflare valida', async () => {
    expect((await submit('token-valido-123')).rows[0].r.status).toBe('en_revision');
    const { rows } = await db.query<{ uri: string; cuerpo: string; tipo: string }>(
      `select * from extensions.llamadas order by ctid desc limit 1`,
    );
    expect(rows[0].uri).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify');
    expect(JSON.parse(rows[0].cuerpo)).toEqual({ secret: '0xSECRETO-DE-PRUEBA', response: 'token-valido-123' });
    expect(rows[0].tipo).toBe('application/json');
  });

  it('si no se puede contactar con Cloudflare, no acepta el envío', async () => {
    await db.exec(`alter function extensions.http_post(varchar, varchar, varchar) rename to http_post_bien`);
    try {
      expect(await errorOf(submit('token-valido-123'))).toMatch(/VL039/);
    } finally {
      await db.exec(`alter function extensions.http_post_bien(varchar, varchar, varchar) rename to http_post`);
    }
  });

  it('nadie puede leer la clave secreta desde la API', async () => {
    expect(await errorOf(as(db, 'anon', () => db.query(`select * from private.app_settings`)))).toMatch(/permission denied/);
    const u = await createUser(db, { alias: 'curiosa_t' });
    expect(await errorOf(as(db, u, () => db.query(`select * from private.app_settings`)))).toMatch(/permission denied/);
    expect(await errorOf(as(db, 'anon', () => db.query(`select private.captcha_ok('x')`)))).toMatch(/permission denied/);
  });
});
