-- VozLaboral: todas las migraciones unidas en orden, para un proyecto NUEVO de Supabase.
-- Archivo generado; la fuente es supabase/migrations/.

-- ===================== supabase/migrations/20261026000100_base.sql =====================
-- VozLaboral · 0100 · Esquemas, extensiones y utilidades compartidas.
-- Se ejecuta como el rol propietario de las migraciones (postgres en Supabase).

create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;

-- Esquema interno: no se expone por la API de Supabase (solo "public" lo está).
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

-- Ninguna función nueva es ejecutable por defecto: cada migración concede
-- EXECUTE de forma explícita a quien corresponda.
alter default privileges in schema private revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from anon, authenticated;

-- Normaliza texto para búsquedas y detección de duplicados:
-- minúsculas, sin tildes, solo letras y números separados por un espacio.
create or replace function private.normalize_text(t text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select trim(regexp_replace(
    lower(translate(coalesce(t, ''),
      'ÁÀÄÂÉÈËÊÍÌÏÎÓÒÖÔÚÙÜÛÑáàäâéèëêíìïîóòöôúùüûñ',
      'AAAAEEEEIIIIOOOOUUUUNaaaaeeeeiiiioooouuuun')),
    '[^a-z0-9]+', ' ', 'g'));
$$;

-- Mantiene updated_at en todas las tablas que lo tienen.
create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Errores de negocio: el frontend reconoce el prefijo "VL" y muestra un
-- mensaje comprensible. Nunca incluyen datos internos.
create or replace function private.raise_business_error(code text, message text)
returns void
language plpgsql
set search_path = ''
as $$
begin
  raise exception using errcode = 'P0001', message = code || ': ' || message;
end;
$$;

revoke all on all functions in schema private from public;
grant execute on function private.normalize_text(text) to anon, authenticated;

-- ===================== supabase/migrations/20261026000200_accounts_and_audit.sql =====================
-- VozLaboral · 0200 · Cuentas, roles y registros de auditoría.

-- ---------------------------------------------------------------------------
-- Perfiles: solo el alias público y el estado de la cuenta.
-- El correo vive únicamente en auth.users y nunca se copia aquí.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  alias text,
  status text not null default 'activa'
    check (status in ('activa', 'suspendida', 'eliminacion_solicitada', 'eliminada')),
  suspended_reason text,
  deletion_requested_at timestamptz,
  alias_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index profiles_alias_unique on public.profiles (lower(alias)) where alias is not null;

create trigger profiles_touch before update on public.profiles
  for each row execute function private.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Roles administrativos. Solo se asignan con admin_set_role() o, para el
-- primer administrador, desde el editor SQL del panel de Supabase.
-- ---------------------------------------------------------------------------
create table public.admin_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('moderator', 'admin')),
  granted_by uuid references auth.users (id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

create or replace function private.is_moderator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_roles r
    join public.profiles p on p.id = r.user_id
    where r.user_id = auth.uid()
      and r.role in ('moderator', 'admin')
      and p.status = 'activa'
  );
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_roles r
    join public.profiles p on p.id = r.user_id
    where r.user_id = auth.uid()
      and r.role = 'admin'
      and p.status = 'activa'
  );
$$;

-- ---------------------------------------------------------------------------
-- Historial de decisiones. Solo inserción, mediante funciones. Inmutable
-- salvo la purga por plazo de conservación (ver 0800).
-- ---------------------------------------------------------------------------
create table public.moderation_events (
  id bigint generated always as identity primary key,
  target_type text not null
    check (target_type in ('experience', 'report', 'claim', 'appeal', 'profile', 'company', 'company_response', 'company_suggestion', 'legal_resource')),
  target_id uuid not null,
  previous_status text,
  new_status text,
  reason text not null check (length(trim(reason)) >= 3),
  internal_note text,
  actor_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index moderation_events_target_idx on public.moderation_events (target_type, target_id, created_at desc);
create index moderation_events_created_idx on public.moderation_events (created_at);

-- Eventos de seguridad: sin direcciones IP ni agentes de usuario.
create table public.security_events (
  id bigint generated always as identity primary key,
  event_type text not null,
  user_id uuid references auth.users (id) on delete set null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index security_events_created_idx on public.security_events (created_at);

create or replace function private.forbid_audit_changes()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' and current_setting('vozlaboral.allow_purge', true) = 'on' then
    return old;
  end if;
  raise exception using errcode = '42501', message = 'VL403: los registros de auditoría no se pueden modificar';
end;
$$;

create trigger moderation_events_immutable before update or delete on public.moderation_events
  for each row execute function private.forbid_audit_changes();
create trigger security_events_immutable before update or delete on public.security_events
  for each row execute function private.forbid_audit_changes();

create or replace function private.log_moderation(
  p_target_type text, p_target_id uuid, p_previous text, p_new text, p_reason text, p_internal_note text default null
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.moderation_events (target_type, target_id, previous_status, new_status, reason, internal_note, actor_id)
  values (p_target_type, p_target_id, p_previous, p_new, p_reason, nullif(trim(p_internal_note), ''), auth.uid());
$$;

create or replace function private.log_security(p_event_type text, p_details jsonb default '{}'::jsonb)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.security_events (event_type, user_id, details)
  values (p_event_type, auth.uid(), coalesce(p_details, '{}'::jsonb));
$$;

-- ---------------------------------------------------------------------------
-- Alias: formato, palabras reservadas y no coincidir con el correo.
-- ---------------------------------------------------------------------------
create or replace function private.check_alias()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized text := private.normalize_text(new.alias);
  email_local text;
  reserved text[] := array[
    'admin', 'administrador', 'moderador', 'moderator', 'vozlaboral', 'soporte', 'support',
    'oficial', 'ministerio', 'mintrabajo', 'gobierno', 'staff', 'root', 'sistema', 'equipo'
  ];
  word text;
begin
  if new.alias is null then
    if tg_op = 'UPDATE' and old.alias is not null and new.status <> 'eliminada' then
      perform private.raise_business_error('VL010', 'El alias no puede quedar vacío.');
    end if;
    return new;
  end if;

  new.alias := trim(new.alias);

  if new.alias !~ '^[[:alnum:]_.-]{3,24}$' then
    perform private.raise_business_error('VL011', 'El alias debe tener entre 3 y 24 caracteres: letras, números, punto, guion o guion bajo.');
  end if;

  foreach word in array reserved loop
    if position(word in replace(normalized, ' ', '')) > 0 then
      perform private.raise_business_error('VL012', 'Ese alias puede confundirse con una cuenta oficial. Elige otro.');
    end if;
  end loop;

  select private.normalize_text(split_part(u.email, '@', 1)) into email_local
  from auth.users u where u.id = new.id;

  if email_local is not null and length(email_local) >= 3
     and replace(normalized, ' ', '') = replace(email_local, ' ', '') then
    perform private.raise_business_error('VL013', 'El alias no puede coincidir con tu correo. Así protegemos tu identidad.');
  end if;

  if tg_op = 'UPDATE' and old.alias is not null and new.alias is distinct from old.alias
     and old.alias_updated_at > now() - interval '7 days' then
    perform private.raise_business_error('VL014', 'Solo puedes cambiar el alias una vez cada 7 días.');
  end if;

  if tg_op = 'INSERT' or new.alias is distinct from old.alias then
    new.alias_updated_at := now();
  end if;

  return new;
end;
$$;

create trigger profiles_check_alias before insert or update of alias on public.profiles
  for each row execute function private.check_alias();

-- Crea el perfil vacío al registrarse. El alias se elige después.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------------------
-- Privilegios y RLS
-- Supabase concede ALL por defecto a anon/authenticated en "public": se
-- revoca todo y se concede solo lo necesario, columna por columna.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.admin_roles enable row level security;
alter table public.moderation_events enable row level security;
alter table public.security_events enable row level security;

revoke all on public.profiles, public.admin_roles, public.moderation_events, public.security_events from anon, authenticated;

grant select (id, alias, status, suspended_reason, deletion_requested_at, alias_updated_at, created_at) on public.profiles to authenticated;
grant update (alias) on public.profiles to authenticated;
grant select on public.admin_roles to authenticated;
grant select on public.moderation_events to authenticated;
grant select on public.security_events to authenticated;

create policy "perfil propio o moderación" on public.profiles
  for select to authenticated
  using (id = auth.uid() or private.is_moderator());

create policy "editar alias propio" on public.profiles
  for update to authenticated
  using (id = auth.uid() and status = 'activa')
  with check (id = auth.uid());

create policy "roles propios o administración" on public.admin_roles
  for select to authenticated
  using (user_id = auth.uid() or private.is_admin());

create policy "historial para moderación" on public.moderation_events
  for select to authenticated
  using (private.is_moderator());

create policy "seguridad para administración" on public.security_events
  for select to authenticated
  using (private.is_admin());

-- Funciones auxiliares que usan las políticas.
grant execute on function private.is_moderator() to anon, authenticated;
grant execute on function private.is_admin() to anon, authenticated;

-- ===================== supabase/migrations/20261026000300_catalog.sql =====================
-- VozLaboral · 0300 · Categorías y catálogo de empresas.

-- ---------------------------------------------------------------------------
-- Categorías de experiencias (carga inicial explícita y documentada).
-- ---------------------------------------------------------------------------
create table public.experience_categories (
  slug text primary key check (slug ~ '^[a-z0-9-]{2,40}$'),
  name text not null unique,
  description text not null,
  sort_order smallint not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger experience_categories_touch before update on public.experience_categories
  for each row execute function private.touch_updated_at();

insert into public.experience_categories (slug, name, description, sort_order) values
  ('pago-salarios', 'Pago de salarios', 'Retrasos, pagos incompletos o incumplimientos en el pago del salario y prestaciones.', 1),
  ('contrato-condiciones', 'Contrato y condiciones laborales', 'Tipo de contrato, cambios de condiciones y acuerdos laborales que no se cumplen.', 2),
  ('ascensos-ajustes', 'Ascensos y ajustes salariales', 'Ascensos sin el ajuste salarial comprometido o criterios de promoción poco claros.', 3),
  ('abuso-autoridad', 'Abuso de autoridad', 'Uso indebido de la posición jerárquica, órdenes arbitrarias o represalias.', 4),
  ('posible-acoso-laboral', 'Posible acoso laboral', 'Conductas reiteradas que podrían constituir acoso laboral.', 5),
  ('jornadas-descansos', 'Jornadas y descansos', 'Horarios, horas extra, recargos, descansos y vacaciones.', 6),
  ('seguridad-salud', 'Seguridad y salud en el trabajo', 'Riesgos laborales, elementos de protección y condiciones del lugar de trabajo.', 7),
  ('discriminacion', 'Discriminación y trato desigual', 'Trato diferente por razones personales, de origen, género u otras.', 8),
  ('organizacion-administracion', 'Organización y administración', 'Desorden administrativo, comunicación deficiente o procesos internos confusos.', 9),
  ('otras', 'Otras situaciones laborales', 'Experiencias sobre condiciones de trabajo que no encajan en las demás categorías.', 10);

-- ---------------------------------------------------------------------------
-- Empresas. El alta y la corrección son administrativas durante el MVP.
-- ---------------------------------------------------------------------------
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,80}$'),
  trade_name text not null check (length(trim(trade_name)) between 2 and 120),
  legal_name text check (legal_name is null or length(trim(legal_name)) between 2 and 160),
  sector text not null check (length(trim(sector)) between 2 and 80),
  city text not null check (length(trim(city)) between 2 and 80),
  department text not null check (length(trim(department)) between 2 and 80),
  website text check (website is null or website ~ '^https://[^\s]+$'),
  status text not null default 'activo' check (status in ('activo', 'en_revision', 'fusionado', 'inactivo')),
  merged_into uuid references public.companies (id),
  search_name text generated always as (private.normalize_text(trade_name)) stored,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint companies_merge_consistency check ((status = 'fusionado') = (merged_into is not null)),
  constraint companies_not_self_merged check (merged_into is null or merged_into <> id)
);

-- Evita duplicados evidentes: mismo nombre normalizado en el mismo departamento.
create unique index companies_unique_name_department
  on public.companies (search_name, private.normalize_text(department))
  where status <> 'fusionado';
create index companies_search_trgm on public.companies using gin (search_name extensions.gin_trgm_ops);
create index companies_city_idx on public.companies (private.normalize_text(city));
create index companies_sector_idx on public.companies (private.normalize_text(sector));

create trigger companies_touch before update on public.companies
  for each row execute function private.touch_updated_at();

-- Nombres alternativos para la búsqueda (siglas, marcas, nombres anteriores).
create table public.company_aliases (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  alias text not null check (length(trim(alias)) between 2 and 120),
  search_alias text generated always as (private.normalize_text(alias)) stored,
  created_at timestamptz not null default now(),
  unique (company_id, search_alias)
);

create index company_aliases_trgm on public.company_aliases using gin (search_alias extensions.gin_trgm_ops);

-- Datos registrales internos (NIT): nunca se exponen en la interfaz pública.
create table public.company_private_data (
  company_id uuid primary key references public.companies (id) on delete cascade,
  tax_id text unique check (tax_id is null or tax_id ~ '^[0-9]{6,12}(-[0-9])?$'),
  internal_notes text,
  updated_at timestamptz not null default now()
);

create trigger company_private_data_touch before update on public.company_private_data
  for each row execute function private.touch_updated_at();

-- Sugerencias de empresas que aún no están en el catálogo.
create table public.company_suggestions (
  id uuid primary key default gen_random_uuid(),
  suggested_by uuid default auth.uid() references auth.users (id) on delete set null,
  trade_name text not null check (length(trim(trade_name)) between 2 and 120),
  city text not null check (length(trim(city)) between 2 and 80),
  department text check (department is null or length(trim(department)) between 2 and 80),
  website text check (website is null or website ~ '^https?://[^\s]+$'),
  note text check (note is null or length(note) <= 500),
  status text not null default 'pendiente' check (status in ('pendiente', 'aprobada', 'rechazada', 'duplicada')),
  resolution_note text,
  resulting_company_id uuid references public.companies (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger company_suggestions_touch before update on public.company_suggestions
  for each row execute function private.touch_updated_at();

-- Cada alta o cambio de empresa queda en el historial con su responsable.
create or replace function private.log_company_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.log_moderation(
    'company', new.id,
    case when tg_op = 'INSERT' then null else old.status end,
    new.status,
    case when tg_op = 'INSERT' then 'Alta de empresa en el catálogo' else 'Actualización de datos de la empresa' end
  );
  return new;
end;
$$;

create trigger companies_audit after insert or update on public.companies
  for each row execute function private.log_company_change();

create or replace function private.force_suggestion_author()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  recent int;
begin
  new.suggested_by := auth.uid();
  new.status := 'pendiente';
  select count(*) into recent from public.company_suggestions
    where suggested_by = auth.uid() and created_at > now() - interval '24 hours';
  if recent >= 5 then
    perform private.raise_business_error('VL020', 'Has enviado varias sugerencias hoy. Inténtalo de nuevo mañana.');
  end if;
  return new;
end;
$$;

create trigger company_suggestions_author before insert on public.company_suggestions
  for each row execute function private.force_suggestion_author();

-- ---------------------------------------------------------------------------
-- Privilegios y RLS
-- ---------------------------------------------------------------------------
alter table public.experience_categories enable row level security;
alter table public.companies enable row level security;
alter table public.company_aliases enable row level security;
alter table public.company_private_data enable row level security;
alter table public.company_suggestions enable row level security;

revoke all on public.experience_categories, public.companies, public.company_aliases,
  public.company_private_data, public.company_suggestions from anon, authenticated;

grant select on public.experience_categories to anon, authenticated;
grant select (id, slug, trade_name, legal_name, sector, city, department, website, status, merged_into, created_at, updated_at)
  on public.companies to anon, authenticated;
grant insert (slug, trade_name, legal_name, sector, city, department, website, status)
  on public.companies to authenticated;
grant update (slug, trade_name, legal_name, sector, city, department, website, status)
  on public.companies to authenticated;
grant select (id, company_id, alias, created_at) on public.company_aliases to anon, authenticated;
grant insert (company_id, alias), delete on public.company_aliases to authenticated;
grant select, insert, update on public.company_private_data to authenticated;
grant select (id, trade_name, city, department, website, note, status, resolution_note, resulting_company_id, created_at)
  on public.company_suggestions to authenticated;
grant insert (trade_name, city, department, website, note) on public.company_suggestions to authenticated;

create policy "categorías activas" on public.experience_categories
  for select to anon, authenticated using (active or private.is_admin());

create policy "empresas activas" on public.companies
  for select to anon, authenticated using (status = 'activo' or private.is_moderator());
create policy "alta de empresas por administración" on public.companies
  for insert to authenticated with check (private.is_admin());
create policy "edición de empresas por administración" on public.companies
  for update to authenticated using (private.is_admin()) with check (private.is_admin());

create policy "alias de empresas visibles" on public.company_aliases
  for select to anon, authenticated
  using (exists (select 1 from public.companies c where c.id = company_id and (c.status = 'activo' or private.is_moderator())));
create policy "alias gestionados por administración" on public.company_aliases
  for insert to authenticated with check (private.is_admin());
create policy "alias eliminados por administración" on public.company_aliases
  for delete to authenticated using (private.is_admin());

create policy "datos registrales solo administración" on public.company_private_data
  for all to authenticated using (private.is_admin()) with check (private.is_admin());

create policy "sugerencias propias o moderación" on public.company_suggestions
  for select to authenticated using (suggested_by = auth.uid() or private.is_moderator());
create policy "sugerir empresa" on public.company_suggestions
  for insert to authenticated with check (suggested_by = auth.uid());

-- ===================== supabase/migrations/20261026000400_experiences.sql =====================
-- VozLaboral · 0400 · Experiencias y archivos de respaldo (estos, aún cerrados).

create table public.experiences (
  id uuid primary key default gen_random_uuid(),
  author_id uuid default auth.uid() references public.profiles (id) on delete set null,
  company_id uuid not null references public.companies (id),
  category_slug text not null references public.experience_categories (slug),
  period_start date not null check (period_start >= date '1990-01-01'),
  period_end date,
  relationship text not null check (relationship in ('actual', 'anterior', 'prefiero_no_decir')),
  title text check (title is null or length(trim(title)) between 5 and 120),
  body text not null check (length(trim(body)) between 200 and 5000),
  has_documents boolean not null default false,
  rules_accepted boolean not null check (rules_accepted),
  status text not null default 'en_revision'
    check (status in ('en_revision', 'publicada', 'requiere_ajustes', 'en_disputa', 'restringida', 'retirada')),
  status_reason text,
  auto_flags text[] not null default '{}',
  content_hash text not null,
  anonymized boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint experiences_period_order check (period_end is null or period_end >= period_start),
  constraint experiences_unique_content unique (author_id, content_hash)
);

create index experiences_public_idx on public.experiences (company_id, status, published_at desc);
create index experiences_category_idx on public.experiences (category_slug, status);
create index experiences_author_idx on public.experiences (author_id, created_at desc);
create index experiences_queue_idx on public.experiences (status, created_at) where status in ('en_revision', 'en_disputa');

create trigger experiences_touch before update on public.experiences
  for each row execute function private.touch_updated_at();

-- Detección automática de datos personales evidentes. Solo marca para
-- revisión humana: nunca decide sobre la veracidad del relato.
create or replace function private.detect_personal_data(t text)
returns text[]
language plpgsql
immutable
set search_path = ''
as $$
declare
  flags text[] := '{}';
begin
  if t ~* '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}' then flags := array_append(flags, 'correo'); end if;
  if t ~ '(\+?57[ -]?)?3[0-9]{2}[ -]?[0-9]{3}[ -]?[0-9]{4}' then flags := array_append(flags, 'telefono'); end if;
  if t ~ '[0-9]{1,3}\.[0-9]{3}\.[0-9]{3}' or t ~ '(^|[^0-9])[0-9]{8,10}([^0-9]|$)' then flags := array_append(flags, 'documento'); end if;
  if t ~* '(confidencial|reservado|uso interno)' then flags := array_append(flags, 'confidencial'); end if;
  return flags;
end;
$$;

create or replace function private.before_experience_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  author public.profiles%rowtype;
  recent int;
begin
  -- El autor siempre es quien hace la petición: no se puede suplantar.
  new.author_id := auth.uid();
  select * into author from public.profiles where id = new.author_id;

  if author.id is null or author.alias is null then
    perform private.raise_business_error('VL030', 'Elige un alias público antes de compartir una experiencia.');
  end if;
  if author.status <> 'activa' then
    perform private.raise_business_error('VL031', 'Tu cuenta no puede publicar en este momento.');
  end if;
  if not exists (select 1 from public.companies c where c.id = new.company_id and c.status = 'activo') then
    perform private.raise_business_error('VL032', 'La empresa seleccionada no está disponible en el catálogo.');
  end if;

  select count(*) into recent from public.experiences
    where author_id = new.author_id and created_at > now() - interval '24 hours';
  if recent >= 3 then
    perform private.log_security('limite_publicaciones', jsonb_build_object('limite', 3));
    perform private.raise_business_error('VL033', 'Puedes enviar hasta 3 experiencias cada 24 horas. Inténtalo más tarde.');
  end if;

  new.period_start := date_trunc('month', new.period_start)::date;
  new.period_end := date_trunc('month', new.period_end)::date;
  if new.period_start > current_date or new.period_end > current_date then
    perform private.raise_business_error('VL034', 'El periodo no puede estar en el futuro.');
  end if;

  new.status := 'en_revision';
  new.status_reason := null;
  new.published_at := null;
  new.anonymized := false;
  new.content_hash := md5(private.normalize_text(new.body));
  new.auto_flags := private.detect_personal_data(coalesce(new.title, '') || ' ' || new.body);

  if exists (select 1 from public.experiences
             where author_id = new.author_id and content_hash = new.content_hash) then
    perform private.raise_business_error('VL035', 'Ya enviaste una experiencia con este mismo texto.');
  end if;

  return new;
end;
$$;

create trigger experiences_before_insert before insert on public.experiences
  for each row execute function private.before_experience_insert();

-- Ediciones del autor: solo en revisión o cuando se pidieron ajustes.
-- Al corregir, la publicación vuelve a la cola de revisión.
create or replace function private.before_experience_author_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Cambios hechos por las funciones de moderación o de ciclo de vida de cuentas.
  if current_setting('vozlaboral.moderation', true) = 'on' and (private.is_moderator() or auth.uid() = old.author_id or auth.role() = 'service_role') then
    return new;
  end if;

  if new.author_id is distinct from old.author_id then
    perform private.raise_business_error('VL036', 'El autor de una experiencia no se puede cambiar.');
  end if;

  new.content_hash := md5(private.normalize_text(new.body));
  new.auto_flags := private.detect_personal_data(coalesce(new.title, '') || ' ' || new.body);
  new.period_start := date_trunc('month', new.period_start)::date;
  new.period_end := date_trunc('month', new.period_end)::date;

  if old.status = 'requiere_ajustes' then
    new.status := 'en_revision';
    perform private.log_moderation('experience', new.id, old.status, new.status, 'El autor envió los ajustes solicitados');
  end if;
  return new;
end;
$$;

create trigger experiences_before_update before update on public.experiences
  for each row execute function private.before_experience_author_update();

-- ---------------------------------------------------------------------------
-- Archivos de respaldo: la tabla existe, pero la carga NO está habilitada
-- hasta completar los controles de la fase 5. Sin políticas = sin acceso.
-- ---------------------------------------------------------------------------
create table public.evidence_files (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.experiences (id) on delete cascade,
  uploaded_by uuid references auth.users (id) on delete set null,
  storage_path text not null unique,
  mime_type text not null check (mime_type in ('application/pdf', 'image/jpeg', 'image/png')),
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 10485760),
  review_status text not null default 'pendiente' check (review_status in ('pendiente', 'revisado', 'rechazado')),
  metadata_stripped boolean not null default false,
  retention_until date,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Privilegios y RLS
-- ---------------------------------------------------------------------------
alter table public.experiences enable row level security;
alter table public.evidence_files enable row level security;

revoke all on public.experiences, public.evidence_files from anon, authenticated;

-- author_id, content_hash y auto_flags nunca son legibles desde la API.
grant select (id, company_id, category_slug, period_start, period_end, relationship, title, body,
              has_documents, status, status_reason, anonymized, published_at, created_at, updated_at)
  on public.experiences to anon, authenticated;
grant insert (company_id, category_slug, period_start, period_end, relationship, title, body, has_documents, rules_accepted)
  on public.experiences to authenticated;
grant update (category_slug, period_start, period_end, relationship, title, body, has_documents)
  on public.experiences to authenticated;

create policy "experiencias públicas" on public.experiences
  for select to anon, authenticated
  using (status in ('publicada', 'en_disputa'));
create policy "experiencias propias" on public.experiences
  for select to authenticated
  using (author_id = auth.uid());
create policy "experiencias para moderación" on public.experiences
  for select to authenticated
  using (private.is_moderator());
create policy "crear experiencia propia" on public.experiences
  for insert to authenticated
  with check (author_id = auth.uid());
create policy "editar experiencia propia pendiente" on public.experiences
  for update to authenticated
  using (author_id = auth.uid() and status in ('en_revision', 'requiere_ajustes'))
  with check (author_id = auth.uid() and status in ('en_revision', 'requiere_ajustes'));

-- ===================== supabase/migrations/20261026000500_moderation.sql =====================
-- VozLaboral · 0500 · Reportes, reclamaciones, apelaciones, respuestas
-- empresariales y funciones de moderación con registro obligatorio.

create table public.content_reports (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.experiences (id) on delete cascade,
  reporter_id uuid default auth.uid() references auth.users (id) on delete set null,
  reason text not null check (reason in ('datos_personales', 'amenaza', 'falso_o_enganoso', 'contenido_confidencial', 'spam', 'otro')),
  details text check (details is null or length(details) <= 1000),
  status text not null default 'abierto' check (status in ('abierto', 'en_revision', 'resuelto', 'descartado')),
  resolution_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (experience_id, reporter_id)
);
create index content_reports_status_idx on public.content_reports (status, created_at);

create table public.company_claims (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id),
  experience_id uuid references public.experiences (id) on delete set null,
  claimant_id uuid default auth.uid() references auth.users (id) on delete set null,
  claimant_name text not null check (length(trim(claimant_name)) between 3 and 120),
  claimant_role text not null check (length(trim(claimant_role)) between 2 and 120),
  contact_email text not null check (contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  claim_type text not null check (claim_type in ('error_verificable', 'datos_privados', 'desacuerdo_opinion', 'datos_empresa', 'otro')),
  description text not null check (length(trim(description)) between 50 and 4000),
  requested_action text not null check (requested_action in ('correccion', 'revision', 'retiro_datos_privados', 'respuesta_publica')),
  status text not null default 'recibida' check (status in ('recibida', 'en_revision', 'aceptada', 'rechazada', 'cerrada')),
  resolution_public text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index company_claims_status_idx on public.company_claims (status, created_at);

create table public.appeals (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.experiences (id) on delete cascade,
  author_id uuid default auth.uid() references auth.users (id) on delete set null,
  body text not null check (length(trim(body)) between 30 and 2000),
  status text not null default 'recibida' check (status in ('recibida', 'en_revision', 'aceptada', 'rechazada')),
  resolution text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index appeals_one_open on public.appeals (experience_id) where status in ('recibida', 'en_revision');

create table public.company_responses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id),
  experience_id uuid references public.experiences (id) on delete set null,
  claim_id uuid references public.company_claims (id) on delete set null,
  representative_label text not null check (length(trim(representative_label)) between 3 and 120),
  body text not null check (length(trim(body)) between 20 and 3000),
  status text not null default 'publicada' check (status in ('publicada', 'retirada')),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index company_responses_company_idx on public.company_responses (company_id, status, created_at desc);

create trigger content_reports_touch before update on public.content_reports for each row execute function private.touch_updated_at();
create trigger company_claims_touch before update on public.company_claims for each row execute function private.touch_updated_at();
create trigger appeals_touch before update on public.appeals for each row execute function private.touch_updated_at();
create trigger company_responses_touch before update on public.company_responses for each row execute function private.touch_updated_at();

-- Fuerza el autor de reportes, reclamaciones y apelaciones y limita la frecuencia.
create or replace function private.before_submission_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  recent int;
begin
  if auth.uid() is null then
    perform private.raise_business_error('VL401', 'Inicia sesión para continuar.');
  end if;

  if tg_table_name = 'content_reports' then
    new.reporter_id := auth.uid();
    new.status := 'abierto';
    new.resolution_note := null;
    select count(*) into recent from public.content_reports where reporter_id = auth.uid() and created_at > now() - interval '24 hours';
  elsif tg_table_name = 'company_claims' then
    new.claimant_id := auth.uid();
    new.status := 'recibida';
    new.resolution_public := null;
    select count(*) into recent from public.company_claims where claimant_id = auth.uid() and created_at > now() - interval '24 hours';
    if new.experience_id is not null and not exists (
      select 1 from public.experiences e where e.id = new.experience_id and e.company_id = new.company_id
    ) then
      perform private.raise_business_error('VL040', 'La publicación indicada no pertenece a esa empresa.');
    end if;
  elsif tg_table_name = 'appeals' then
    new.author_id := auth.uid();
    new.status := 'recibida';
    new.resolution := null;
    select count(*) into recent from public.appeals where author_id = auth.uid() and created_at > now() - interval '24 hours';
  end if;

  if recent >= 10 then
    perform private.log_security('limite_envios', jsonb_build_object('tabla', tg_table_name));
    perform private.raise_business_error('VL041', 'Has enviado muchas solicitudes hoy. Inténtalo de nuevo mañana.');
  end if;
  return new;
end;
$$;

create trigger content_reports_before_insert before insert on public.content_reports for each row execute function private.before_submission_insert();
create trigger company_claims_before_insert before insert on public.company_claims for each row execute function private.before_submission_insert();
create trigger appeals_before_insert before insert on public.appeals for each row execute function private.before_submission_insert();

-- ---------------------------------------------------------------------------
-- Privilegios y RLS
-- ---------------------------------------------------------------------------
alter table public.content_reports enable row level security;
alter table public.company_claims enable row level security;
alter table public.appeals enable row level security;
alter table public.company_responses enable row level security;

revoke all on public.content_reports, public.company_claims, public.appeals, public.company_responses from anon, authenticated;

grant select (id, experience_id, reason, details, status, resolution_note, created_at, updated_at) on public.content_reports to authenticated;
grant insert (experience_id, reason, details) on public.content_reports to authenticated;
grant select (id, company_id, experience_id, claimant_name, claimant_role, contact_email, claim_type, description,
              requested_action, status, resolution_public, created_at, updated_at) on public.company_claims to authenticated;
grant insert (company_id, experience_id, claimant_name, claimant_role, contact_email, claim_type, description, requested_action)
  on public.company_claims to authenticated;
grant select (id, experience_id, body, status, resolution, created_at, updated_at) on public.appeals to authenticated;
grant insert (experience_id, body) on public.appeals to authenticated;
grant select (id, company_id, experience_id, representative_label, body, status, created_at, updated_at)
  on public.company_responses to anon, authenticated;

create policy "reportes propios o moderación" on public.content_reports
  for select to authenticated using (reporter_id = auth.uid() or private.is_moderator());
create policy "reportar publicación visible" on public.content_reports
  for insert to authenticated
  with check (reporter_id = auth.uid() and exists (
    select 1 from public.experiences e where e.id = experience_id and e.status in ('publicada', 'en_disputa')));

create policy "reclamaciones propias o moderación" on public.company_claims
  for select to authenticated using (claimant_id = auth.uid() or private.is_moderator());
create policy "presentar reclamación" on public.company_claims
  for insert to authenticated
  with check (claimant_id = auth.uid() and exists (
    select 1 from public.companies c where c.id = company_id and c.status = 'activo'));

create policy "apelaciones propias o moderación" on public.appeals
  for select to authenticated using (author_id = auth.uid() or private.is_moderator());
create policy "apelar decisión sobre experiencia propia" on public.appeals
  for insert to authenticated
  with check (author_id = auth.uid() and exists (
    select 1 from public.experiences e where e.id = experience_id and e.author_id = auth.uid()
      and e.status in ('requiere_ajustes', 'restringida', 'retirada', 'en_disputa')));

create policy "respuestas publicadas" on public.company_responses
  for select to anon, authenticated using (status = 'publicada' or private.is_moderator());

-- ---------------------------------------------------------------------------
-- Funciones de moderación. Todas exigen rol, motivo y dejan registro.
-- ---------------------------------------------------------------------------
create or replace function public.moderate_experience(
  p_experience_id uuid, p_new_status text, p_public_reason text, p_internal_note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  exp public.experiences%rowtype;
begin
  if not private.is_moderator() then
    perform private.log_security('moderacion_no_autorizada', jsonb_build_object('experience_id', p_experience_id));
    raise exception using errcode = '42501', message = 'VL403: no tienes permiso para moderar contenido';
  end if;
  if p_new_status not in ('en_revision', 'publicada', 'requiere_ajustes', 'en_disputa', 'restringida', 'retirada') then
    perform private.raise_business_error('VL050', 'Estado de moderación no válido.');
  end if;
  if p_public_reason is null or length(trim(p_public_reason)) < 10 then
    perform private.raise_business_error('VL051', 'Escribe un motivo de al menos 10 caracteres. El autor podrá leerlo.');
  end if;

  select * into exp from public.experiences where id = p_experience_id for update;
  if exp.id is null then
    perform private.raise_business_error('VL404', 'La experiencia no existe.');
  end if;
  if exp.author_id = auth.uid() then
    perform private.raise_business_error('VL052', 'No puedes moderar tus propias publicaciones.');
  end if;
  if exp.status = p_new_status then
    perform private.raise_business_error('VL053', 'La experiencia ya está en ese estado.');
  end if;

  perform set_config('vozlaboral.moderation', 'on', true);
  update public.experiences
     set status = p_new_status,
         status_reason = trim(p_public_reason),
         published_at = case when p_new_status = 'publicada' then coalesce(published_at, now()) else published_at end
   where id = p_experience_id;
  perform set_config('vozlaboral.moderation', 'off', true);

  perform private.log_moderation('experience', p_experience_id, exp.status, p_new_status, trim(p_public_reason), p_internal_note);
end;
$$;

create or replace function public.resolve_report(p_report_id uuid, p_status text, p_note text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  prev text;
begin
  if not private.is_moderator() then
    raise exception using errcode = '42501', message = 'VL403: no tienes permiso para gestionar reportes';
  end if;
  if p_status not in ('en_revision', 'resuelto', 'descartado') or p_note is null or length(trim(p_note)) < 5 then
    perform private.raise_business_error('VL054', 'Indica un estado válido y una nota de resolución.');
  end if;
  select status into prev from public.content_reports where id = p_report_id for update;
  if prev is null then perform private.raise_business_error('VL404', 'El reporte no existe.'); end if;
  update public.content_reports set status = p_status, resolution_note = trim(p_note) where id = p_report_id;
  perform private.log_moderation('report', p_report_id, prev, p_status, trim(p_note));
end;
$$;

create or replace function public.resolve_claim(p_claim_id uuid, p_status text, p_public_resolution text, p_internal_note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  prev text;
begin
  if not private.is_moderator() then
    raise exception using errcode = '42501', message = 'VL403: no tienes permiso para gestionar reclamaciones';
  end if;
  if p_status not in ('en_revision', 'aceptada', 'rechazada', 'cerrada') or p_public_resolution is null or length(trim(p_public_resolution)) < 10 then
    perform private.raise_business_error('VL055', 'Indica un estado válido y una respuesta de al menos 10 caracteres.');
  end if;
  select status into prev from public.company_claims where id = p_claim_id for update;
  if prev is null then perform private.raise_business_error('VL404', 'La reclamación no existe.'); end if;
  update public.company_claims set status = p_status, resolution_public = trim(p_public_resolution) where id = p_claim_id;
  perform private.log_moderation('claim', p_claim_id, prev, p_status, trim(p_public_resolution), p_internal_note);
end;
$$;

create or replace function public.resolve_appeal(p_appeal_id uuid, p_status text, p_resolution text, p_internal_note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  ap public.appeals%rowtype;
begin
  if not private.is_moderator() then
    raise exception using errcode = '42501', message = 'VL403: no tienes permiso para gestionar apelaciones';
  end if;
  if p_status not in ('en_revision', 'aceptada', 'rechazada') or p_resolution is null or length(trim(p_resolution)) < 10 then
    perform private.raise_business_error('VL056', 'Indica un estado válido y una resolución de al menos 10 caracteres.');
  end if;
  select * into ap from public.appeals where id = p_appeal_id for update;
  if ap.id is null then perform private.raise_business_error('VL404', 'La apelación no existe.'); end if;
  if ap.author_id = auth.uid() then perform private.raise_business_error('VL052', 'No puedes resolver tus propias apelaciones.'); end if;
  update public.appeals set status = p_status, resolution = trim(p_resolution) where id = p_appeal_id;
  perform private.log_moderation('appeal', p_appeal_id, ap.status, p_status, trim(p_resolution), p_internal_note);
end;
$$;

-- Publica una respuesta de un representante cuya identidad verificó el equipo.
create or replace function public.publish_company_response(
  p_company_id uuid, p_experience_id uuid, p_claim_id uuid, p_representative_label text, p_body text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id uuid;
begin
  if not private.is_moderator() then
    raise exception using errcode = '42501', message = 'VL403: no tienes permiso para publicar respuestas empresariales';
  end if;
  insert into public.company_responses (company_id, experience_id, claim_id, representative_label, body, created_by)
  values (p_company_id, p_experience_id, p_claim_id, trim(p_representative_label), trim(p_body), auth.uid())
  returning id into new_id;
  perform private.log_moderation('company_response', new_id, null, 'publicada', 'Respuesta empresarial publicada tras verificar al representante');
  return new_id;
end;
$$;

create or replace function public.set_account_suspension(p_user_id uuid, p_suspend boolean, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  prev text;
begin
  if not private.is_moderator() then
    raise exception using errcode = '42501', message = 'VL403: no tienes permiso para suspender cuentas';
  end if;
  if p_user_id = auth.uid() then perform private.raise_business_error('VL057', 'No puedes suspender tu propia cuenta.'); end if;
  if p_reason is null or length(trim(p_reason)) < 10 then
    perform private.raise_business_error('VL051', 'Escribe un motivo de al menos 10 caracteres.');
  end if;
  select status into prev from public.profiles where id = p_user_id for update;
  if prev is null or prev in ('eliminada', 'eliminacion_solicitada') then
    perform private.raise_business_error('VL404', 'La cuenta no existe o está en proceso de eliminación.');
  end if;
  update public.profiles
     set status = case when p_suspend then 'suspendida' else 'activa' end,
         suspended_reason = case when p_suspend then trim(p_reason) else null end
   where id = p_user_id;
  perform private.log_moderation('profile', p_user_id, prev, case when p_suspend then 'suspendida' else 'activa' end, trim(p_reason));
end;
$$;

create or replace function public.resolve_company_suggestion(p_suggestion_id uuid, p_status text, p_note text, p_company_id uuid default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  prev text;
begin
  if not private.is_admin() then
    raise exception using errcode = '42501', message = 'VL403: solo la administración gestiona el catálogo';
  end if;
  if p_status not in ('aprobada', 'rechazada', 'duplicada') or p_note is null or length(trim(p_note)) < 5 then
    perform private.raise_business_error('VL058', 'Indica un estado válido y una nota.');
  end if;
  select status into prev from public.company_suggestions where id = p_suggestion_id for update;
  if prev is null then perform private.raise_business_error('VL404', 'La sugerencia no existe.'); end if;
  update public.company_suggestions
     set status = p_status, resolution_note = trim(p_note), resulting_company_id = p_company_id
   where id = p_suggestion_id;
  perform private.log_moderation('company_suggestion', p_suggestion_id, prev, p_status, trim(p_note));
end;
$$;

-- Corrige duplicados: mueve las publicaciones a la empresa correcta.
create or replace function public.merge_companies(p_from uuid, p_into uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception using errcode = '42501', message = 'VL403: solo la administración gestiona el catálogo';
  end if;
  if p_from = p_into or p_reason is null or length(trim(p_reason)) < 10 then
    perform private.raise_business_error('VL059', 'Indica dos empresas distintas y un motivo.');
  end if;
  perform set_config('vozlaboral.moderation', 'on', true);
  update public.experiences set company_id = p_into where company_id = p_from;
  update public.company_responses set company_id = p_into where company_id = p_from;
  update public.companies set status = 'fusionado', merged_into = p_into where id = p_from;
  perform set_config('vozlaboral.moderation', 'off', true);
  perform private.log_moderation('company', p_from, 'activo', 'fusionado', trim(p_reason), 'Fusionada con ' || p_into::text);
end;
$$;

create or replace function public.admin_set_role(p_user_id uuid, p_role text, p_grant boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    perform private.log_security('cambio_rol_no_autorizado', jsonb_build_object('target', p_user_id, 'role', p_role));
    raise exception using errcode = '42501', message = 'VL403: solo la administración asigna roles';
  end if;
  if p_role not in ('moderator', 'admin') then
    perform private.raise_business_error('VL060', 'Rol no válido.');
  end if;
  if p_user_id = auth.uid() and not p_grant then
    perform private.raise_business_error('VL061', 'No puedes retirarte tu propio rol.');
  end if;
  if p_grant then
    insert into public.admin_roles (user_id, role, granted_by) values (p_user_id, p_role, auth.uid())
    on conflict do nothing;
  else
    delete from public.admin_roles where user_id = p_user_id and role = p_role;
  end if;
  perform private.log_security(case when p_grant then 'rol_concedido' else 'rol_retirado' end,
                               jsonb_build_object('target', p_user_id, 'role', p_role));
end;
$$;

-- Cola de moderación: incluye el alias (nunca el correo) y las marcas automáticas.
create or replace function public.moderation_queue(p_status text default 'en_revision', p_limit int default 50, p_offset int default 0)
returns table (
  id uuid, company_id uuid, company_name text, category_slug text, title text, body text,
  period_start date, period_end date, relationship text, has_documents boolean, status text,
  status_reason text, auto_flags text[], author_alias text, author_id uuid, open_reports bigint, created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_moderator() then
    raise exception using errcode = '42501', message = 'VL403: no tienes permiso para ver la cola de moderación';
  end if;
  return query
    select e.id, e.company_id, c.trade_name, e.category_slug, e.title, e.body, e.period_start, e.period_end,
           e.relationship, e.has_documents, e.status, e.status_reason, e.auto_flags,
           coalesce(p.alias, 'Cuenta eliminada'), e.author_id,
           (select count(*) from public.content_reports r where r.experience_id = e.id and r.status in ('abierto', 'en_revision')),
           e.created_at
      from public.experiences e
      join public.companies c on c.id = e.company_id
      left join public.profiles p on p.id = e.author_id
     where p_status is null or e.status = p_status
     order by cardinality(e.auto_flags) desc, e.created_at
     limit least(greatest(p_limit, 1), 100) offset greatest(p_offset, 0);
end;
$$;

revoke all on function public.moderate_experience(uuid, text, text, text), public.resolve_report(uuid, text, text),
  public.resolve_claim(uuid, text, text, text), public.resolve_appeal(uuid, text, text, text),
  public.publish_company_response(uuid, uuid, uuid, text, text), public.set_account_suspension(uuid, boolean, text),
  public.resolve_company_suggestion(uuid, text, text, uuid), public.merge_companies(uuid, uuid, text),
  public.admin_set_role(uuid, text, boolean), public.moderation_queue(text, int, int) from public, anon;
grant execute on function public.moderate_experience(uuid, text, text, text), public.resolve_report(uuid, text, text),
  public.resolve_claim(uuid, text, text, text), public.resolve_appeal(uuid, text, text, text),
  public.publish_company_response(uuid, uuid, uuid, text, text), public.set_account_suspension(uuid, boolean, text),
  public.resolve_company_suggestion(uuid, text, text, uuid), public.merge_companies(uuid, uuid, text),
  public.admin_set_role(uuid, text, boolean), public.moderation_queue(text, int, int) to authenticated;

-- ===================== supabase/migrations/20261026000600_legal_resources.sql =====================
-- VozLaboral · 0600 · Guías de derechos laborales.
-- El contenido se gestiona desde la base de datos (sin tocar código).
-- Esta migración NO carga artículos: cada guía debe verificarse contra su
-- fuente oficial antes de publicarse.

create table public.legal_resources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,80}$'),
  title text not null check (length(trim(title)) between 5 and 160),
  summary text not null check (length(trim(summary)) between 20 and 400),
  content text not null check (length(trim(content)) >= 50),
  category_slug text references public.experience_categories (slug),
  status text not null default 'borrador' check (status in ('borrador', 'pendiente_verificacion', 'publicado', 'archivado')),
  disclaimer text not null default 'Información general. No es asesoría jurídica ni una decisión sobre un caso particular. Para tu situación concreta, consulta al Ministerio del Trabajo o a un profesional del derecho.',
  last_verified_at date,
  verified_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Una guía solo se publica con fecha de verificación.
  constraint legal_resources_publish_requires_verification check (status <> 'publicado' or last_verified_at is not null)
);

create table public.legal_resource_sources (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.legal_resources (id) on delete cascade,
  label text not null check (length(trim(label)) between 3 and 200),
  publisher text not null check (length(trim(publisher)) between 2 and 120),
  url text not null check (url ~ '^https://[^\s]+$'),
  accessed_at date not null,
  created_at timestamptz not null default now(),
  unique (resource_id, url)
);

create index legal_resources_category_idx on public.legal_resources (category_slug, status);

create trigger legal_resources_touch before update on public.legal_resources
  for each row execute function private.touch_updated_at();

-- Publicar exige al menos una fuente oficial registrada.
create or replace function private.check_legal_resource_publish()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'publicado' and not exists (select 1 from public.legal_resource_sources s where s.resource_id = new.id) then
    perform private.raise_business_error('VL070', 'Añade al menos una fuente oficial antes de publicar la guía.');
  end if;
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    perform private.log_moderation('legal_resource', new.id, case when tg_op = 'INSERT' then null else old.status end, new.status, 'Cambio de estado de la guía');
  end if;
  return new;
end;
$$;

create trigger legal_resources_publish before insert or update on public.legal_resources
  for each row execute function private.check_legal_resource_publish();

alter table public.legal_resources enable row level security;
alter table public.legal_resource_sources enable row level security;

revoke all on public.legal_resources, public.legal_resource_sources from anon, authenticated;
grant select on public.legal_resources, public.legal_resource_sources to anon, authenticated;
grant insert, update, delete on public.legal_resources, public.legal_resource_sources to authenticated;

create policy "guías publicadas" on public.legal_resources
  for select to anon, authenticated using (status = 'publicado' or private.is_admin());
create policy "guías gestionadas por administración" on public.legal_resources
  for all to authenticated using (private.is_admin()) with check (private.is_admin());

create policy "fuentes de guías publicadas" on public.legal_resource_sources
  for select to anon, authenticated
  using (exists (select 1 from public.legal_resources r where r.id = resource_id and (r.status = 'publicado' or private.is_admin())));
create policy "fuentes gestionadas por administración" on public.legal_resource_sources
  for all to authenticated using (private.is_admin()) with check (private.is_admin());

-- ===================== supabase/migrations/20261026000700_public_api.sql =====================
-- VozLaboral · 0700 · Funciones de lectura pública y del área personal.
-- Devuelven solo campos seguros: alias público, nunca author_id ni correo.

-- Búsqueda de empresas por nombre o nombre alternativo, ciudad y sector.
create or replace function public.search_companies(
  p_query text default null,
  p_city text default null,
  p_sector text default null,
  p_order text default 'relevancia',
  p_limit int default 20,
  p_offset int default 0
)
returns table (
  id uuid, slug text, trade_name text, legal_name text, sector text, city text, department text,
  visible_experiences bigint, last_activity timestamptz, total_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with q as (
    select nullif(private.normalize_text(p_query), '') as term,
           nullif(private.normalize_text(p_city), '') as city,
           nullif(private.normalize_text(p_sector), '') as sector
  ),
  matches as (
    select c.*,
           greatest(
             coalesce(extensions.similarity(c.search_name, q.term), 0),
             coalesce((select max(extensions.similarity(a.search_alias, q.term)) from public.company_aliases a where a.company_id = c.id), 0),
             case when q.term is not null and c.search_name like q.term || '%' then 1 else 0 end
           ) as score
      from public.companies c, q
     where c.status = 'activo'
       and (q.city is null or private.normalize_text(c.city) like '%' || q.city || '%')
       and (q.sector is null or private.normalize_text(c.sector) like '%' || q.sector || '%')
       and (
         q.term is null
         or c.search_name like '%' || q.term || '%'
         or extensions.similarity(c.search_name, q.term) > 0.3
         or exists (select 1 from public.company_aliases a
                     where a.company_id = c.id
                       and (a.search_alias like '%' || q.term || '%' or extensions.similarity(a.search_alias, q.term) > 0.3))
       )
  ),
  stats as (
    select m.*,
           (select count(*) from public.experiences e where e.company_id = m.id and e.status in ('publicada', 'en_disputa')) as visible,
           (select max(e.published_at) from public.experiences e where e.company_id = m.id and e.status in ('publicada', 'en_disputa')) as last_pub
      from matches m
  )
  select s.id, s.slug, s.trade_name, s.legal_name, s.sector, s.city, s.department,
         s.visible, s.last_pub, count(*) over ()
    from stats s
   order by
     case when p_order = 'actividad' then s.last_pub end desc nulls last,
     s.score desc,
     s.trade_name
   limit least(greatest(coalesce(p_limit, 20), 1), 50)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

-- Perfil público con estadísticas protegidas: las categorías con menos de 3
-- experiencias se agrupan y, si el total es menor que 3, no hay desglose.
create or replace function public.company_profile(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  c public.companies%rowtype;
  total int;
  result jsonb;
begin
  select * into c from public.companies where slug = p_slug and status = 'activo';
  if c.id is null then
    return null;
  end if;

  select count(*) into total from public.experiences e
   where e.company_id = c.id and e.status in ('publicada', 'en_disputa');

  with counts as (
    select e.category_slug, cat.name, cat.sort_order, count(*) as n
      from public.experiences e
      join public.experience_categories cat on cat.slug = e.category_slug
     where e.company_id = c.id and e.status in ('publicada', 'en_disputa')
     group by e.category_slug, cat.name, cat.sort_order
  ),
  shown as (
    select category_slug, name, sort_order, n from counts where n >= 3
    union all
    select 'agrupadas', 'Otras categorías con pocas experiencias', 99, sum(n)::bigint
      from counts where n < 3 having sum(n) > 0
  )
  select jsonb_build_object(
    'company', jsonb_build_object(
      'id', c.id, 'slug', c.slug, 'trade_name', c.trade_name, 'legal_name', c.legal_name,
      'sector', c.sector, 'city', c.city, 'department', c.department, 'website', c.website,
      'updated_at', c.updated_at,
      'aliases', coalesce((select jsonb_agg(a.alias order by a.alias) from public.company_aliases a where a.company_id = c.id), '[]'::jsonb)
    ),
    'visible_experiences', total,
    'breakdown_hidden', total < 3,
    'categories', case when total < 3 then '[]'::jsonb else coalesce(
      (select jsonb_agg(jsonb_build_object('slug', category_slug, 'name', name, 'count', n) order by sort_order) from shown), '[]'::jsonb) end,
    'period_from_year', (select extract(year from min(e.period_start))::int from public.experiences e
                          where e.company_id = c.id and e.status in ('publicada', 'en_disputa')),
    'period_to_year', (select extract(year from max(coalesce(e.period_end, e.period_start)))::int from public.experiences e
                        where e.company_id = c.id and e.status in ('publicada', 'en_disputa')),
    'open_claims', (select count(*) from public.company_claims cl where cl.company_id = c.id and cl.status in ('recibida', 'en_revision'))
  ) into result;

  return result;
end;
$$;

-- Listado público de experiencias con filtros y paginación.
create or replace function public.list_experiences(
  p_company_id uuid default null,
  p_category text default null,
  p_from date default null,
  p_to date default null,
  p_limit int default 20,
  p_offset int default 0
)
returns table (
  id uuid, company_id uuid, company_slug text, company_name text, category_slug text, category_name text,
  period_start date, period_end date, relationship text, title text, body text, has_documents boolean,
  status text, published_at timestamptz, author_alias text, total_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select e.id, c.id, c.slug, c.trade_name, cat.slug, cat.name,
         e.period_start, e.period_end, e.relationship, e.title, e.body, e.has_documents,
         e.status, e.published_at,
         case when e.anonymized or p.alias is null then 'Autor anónimo' else p.alias end,
         count(*) over ()
    from public.experiences e
    join public.companies c on c.id = e.company_id and c.status = 'activo'
    join public.experience_categories cat on cat.slug = e.category_slug
    left join public.profiles p on p.id = e.author_id
   where e.status in ('publicada', 'en_disputa')
     and (p_company_id is null or e.company_id = p_company_id)
     and (p_category is null or e.category_slug = p_category)
     and (p_from is null or coalesce(e.period_end, e.period_start) >= p_from)
     and (p_to is null or e.period_start <= p_to)
   order by e.published_at desc nulls last, e.id
   limit least(greatest(coalesce(p_limit, 20), 1), 50)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

-- Área personal: experiencias propias con su estado y el motivo público.
create or replace function public.my_experiences()
returns table (
  id uuid, company_id uuid, company_slug text, company_name text, category_slug text, category_name text,
  period_start date, period_end date, relationship text, title text, body text, has_documents boolean,
  status text, status_reason text, published_at timestamptz, created_at timestamptz, updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select e.id, c.id, c.slug, c.trade_name, cat.slug, cat.name,
         e.period_start, e.period_end, e.relationship, e.title, e.body, e.has_documents,
         e.status, e.status_reason, e.published_at, e.created_at, e.updated_at
    from public.experiences e
    join public.companies c on c.id = e.company_id
    join public.experience_categories cat on cat.slug = e.category_slug
   where auth.uid() is not null and e.author_id = auth.uid()
   order by e.created_at desc;
$$;

-- Historial de decisiones sobre una experiencia propia, sin notas internas
-- ni identidad de quien moderó.
create or replace function public.my_experience_history(p_experience_id uuid)
returns table (previous_status text, new_status text, reason text, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select m.previous_status, m.new_status, m.reason, m.created_at
    from public.moderation_events m
    join public.experiences e on e.id = m.target_id
   where m.target_type = 'experience'
     and m.target_id = p_experience_id
     and e.author_id = auth.uid()
   order by m.created_at;
$$;

-- El autor puede retirar su propia experiencia en cualquier momento.
create or replace function public.withdraw_my_experience(p_experience_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  prev text;
begin
  select status into prev from public.experiences
   where id = p_experience_id and author_id = auth.uid() for update;
  if prev is null then
    perform private.raise_business_error('VL404', 'No encontramos esa experiencia en tu cuenta.');
  end if;
  if prev = 'retirada' then
    perform private.raise_business_error('VL053', 'La experiencia ya está retirada.');
  end if;
  perform set_config('vozlaboral.moderation', 'on', true);
  update public.experiences set status = 'retirada', status_reason = 'Retirada por su autor.' where id = p_experience_id;
  perform set_config('vozlaboral.moderation', 'off', true);
  perform private.log_moderation('experience', p_experience_id, prev, 'retirada', 'Retirada por su autor');
end;
$$;

revoke all on function public.search_companies(text, text, text, text, int, int), public.company_profile(text),
  public.list_experiences(uuid, text, date, date, int, int), public.my_experiences(),
  public.my_experience_history(uuid), public.withdraw_my_experience(uuid) from public;
grant execute on function public.search_companies(text, text, text, text, int, int), public.company_profile(text),
  public.list_experiences(uuid, text, date, date, int, int) to anon, authenticated;
grant execute on function public.my_experiences(), public.my_experience_history(uuid), public.withdraw_my_experience(uuid)
  to authenticated;

-- ===================== supabase/migrations/20261026000800_account_lifecycle_retention.sql =====================
-- VozLaboral · 0800 · Eliminación de cuentas y conservación de registros.
-- Plazos propuestos en docs/retencion.md; deben validarse con un abogado.

-- 1. El titular solicita la eliminación. Hay 15 días para cancelarla.
create or replace function public.request_account_deletion()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  prev text;
begin
  select status into prev from public.profiles where id = auth.uid() for update;
  if prev is null then
    perform private.raise_business_error('VL401', 'Inicia sesión para continuar.');
  end if;
  if prev = 'eliminacion_solicitada' then
    perform private.raise_business_error('VL080', 'Ya solicitaste la eliminación de tu cuenta.');
  end if;
  update public.profiles set status = 'eliminacion_solicitada', deletion_requested_at = now() where id = auth.uid();
  perform private.log_moderation('profile', auth.uid(), prev, 'eliminacion_solicitada', 'Solicitud de eliminación del titular');
end;
$$;

create or replace function public.cancel_account_deletion()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set status = 'activa', deletion_requested_at = null
   where id = auth.uid() and status = 'eliminacion_solicitada';
  if not found then
    perform private.raise_business_error('VL081', 'No hay una solicitud de eliminación pendiente.');
  end if;
  perform private.log_moderation('profile', auth.uid(), 'eliminacion_solicitada', 'activa', 'El titular canceló la eliminación');
end;
$$;

-- 2. Pasado el plazo, la administración (o un proceso programado con la
--    clave de servicio) anonimiza la cuenta:
--    - experiencias publicadas: se conservan sin vínculo con la cuenta;
--    - experiencias no publicadas: se retiran y se desvinculan;
--    - alias: se libera.
--    Después se elimina el usuario de auth.users con la API de administración.
create or replace function public.process_account_deletion(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested timestamptz;
begin
  if not private.is_admin() and coalesce(auth.role(), '') <> 'service_role' then
    raise exception using errcode = '42501', message = 'VL403: no tienes permiso para procesar eliminaciones';
  end if;
  select deletion_requested_at into requested from public.profiles
   where id = p_user_id and status = 'eliminacion_solicitada' for update;
  if requested is null then
    perform private.raise_business_error('VL082', 'La cuenta no tiene una solicitud de eliminación pendiente.');
  end if;
  if requested > now() - interval '15 days' then
    perform private.raise_business_error('VL083', 'El plazo de cancelación de 15 días aún no ha terminado.');
  end if;

  perform set_config('vozlaboral.moderation', 'on', true);
  update public.experiences
     set status = 'retirada', status_reason = 'Retirada al eliminar la cuenta.'
   where author_id = p_user_id and status in ('en_revision', 'requiere_ajustes');
  update public.experiences set author_id = null, anonymized = true where author_id = p_user_id;
  perform set_config('vozlaboral.moderation', 'off', true);

  update public.content_reports set reporter_id = null where reporter_id = p_user_id;
  update public.appeals set author_id = null where author_id = p_user_id;
  update public.company_suggestions set suggested_by = null where suggested_by = p_user_id;
  update public.profiles set alias = null, status = 'eliminada', suspended_reason = null where id = p_user_id;

  perform private.log_moderation('profile', p_user_id, 'eliminacion_solicitada', 'eliminada', 'Cuenta anonimizada tras la solicitud del titular');
end;
$$;

-- 3. Purga por plazo de conservación. Pensada para ejecutarse con pg_cron o
--    con un proceso programado que use la clave de servicio.
create or replace function public.purge_expired_records()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  sec int;
  mod int;
begin
  if not private.is_admin() and coalesce(auth.role(), '') <> 'service_role' then
    raise exception using errcode = '42501', message = 'VL403: no tienes permiso para purgar registros';
  end if;
  perform set_config('vozlaboral.allow_purge', 'on', true);
  delete from public.security_events where created_at < now() - interval '12 months';
  get diagnostics sec = row_count;
  delete from public.moderation_events where created_at < now() - interval '5 years';
  get diagnostics mod = row_count;
  perform set_config('vozlaboral.allow_purge', 'off', true);
  perform private.log_security('purga_conservacion', jsonb_build_object('security_events', sec, 'moderation_events', mod));
  return jsonb_build_object('security_events', sec, 'moderation_events', mod);
end;
$$;

revoke all on function public.request_account_deletion(), public.cancel_account_deletion(),
  public.process_account_deletion(uuid), public.purge_expired_records() from public, anon;
grant execute on function public.request_account_deletion(), public.cancel_account_deletion(),
  public.process_account_deletion(uuid), public.purge_expired_records() to authenticated;
grant execute on function public.process_account_deletion(uuid), public.purge_expired_records() to service_role;

-- ===================== supabase/migrations/20261026000900_search_by_nit.sql =====================
-- VozLaboral · 0900 · Búsqueda de empresas por NIT exacto.
-- El NIT sigue en company_private_data (sin acceso público) y nunca se
-- devuelve: la función solo lo compara dentro del servidor. Solo hay
-- coincidencia con el NIT completo, para que no se pueda recorrer la lista
-- probando prefijos.

-- Acepta «899999068», «899.999.068», «899 999 068-1» u «8999990681».
-- Devuelve los NIT candidatos (con y sin dígito de verificación) o null.
create or replace function private.nit_candidates(p_query text)
returns text[]
language sql
immutable
set search_path = ''
as $$
  with limpio as (select regexp_replace(coalesce(p_query, ''), '[\s.]', '', 'g') as v)
  select case
    when v ~ '^[0-9]{6,12}-[0-9]$' then array[split_part(v, '-', 1)]
    when v ~ '^[0-9]{6,13}$' then array[v, left(v, -1)]
  end
  from limpio;
$$;

create or replace function public.search_companies(
  p_query text default null,
  p_city text default null,
  p_sector text default null,
  p_order text default 'relevancia',
  p_limit int default 20,
  p_offset int default 0
)
returns table (
  id uuid, slug text, trade_name text, legal_name text, sector text, city text, department text,
  visible_experiences bigint, last_activity timestamptz, total_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with q as (
    select nullif(private.normalize_text(p_query), '') as term,
           nullif(private.normalize_text(p_city), '') as city,
           nullif(private.normalize_text(p_sector), '') as sector,
           private.nit_candidates(p_query) as nits
  ),
  matches as (
    select c.*,
           greatest(
             coalesce(extensions.similarity(c.search_name, q.term), 0),
             coalesce((select max(extensions.similarity(a.search_alias, q.term)) from public.company_aliases a where a.company_id = c.id), 0),
             case when q.term is not null and c.search_name like q.term || '%' then 1 else 0 end,
             case when nit_match.found then 2 else 0 end
           ) as score
      from public.companies c
      cross join q
      cross join lateral (
        select q.nits is not null and exists (
          select 1 from public.company_private_data p where p.company_id = c.id and p.tax_id = any (q.nits)
        ) as found
      ) nit_match
     where c.status = 'activo'
       and (q.city is null or private.normalize_text(c.city) like '%' || q.city || '%')
       and (q.sector is null or private.normalize_text(c.sector) like '%' || q.sector || '%')
       and (
         q.term is null
         or nit_match.found
         or c.search_name like '%' || q.term || '%'
         or extensions.similarity(c.search_name, q.term) > 0.3
         or exists (select 1 from public.company_aliases a
                     where a.company_id = c.id
                       and (a.search_alias like '%' || q.term || '%' or extensions.similarity(a.search_alias, q.term) > 0.3))
       )
  ),
  stats as (
    select m.*,
           (select count(*) from public.experiences e where e.company_id = m.id and e.status in ('publicada', 'en_disputa')) as visible,
           (select max(e.published_at) from public.experiences e where e.company_id = m.id and e.status in ('publicada', 'en_disputa')) as last_pub
      from matches m
  )
  select s.id, s.slug, s.trade_name, s.legal_name, s.sector, s.city, s.department,
         s.visible, s.last_pub, count(*) over ()
    from stats s
   order by
     case when p_order = 'actividad' then s.last_pub end desc nulls last,
     s.score desc,
     s.trade_name
   limit least(greatest(coalesce(p_limit, 20), 1), 50)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke all on function private.nit_candidates(text) from public;
revoke all on function public.search_companies(text, text, text, text, int, int) from public;
grant execute on function public.search_companies(text, text, text, text, int, int) to anon, authenticated;

-- ===================== supabase/migrations/20261026001000_strict_company_search.sql =====================
-- VozLaboral · 1000 · Búsqueda estricta con sugerencias marcadas.
-- Coincidencia: todas las palabras buscadas aparecen en el nombre o en un
-- alias, o el NIT completo coincide. Solo si no hay ninguna coincidencia se
-- devuelven nombres parecidos, marcados con is_suggestion = true, para que la
-- interfaz no los presente como la empresa buscada.

drop function if exists public.search_companies(text, text, text, text, int, int);

create function public.search_companies(
  p_query text default null,
  p_city text default null,
  p_sector text default null,
  p_order text default 'relevancia',
  p_limit int default 20,
  p_offset int default 0
)
returns table (
  id uuid, slug text, trade_name text, legal_name text, sector text, city text, department text,
  visible_experiences bigint, last_activity timestamptz, total_count bigint, is_suggestion boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  with q as (
    select nullif(private.normalize_text(p_query), '') as term,
           string_to_array(nullif(private.normalize_text(p_query), ''), ' ') as words,
           nullif(private.normalize_text(p_city), '') as city,
           nullif(private.normalize_text(p_sector), '') as sector,
           private.nit_candidates(p_query) as nits
  ),
  candidates as (
    select c.*,
           q.term is null
             or (q.nits is not null and exists (
                   select 1 from public.company_private_data p where p.company_id = c.id and p.tax_id = any (q.nits)))
             or not exists (select 1 from unnest(q.words) w where c.search_name not like '%' || w || '%')
             or exists (select 1 from public.company_aliases a
                         where a.company_id = c.id
                           and not exists (select 1 from unnest(q.words) w where a.search_alias not like '%' || w || '%'))
             as strict,
           greatest(
             coalesce(extensions.similarity(c.search_name, q.term), 0),
             coalesce((select max(extensions.similarity(a.search_alias, q.term)) from public.company_aliases a where a.company_id = c.id), 0)
           ) as sim,
           q.term is not null and c.search_name like q.term || '%' as prefix
      from public.companies c, q
     where c.status = 'activo'
       and (q.city is null or private.normalize_text(c.city) like '%' || q.city || '%')
       and (q.sector is null or private.normalize_text(c.sector) like '%' || q.sector || '%')
  ),
  scored as (
    select c.*, bool_or(c.strict) over () as any_strict
      from candidates c
     where c.strict or c.sim > 0.3
  ),
  visible as (
    select s.*,
           (select count(*) from public.experiences e where e.company_id = s.id and e.status in ('publicada', 'en_disputa')) as visible,
           (select max(e.published_at) from public.experiences e where e.company_id = s.id and e.status in ('publicada', 'en_disputa')) as last_pub
      from scored s
     where s.strict or not s.any_strict
  )
  select v.id, v.slug, v.trade_name, v.legal_name, v.sector, v.city, v.department,
         v.visible, v.last_pub, count(*) over (), not v.strict
    from visible v
   order by
     case when p_order = 'actividad' then v.last_pub end desc nulls last,
     v.prefix desc,
     v.sim desc,
     v.trade_name
   limit least(greatest(coalesce(p_limit, 20), 1), 50)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke all on function public.search_companies(text, text, text, text, int, int) from public;
grant execute on function public.search_companies(text, text, text, text, int, int) to anon, authenticated;
