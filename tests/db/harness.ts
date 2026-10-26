// Entorno de pruebas que reproduce lo esencial de Supabase sobre PGlite
// (Postgres real compilado a WebAssembly): roles anon/authenticated/service_role,
// privilegios por defecto del esquema public, auth.users, auth.uid() y auth.role().
// Se aplican las migraciones REALES de supabase/migrations en orden.
import { PGlite } from '@electric-sql/pglite';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'supabase', 'migrations');

const SUPABASE_BOOTSTRAP = `
  create role anon nologin noinherit;
  create role authenticated nologin noinherit;
  create role service_role nologin noinherit bypassrls;

  create schema auth;
  create table auth.users (
    id uuid primary key default gen_random_uuid(),
    email text unique,
    created_at timestamptz not null default now()
  );

  create function auth.uid() returns uuid language sql stable as $$
    select nullif(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub', '')::uuid
  $$;
  create function auth.role() returns text language sql stable as $$
    select nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'
  $$;

  grant usage on schema auth to anon, authenticated, service_role;
  revoke all on auth.users from anon, authenticated;
  grant usage on schema public to anon, authenticated, service_role;

  -- Igual que Supabase: todo lo nuevo en public se concede a los roles de la API.
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
`;

export type Db = PGlite;

export async function createDb(): Promise<Db> {
  const db = await PGlite.create({ extensions: { pg_trgm } });
  await db.exec(SUPABASE_BOOTSTRAP);
  await db.exec('create schema if not exists extensions; grant usage on schema extensions to anon, authenticated, service_role;');
  const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    try {
      await db.exec(readFileSync(join(MIGRATIONS_DIR, file), 'utf8'));
    } catch (error) {
      throw new Error(`Falló la migración ${file}: ${(error as Error).message}`);
    }
  }
  return db;
}

type Identity = { id: string } | 'anon' | 'service_role';

/** Ejecuta una función con la identidad indicada, como lo haría PostgREST. */
export async function as<T>(db: Db, who: Identity, fn: () => Promise<T>): Promise<T> {
  const role = who === 'anon' ? 'anon' : who === 'service_role' ? 'service_role' : 'authenticated';
  const claims = who === 'anon' ? { role: 'anon' } : who === 'service_role' ? { role: 'service_role' } : { sub: who.id, role: 'authenticated' };
  await db.query(`select set_config('request.jwt.claims', $1, false)`, [JSON.stringify(claims)]);
  await db.exec(`set role ${role}`);
  try {
    return await fn();
  } finally {
    await db.exec('reset role');
    await db.query(`select set_config('request.jwt.claims', '', false)`);
  }
}

let counter = 0;

/** Crea un usuario en auth.users (como haría Supabase Auth) y, si se pide, su alias. */
export async function createUser(db: Db, opts: { alias?: string; role?: 'moderator' | 'admin' } = {}) {
  counter += 1;
  const email = `persona${counter}@correo-prueba.test`;
  const { rows } = await db.query<{ id: string }>(`insert into auth.users (email) values ($1) returning id`, [email]);
  const user = { id: rows[0].id, email };
  if (opts.alias) {
    await as(db, user, () => db.query(`update public.profiles set alias = $1 where id = $2`, [opts.alias, user.id]));
  }
  if (opts.role) {
    await db.query(`insert into public.admin_roles (user_id, role) values ($1, $2)`, [user.id, opts.role]);
  }
  return user;
}

export const SAMPLE_BODY =
  'Durante varios meses los pagos de nómina llegaron con retrasos de entre diez y veinte días. ' +
  'Lo viví directamente: mi salario de marzo llegó a finales de abril y no recibimos explicación por escrito. ' +
  'Otros compañeros comentaron situaciones parecidas, aunque eso no lo comprobé personalmente.';

export async function createCompany(db: Db, admin: { id: string }, name: string, slug: string) {
  const { rows } = await as(db, admin, () =>
    db.query<{ id: string }>(
      `insert into public.companies (slug, trade_name, sector, city, department)
       values ($1, $2, 'Comercio', 'Bogotá', 'Cundinamarca') returning id`,
      [slug, name],
    ),
  );
  return rows[0].id;
}

export async function createExperience(db: Db, author: { id: string }, companyId: string, body = SAMPLE_BODY, category = 'pago-salarios') {
  const { rows } = await as(db, author, () =>
    db.query<{ id: string }>(
      `insert into public.experiences (company_id, category_slug, period_start, relationship, body, rules_accepted)
       values ($1, $2, date '2025-03-01', 'anterior', $3, true) returning id`,
      [companyId, category, body],
    ),
  );
  return rows[0].id;
}

/** Devuelve el mensaje de error de una promesa que debe fallar. */
export async function errorOf(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (error) {
    return (error as Error).message;
  }
  throw new Error('Se esperaba un error y la operación se completó');
}
