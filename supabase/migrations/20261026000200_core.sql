-- VozLaboral · Migración 2: empresas, categorías, experiencias y auditoría
-- de moderación.

-- ---------------------------------------------------------------------------
-- Auditoría de moderación (solo inserción)
-- ---------------------------------------------------------------------------

create type public.moderation_entity as enum (
  'experience', 'company', 'company_response', 'content_report', 'company_claim', 'appeal'
);

create table public.moderation_events (
  id bigint generated always as identity primary key,
  entity_type public.moderation_entity not null,
  entity_id uuid not null,
  previous_status text,
  new_status text not null,
  reason text not null check (char_length(reason) between 3 and 1000),
  internal_note text check (internal_note is null or char_length(internal_note) <= 2000),
  -- Sin FK a propósito: el registro debe sobrevivir a la eliminación de la cuenta.
  moderator_id uuid,
  created_at timestamptz not null default now()
);

create index moderation_events_entity_idx on public.moderation_events (entity_type, entity_id, created_at desc);
create index moderation_events_moderator_idx on public.moderation_events (moderator_id, created_at desc);

create trigger moderation_events_append_only
  before update or delete on public.moderation_events
  for each row execute function public.prevent_audit_mutation();

create or replace function public.log_moderation_event(
  p_entity public.moderation_entity,
  p_entity_id uuid,
  p_previous text,
  p_new text,
  p_reason text,
  p_note text,
  p_moderator uuid
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.moderation_events
    (entity_type, entity_id, previous_status, new_status, reason, internal_note, moderator_id)
  values (p_entity, p_entity_id, p_previous, p_new, p_reason, nullif(btrim(p_note), ''), p_moderator);
$$;

-- ---------------------------------------------------------------------------
-- Empresas
-- ---------------------------------------------------------------------------

create type public.company_status as enum ('propuesta', 'activa', 'oculta');

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 160),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 180),
  city text check (city is null or char_length(btrim(city)) between 2 and 80),
  sector text check (sector is null or char_length(btrim(sector)) between 2 and 80),
  status public.company_status not null default 'propuesta',
  proposed_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index companies_slug_unique on public.companies (slug);
-- Antiduplicado: misma razón social normalizada en la misma ciudad.
create unique index companies_name_city_unique
  on public.companies (public.normalize_text(name), public.normalize_text(coalesce(city, '')));
create index companies_name_trgm on public.companies
  using gin (public.normalize_text(name) extensions.gin_trgm_ops);
create index companies_city_idx on public.companies (public.normalize_text(city));
create index companies_sector_idx on public.companies (public.normalize_text(sector));
create index companies_status_idx on public.companies (status);

create trigger companies_updated_at
  before update on public.companies
  for each row execute function public.set_updated_at();

create table public.company_aliases (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  alias text not null check (char_length(btrim(alias)) between 2 and 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index company_aliases_unique on public.company_aliases (company_id, public.normalize_text(alias));
create index company_aliases_trgm on public.company_aliases
  using gin (public.normalize_text(alias) extensions.gin_trgm_ops);

create trigger company_aliases_updated_at
  before update on public.company_aliases
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Categorías
-- ---------------------------------------------------------------------------

create table public.experience_categories (
  id smallint primary key,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null unique,
  description text,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger experience_categories_updated_at
  before update on public.experience_categories
  for each row execute function public.set_updated_at();

insert into public.experience_categories (id, slug, name, sort_order) values
  (1, 'pago-de-salarios', 'Pago de salarios', 1),
  (2, 'contrato-y-condiciones', 'Contrato y condiciones laborales', 2),
  (3, 'ascensos-y-ajustes', 'Ascensos y ajustes salariales', 3),
  (4, 'abuso-de-autoridad', 'Abuso de autoridad', 4),
  (5, 'posible-acoso-laboral', 'Posible acoso laboral', 5),
  (6, 'jornadas-y-descansos', 'Jornadas y descansos', 6),
  (7, 'seguridad-y-salud', 'Seguridad y salud en el trabajo', 7),
  (8, 'discriminacion-y-trato-desigual', 'Discriminación y trato desigual', 8),
  (9, 'organizacion-y-administracion', 'Organización y administración', 9),
  (10, 'otras-situaciones', 'Otras situaciones laborales', 10);

-- ---------------------------------------------------------------------------
-- Experiencias
-- ---------------------------------------------------------------------------

create type public.experience_status as enum (
  'en_revision', 'publicada', 'requiere_ajustes', 'en_disputa', 'restringida', 'retirada'
);

create type public.work_relationship as enum ('actual', 'anterior', 'prefiero_no_decir');

create table public.experiences (
  id uuid primary key default gen_random_uuid(),
  -- Se pone a null al eliminar la cuenta: la publicación queda anonimizada.
  author_id uuid references public.profiles (id) on delete set null,
  company_id uuid not null references public.companies (id) on delete restrict,
  category_id smallint not null references public.experience_categories (id),
  period_start date not null,
  period_end date,
  relationship public.work_relationship not null,
  title text check (title is null or char_length(btrim(title)) between 3 and 120),
  -- Lo que la persona vio o vivió directamente.
  account_direct text not null default '',
  -- Lo que conoce por terceros (opcional).
  account_third_party text,
  has_documents boolean not null default false,
  rules_accepted_at timestamptz not null default now(),
  status public.experience_status not null default 'en_revision',
  -- Motivo visible para el autor. La nota interna vive en moderation_events.
  moderation_reason text,
  content_hash text not null,
  published_at timestamptz,
  anonymized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint experiences_account_length check (
    char_length(account_direct) + char_length(coalesce(account_third_party, '')) between 200 and 5000
  ),
  constraint experiences_period_order check (period_end is null or period_end >= period_start),
  constraint experiences_period_range check (period_start >= date '1990-01-01')
);

create unique index experiences_author_hash_unique on public.experiences (author_id, content_hash)
  where author_id is not null;
create index experiences_company_status_idx on public.experiences (company_id, status, published_at desc);
create index experiences_category_status_idx on public.experiences (category_id, status);
create index experiences_author_idx on public.experiences (author_id, created_at desc);
create index experiences_status_published_idx on public.experiences (status, published_at desc);

create trigger experiences_updated_at
  before update on public.experiences
  for each row execute function public.set_updated_at();

create or replace function public.experience_content_hash(p_direct text, p_third text)
returns text
language sql
immutable
set search_path = ''
as $$
  select encode(
    sha256(convert_to(public.normalize_text(coalesce(p_direct, '')) || '|' || public.normalize_text(coalesce(p_third, '')), 'UTF8')),
    'hex'
  );
$$;

-- true si la sentencia viene directamente de un usuario (API pública) y no de
-- una función security definer del sistema.
create or replace function public.is_end_user_context()
returns boolean
language sql
stable
set search_path = ''
as $$
  select current_user in ('anon', 'authenticated');
$$;

create or replace function public.experiences_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_recent integer;
  v_has_alias boolean;
begin
  if v_uid is null then
    raise exception 'Necesitas iniciar sesión' using errcode = '42501';
  end if;
  if new.author_id is distinct from v_uid then
    raise exception 'No puedes publicar en nombre de otra cuenta' using errcode = '42501';
  end if;

  select p.alias is not null and p.deletion_requested_at is null
    into v_has_alias
    from public.profiles p where p.id = v_uid;
  if not coalesce(v_has_alias, false) then
    raise exception 'Elige un alias antes de compartir una experiencia' using errcode = '22023';
  end if;

  select count(*) into v_recent
    from public.experiences e
    where e.author_id = v_uid and e.created_at > now() - interval '24 hours';
  if v_recent >= 3 then
    raise exception 'Llegaste al límite de 3 publicaciones en 24 horas' using errcode = 'P0001';
  end if;

  -- Valores controlados por el sistema, sin importar lo que envíe el cliente.
  new.status := 'en_revision';
  new.moderation_reason := null;
  new.published_at := null;
  new.anonymized_at := null;
  new.rules_accepted_at := now();
  new.created_at := now();
  new.content_hash := public.experience_content_hash(new.account_direct, new.account_third_party);
  return new;
end;
$$;

create trigger experiences_before_insert
  before insert on public.experiences
  for each row execute function public.experiences_before_insert();

-- Se ejecuta con los privilegios de quien hace el UPDATE (no security definer)
-- para poder distinguir a un usuario de la API de una RPC de moderación.
create or replace function public.experiences_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.is_end_user_context() then
    if new.author_id is distinct from old.author_id
       or new.status is distinct from old.status
       or new.published_at is distinct from old.published_at
       or new.moderation_reason is distinct from old.moderation_reason
       or new.company_id is distinct from old.company_id
       or new.anonymized_at is distinct from old.anonymized_at
       or new.created_at is distinct from old.created_at then
      raise exception 'Solo la moderación puede cambiar el estado de una experiencia' using errcode = '42501';
    end if;
    if old.status not in ('en_revision', 'requiere_ajustes') then
      raise exception 'Esta experiencia ya no se puede editar' using errcode = '42501';
    end if;
    -- Al editar tras una solicitud de ajustes vuelve a revisión.
    if old.status = 'requiere_ajustes' then
      new.status := 'en_revision';
    end if;
  end if;
  new.content_hash := public.experience_content_hash(new.account_direct, new.account_third_party);
  return new;
end;
$$;

create trigger experiences_before_update
  before update on public.experiences
  for each row execute function public.experiences_before_update();

-- Registra el reenvío del autor. Las RPC de moderación marcan la transacción
-- con vozlaboral.moderation_rpc y registran su propio evento.
create or replace function public.experiences_log_resubmission()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status = 'requiere_ajustes' and new.status = 'en_revision'
     and coalesce(current_setting('vozlaboral.moderation_rpc', true), '') <> 'on' then
    perform public.log_moderation_event(
      'experience', old.id, 'requiere_ajustes', 'en_revision',
      'Reenviada por el autor tras ajustes', null, null
    );
  end if;
  return new;
end;
$$;

create trigger experiences_log_resubmission
  after update on public.experiences
  for each row execute function public.experiences_log_resubmission();

-- ---------------------------------------------------------------------------
-- Archivos de evidencia: estructura preparada, sin habilitar.
-- ---------------------------------------------------------------------------

create table public.evidence_files (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.experiences (id) on delete cascade,
  uploader_id uuid references public.profiles (id) on delete set null,
  storage_path text not null unique check (char_length(storage_path) <= 500),
  mime_type text not null check (mime_type in ('application/pdf', 'image/png', 'image/jpeg')),
  size_bytes integer not null check (size_bytes between 1 and 10485760),
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  status text not null default 'pendiente' check (status in ('pendiente', 'revisado', 'rechazado', 'eliminado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index evidence_files_hash_unique on public.evidence_files (experience_id, sha256);

create trigger evidence_files_updated_at
  before update on public.evidence_files
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS y privilegios
-- ---------------------------------------------------------------------------

alter table public.moderation_events enable row level security;
alter table public.companies enable row level security;
alter table public.company_aliases enable row level security;
alter table public.experience_categories enable row level security;
alter table public.experiences enable row level security;
alter table public.evidence_files enable row level security;

-- moderation_events: solo lectura para moderación; nadie escribe directamente.
revoke all on public.moderation_events from anon, authenticated;
grant select on public.moderation_events to authenticated;
create policy moderation_events_select_moderation on public.moderation_events
  for select to authenticated
  using (public.is_moderator());

-- companies: lectura pública de las activas. Las propuestas solo las ven
-- quien las propuso y la moderación. La escritura va por RPC.
revoke all on public.companies from anon, authenticated;
grant select on public.companies to anon, authenticated;
create policy companies_select_public on public.companies
  for select to anon, authenticated
  using (status = 'activa');
create policy companies_select_own_proposal on public.companies
  for select to authenticated
  using (proposed_by = auth.uid());
create policy companies_select_moderation on public.companies
  for select to authenticated
  using (public.is_moderator());

revoke all on public.company_aliases from anon, authenticated;
grant select on public.company_aliases to anon, authenticated;
create policy company_aliases_select_public on public.company_aliases
  for select to anon, authenticated
  using (exists (select 1 from public.companies c where c.id = company_id and c.status = 'activa'));
create policy company_aliases_select_moderation on public.company_aliases
  for select to authenticated
  using (public.is_moderator());

revoke all on public.experience_categories from anon, authenticated;
grant select on public.experience_categories to anon, authenticated;
create policy experience_categories_select_all on public.experience_categories
  for select to anon, authenticated
  using (true);

-- experiences: la tabla base nunca es pública (contiene author_id).
-- La lectura pública va por la vista public_experiences.
revoke all on public.experiences from anon, authenticated;
grant select on public.experiences to authenticated;
grant insert (company_id, category_id, period_start, period_end, relationship, title,
              account_direct, account_third_party, has_documents, author_id)
  on public.experiences to authenticated;
grant update (category_id, period_start, period_end, relationship, title,
              account_direct, account_third_party, has_documents)
  on public.experiences to authenticated;

create policy experiences_select_own on public.experiences
  for select to authenticated
  using (author_id = auth.uid());
create policy experiences_select_moderation on public.experiences
  for select to authenticated
  using (public.is_moderator());
create policy experiences_insert_own on public.experiences
  for insert to authenticated
  with check (author_id = auth.uid() and status = 'en_revision');
create policy experiences_update_own on public.experiences
  for update to authenticated
  using (author_id = auth.uid() and status in ('en_revision', 'requiere_ajustes'))
  with check (author_id = auth.uid());

-- evidence_files: RLS cerrada. Sin políticas ni privilegios hasta que los
-- controles de archivos (antivirus, revisión, metadatos) estén listos.
revoke all on public.evidence_files from anon, authenticated;

revoke execute on function public.log_moderation_event(public.moderation_entity, uuid, text, text, text, text, uuid)
  from public, anon, authenticated;
revoke execute on function public.experiences_before_insert() from public, anon, authenticated;
revoke execute on function public.experiences_log_resubmission() from public, anon, authenticated;
