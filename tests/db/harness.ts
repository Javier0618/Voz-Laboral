import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PGlite, type Transaction } from '@electric-sql/pglite';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';

const MIGRATIONS_DIR = join(__dirname, '..', '..', 'supabase', 'migrations');

// Réplica mínima de lo que Supabase trae antes de nuestras migraciones:
// esquema auth, auth.uid() leyendo request.jwt.claims, roles de la API y
// privilegios por defecto amplios en public (los mismos que concede Supabase).
const SUPABASE_BOOTSTRAP = `
  create role anon nologin noinherit;
  create role authenticated nologin noinherit;
  create role service_role nologin noinherit bypassrls;

  create schema auth;
  create table auth.users (
    id uuid primary key,
    email text unique,
    raw_user_meta_data jsonb not null default '{}'::jsonb,
    email_confirmed_at timestamptz,
    created_at timestamptz not null default now()
  );

  create function auth.uid() returns uuid
  language sql stable as $$
    select nullif(
      coalesce(
        current_setting('request.jwt.claim.sub', true),
        (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
      ),
      ''
    )::uuid
  $$;

  grant usage on schema auth to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated, service_role;

  grant usage on schema public to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
`;

export type Db = PGlite;
export type Role = 'anon' | 'authenticated';

export async function createDb(): Promise<Db> {
  const db = new PGlite({ extensions: { pg_trgm } });
  await db.exec(SUPABASE_BOOTSTRAP);
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

export async function createUser(db: Db, id: string, email: string, alias?: string): Promise<void> {
  await db.query('insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)', [
    id,
    email,
    JSON.stringify(alias ? { alias } : {}),
  ]);
}

/**
 * Ejecuta `fn` como lo haría PostgREST: dentro de una transacción con
 * SET LOCAL ROLE y los claims del JWT. Todo se revierte al terminar salvo
 * que `commit` sea true.
 */
export async function as<T>(
  db: Db,
  role: Role,
  userId: string | null,
  fn: (tx: Transaction) => Promise<T>,
  { commit = true }: { commit?: boolean } = {},
): Promise<T> {
  let result: T;
  const rollback = Symbol('rollback');
  try {
    await db.transaction(async (tx) => {
      await tx.exec(`set local role ${role}`);
      const claims = userId ? { sub: userId, role } : { role };
      await tx.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify(claims)]);
      result = await fn(tx);
      if (!commit) throw rollback;
    });
  } catch (error) {
    if (error !== rollback) throw error;
  }
  return result!;
}

export async function rows<T = Record<string, unknown>>(
  db: Db,
  role: Role,
  userId: string | null,
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  return as(db, role, userId, async (tx) => (await tx.query<T>(sql, params)).rows);
}

export const LONG_TEXT =
  'Durante varios meses el pago de la quincena llegó con retrasos de una a dos semanas. ' +
  'Lo vi directamente en mis desprendibles y en los de mi equipo. Pedimos explicaciones por ' +
  'escrito a recursos humanos y la respuesta fue que había problemas de flujo de caja.';
