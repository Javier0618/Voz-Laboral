-- VozLaboral · Migración 1: extensiones, utilidades y perfiles/roles.
-- Diseñada para Supabase: asume el esquema auth (auth.users, auth.uid())
-- y los roles anon/authenticated. Supabase concede por defecto privilegios
-- amplios en el esquema public a anon y authenticated, así que esta
-- migración revoca explícitamente lo que no deben tener y deja RLS como
-- última barrera en todas las tablas.

create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------------------
-- Utilidades
-- ---------------------------------------------------------------------------

-- Normaliza texto para búsquedas y reglas antiduplicado: minúsculas, sin
-- tildes y con espacios colapsados. No usa unaccent para no depender de
-- una extensión adicional.
create or replace function public.normalize_text(input text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select lower(
    translate(
      btrim(regexp_replace(coalesce(input, ''), '\s+', ' ', 'g')),
      'ÁÀÄÂÉÈËÊÍÌÏÎÓÒÖÔÚÙÜÛÑáàäâéèëêíìïîóòöôúùüûñ',
      'AAAAEEEEIIIIOOOOUUUUNaaaaeeeeiiiioooouuuun'
    )
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Roles de la aplicación (no son roles de base de datos)
-- ---------------------------------------------------------------------------

create type public.app_role as enum ('moderator', 'admin');

create table public.admin_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null,
  granted_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger admin_roles_updated_at
  before update on public.admin_roles
  for each row execute function public.set_updated_at();

-- Funciones de comprobación de rol. Son security definer para poder leer
-- admin_roles sin depender de las políticas de esa tabla.
create or replace function public.has_role(required public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_roles r
    where r.user_id = auth.uid()
      and (r.role = required or r.role = 'admin')
  );
$$;

create or replace function public.is_moderator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_role('moderator');
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_role('admin');
$$;

-- ---------------------------------------------------------------------------
-- Eventos de seguridad (solo inserción)
-- ---------------------------------------------------------------------------

create table public.security_events (
  id bigint generated always as identity primary key,
  event_type text not null check (event_type ~ '^[a-z_]{3,60}$'),
  user_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index security_events_user_idx on public.security_events (user_id, created_at desc);
create index security_events_type_idx on public.security_events (event_type, created_at desc);

-- Registro interno: solo lo llaman otras funciones security definer.
create or replace function public.log_security_event(p_type text, p_user uuid, p_details jsonb default '{}'::jsonb)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.security_events (event_type, user_id, details)
  values (p_type, p_user, coalesce(p_details, '{}'::jsonb));
$$;

-- Bloquea UPDATE y DELETE en tablas de auditoría para cualquier rol,
-- incluido el propietario. Solo se puede insertar.
create or replace function public.prevent_audit_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'La tabla % es de solo inserción', tg_table_name
    using errcode = '42501';
end;
$$;

create trigger security_events_append_only
  before update or delete on public.security_events
  for each row execute function public.prevent_audit_mutation();

-- ---------------------------------------------------------------------------
-- Perfiles públicos (alias)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  alias text,
  deletion_requested_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_alias_format check (
    alias is null or alias ~ '^[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ_-]{3,30}$'
  )
);

-- Alias único sin distinguir mayúsculas ni tildes.
create unique index profiles_alias_unique on public.profiles (public.normalize_text(alias))
  where alias is not null;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Palabras que no pueden formar parte de un alias.
create or replace function public.alias_is_reserved(p_alias text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select exists (
    select 1
    from unnest(array[
      'admin', 'administrador', 'administracion', 'moderador', 'moderadora',
      'moderator', 'moderacion', 'vozlaboral', 'voz_laboral', 'voz-laboral',
      'soporte', 'support', 'staff', 'oficial', 'official', 'root',
      'sistema', 'system', 'equipo', 'superuser'
    ]) as reserved(word)
    where position(reserved.word in replace(replace(public.normalize_text(p_alias), '_', ''), '-', '')) > 0
       or position(reserved.word in public.normalize_text(p_alias)) > 0
  );
$$;

-- Comprueba que el alias no se parezca al correo de la cuenta.
create or replace function public.alias_resembles_email(p_alias text, p_email text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  with parts as (
    select
      regexp_replace(public.normalize_text(p_alias), '[^a-z0-9]', '', 'g') as a,
      regexp_replace(public.normalize_text(split_part(coalesce(p_email, ''), '@', 1)), '[^a-z0-9]', '', 'g') as l
  )
  select
    p_alias like '%@%'
    or (length(l) > 0 and a = l)
    or (length(l) >= 4 and position(l in a) > 0)
    or (length(a) >= 4 and position(a in l) > 0)
    or (length(l) >= 4 and extensions.similarity(a, l) >= 0.5)
  from parts;
$$;

create or replace function public.validate_profile_alias()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text;
begin
  if new.alias is null then
    return new;
  end if;
  new.alias := btrim(new.alias);
  if public.alias_is_reserved(new.alias) then
    raise exception 'El alias contiene una palabra reservada' using errcode = '22023';
  end if;
  select u.email into v_email from auth.users u where u.id = new.id;
  if public.alias_resembles_email(new.alias, v_email) then
    raise exception 'El alias no puede parecerse a tu correo' using errcode = '22023';
  end if;
  return new;
end;
$$;

create trigger profiles_validate_alias
  before insert or update of alias on public.profiles
  for each row execute function public.validate_profile_alias();

create or replace function public.log_alias_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.alias is distinct from old.alias then
    perform public.log_security_event('alias_changed', new.id, '{}'::jsonb);
  end if;
  return new;
end;
$$;

create trigger profiles_log_alias_change
  after update of alias on public.profiles
  for each row execute function public.log_alias_change();

-- Crea el perfil al registrarse. Si el alias propuesto en los metadatos no es
-- válido o ya existe, el perfil se crea sin alias y la persona lo elige luego.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_alias text := nullif(btrim(new.raw_user_meta_data ->> 'alias'), '');
begin
  begin
    insert into public.profiles (id, alias) values (new.id, v_alias);
  exception
    when others then
      insert into public.profiles (id, alias) values (new.id, null);
  end;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS y privilegios: profiles, admin_roles, security_events
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.admin_roles enable row level security;
alter table public.security_events enable row level security;

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (alias) on public.profiles to authenticated;

revoke all on public.admin_roles from anon, authenticated;
grant select on public.admin_roles to authenticated;

revoke all on public.security_events from anon, authenticated;
grant select on public.security_events to authenticated;

-- anon: sin políticas, no ve nada de estas tablas.

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = auth.uid());

create policy profiles_select_moderation on public.profiles
  for select to authenticated
  using (public.is_moderator());

create policy profiles_update_own_alias on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy admin_roles_select_own on public.admin_roles
  for select to authenticated
  using (user_id = auth.uid());

create policy admin_roles_select_admin on public.admin_roles
  for select to authenticated
  using (public.is_admin());

create policy security_events_select_admin on public.security_events
  for select to authenticated
  using (public.is_admin());

-- Funciones internas: nadie las llama directamente salvo las del sistema.
revoke execute on function public.log_security_event(text, uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.validate_profile_alias() from public, anon, authenticated;
revoke execute on function public.log_alias_change() from public, anon, authenticated;
