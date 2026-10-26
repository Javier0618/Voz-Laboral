-- VozLaboral · Migración 3: reportes, respuestas de empresas, reclamaciones,
-- apelaciones y recursos legales.

-- ---------------------------------------------------------------------------
-- Reportes de contenido
-- ---------------------------------------------------------------------------

create type public.report_reason as enum (
  'datos_personales', 'informacion_falsa', 'lenguaje_ofensivo', 'acoso', 'empresa_equivocada', 'otro'
);
create type public.report_status as enum ('abierto', 'en_revision', 'resuelto', 'descartado');

create table public.content_reports (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid references public.experiences (id) on delete cascade,
  company_response_id uuid,
  reporter_id uuid references public.profiles (id) on delete set null,
  reason public.report_reason not null,
  details text check (details is null or char_length(details) <= 2000),
  status public.report_status not null default 'abierto',
  resolution_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_reports_target check (num_nonnulls(experience_id, company_response_id) = 1)
);

-- Antiduplicado: un reporte abierto por persona y contenido.
create unique index content_reports_open_unique
  on public.content_reports (reporter_id, coalesce(experience_id, company_response_id))
  where status in ('abierto', 'en_revision') and reporter_id is not null;
create index content_reports_status_idx on public.content_reports (status, created_at);

create trigger content_reports_updated_at
  before update on public.content_reports
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Reclamaciones de empresas (representación o corrección)
-- ---------------------------------------------------------------------------

create type public.claim_type as enum ('representacion', 'correccion');
create type public.claim_status as enum ('pendiente', 'aprobada', 'rechazada');

create table public.company_claims (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  experience_id uuid references public.experiences (id) on delete set null,
  claimant_id uuid references public.profiles (id) on delete set null,
  claim_type public.claim_type not null,
  claimant_name text not null check (char_length(btrim(claimant_name)) between 3 and 120),
  claimant_position text not null check (char_length(btrim(claimant_position)) between 2 and 120),
  contact_email text not null check (contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(contact_email) <= 200),
  message text not null check (char_length(message) between 20 and 3000),
  status public.claim_status not null default 'pendiente',
  resolution_note text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index company_claims_pending_unique
  on public.company_claims (claimant_id, company_id, claim_type, coalesce(experience_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where status = 'pendiente' and claimant_id is not null;
create index company_claims_status_idx on public.company_claims (status, created_at);

create trigger company_claims_updated_at
  before update on public.company_claims
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Respuestas de empresas
-- ---------------------------------------------------------------------------

create type public.response_status as enum ('en_revision', 'publicada', 'retirada');

create table public.company_responses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  experience_id uuid not null references public.experiences (id) on delete cascade,
  responder_id uuid references public.profiles (id) on delete set null,
  body text not null check (char_length(body) between 20 and 3000),
  status public.response_status not null default 'en_revision',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Una respuesta vigente por experiencia.
create unique index company_responses_one_active
  on public.company_responses (experience_id)
  where status in ('en_revision', 'publicada');
create index company_responses_company_idx on public.company_responses (company_id, status);

create trigger company_responses_updated_at
  before update on public.company_responses
  for each row execute function public.set_updated_at();

alter table public.content_reports
  add constraint content_reports_response_fk
  foreign key (company_response_id) references public.company_responses (id) on delete cascade;

-- ---------------------------------------------------------------------------
-- Apelaciones de decisiones de moderación
-- ---------------------------------------------------------------------------

create type public.appeal_status as enum ('pendiente', 'aceptada', 'rechazada');

create table public.appeals (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.experiences (id) on delete cascade,
  appellant_id uuid references public.profiles (id) on delete set null,
  reason text not null check (char_length(reason) between 20 and 2000),
  status public.appeal_status not null default 'pendiente',
  resolution_note text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index appeals_one_pending on public.appeals (experience_id) where status = 'pendiente';

create trigger appeals_updated_at
  before update on public.appeals
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Recursos legales
-- ---------------------------------------------------------------------------

create type public.verification_status as enum ('pendiente_verificacion', 'verificado');

create table public.legal_resources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  summary text not null,
  body text,
  category_id smallint references public.experience_categories (id),
  verification_status public.verification_status not null default 'pendiente_verificacion',
  verified_at timestamptz,
  is_published boolean not null default false,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint legal_resources_verified_date check (
    (verification_status = 'verificado') = (verified_at is not null)
  )
);

create trigger legal_resources_updated_at
  before update on public.legal_resources
  for each row execute function public.set_updated_at();

create table public.legal_resource_sources (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.legal_resources (id) on delete cascade,
  citation text not null check (char_length(citation) between 3 and 300),
  url text check (url is null or url ~ '^https://'),
  verification_status public.verification_status not null default 'pendiente_verificacion',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index legal_resource_sources_unique on public.legal_resource_sources (resource_id, citation);

create trigger legal_resource_sources_updated_at
  before update on public.legal_resource_sources
  for each row execute function public.set_updated_at();

-- Fichas iniciales: solo estructura y temas. El contenido jurídico queda
-- pendiente de verificación por un abogado colombiano; no se publican normas
-- ni enlaces sin verificar.
insert into public.legal_resources (slug, title, summary, category_id, is_published, sort_order) values
  ('pago-de-salarios', 'Pago de salarios', 'Qué revisar si el salario llega tarde, incompleto o no llega.', 1, true, 1),
  ('contrato-y-condiciones', 'Contrato y condiciones laborales', 'Qué tener en cuenta sobre el tipo de contrato y sus condiciones.', 2, true, 2),
  ('jornadas-y-descansos', 'Jornadas y descansos', 'Qué revisar sobre horarios, horas extra y descansos.', 6, true, 3),
  ('posible-acoso-laboral', 'Posible acoso laboral', 'Qué hacer si vives una situación que podría ser acoso laboral.', 5, true, 4),
  ('seguridad-y-salud', 'Seguridad y salud en el trabajo', 'Qué revisar sobre riesgos, afiliación y condiciones de seguridad.', 7, true, 5),
  ('datos-personales', 'Tus datos personales', 'Qué puedes pedir sobre el tratamiento de tus datos personales.', null, true, 6);

-- ---------------------------------------------------------------------------
-- RLS y privilegios
-- ---------------------------------------------------------------------------

alter table public.content_reports enable row level security;
alter table public.company_claims enable row level security;
alter table public.company_responses enable row level security;
alter table public.appeals enable row level security;
alter table public.legal_resources enable row level security;
alter table public.legal_resource_sources enable row level security;

-- Comprueba, sin exponer la experiencia, que pertenece a la empresa y es
-- visible públicamente. Necesaria porque quien reclama no puede leer la tabla
-- base de experiencias.
create or replace function public.experience_is_public_for_company(p_experience uuid, p_company uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.experiences e
    join public.companies c on c.id = e.company_id
    where e.id = p_experience
      and e.company_id = p_company
      and e.status in ('publicada', 'en_disputa')
      and c.status = 'activa'
  );
$$;

create or replace function public.experience_is_public(p_experience uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.experiences e
    join public.companies c on c.id = e.company_id
    where e.id = p_experience
      and e.status in ('publicada', 'en_disputa')
      and c.status = 'activa'
  );
$$;

-- content_reports: la persona crea y ve los suyos; la moderación ve todos.
revoke all on public.content_reports from anon, authenticated;
grant select on public.content_reports to authenticated;
grant insert (experience_id, company_response_id, reporter_id, reason, details) on public.content_reports to authenticated;
create policy content_reports_insert_own on public.content_reports
  for insert to authenticated
  with check (
    reporter_id = auth.uid()
    and status = 'abierto'
    and (experience_id is null or public.experience_is_public(experience_id))
  );
create policy content_reports_select_own on public.content_reports
  for select to authenticated
  using (reporter_id = auth.uid());
create policy content_reports_select_moderation on public.content_reports
  for select to authenticated
  using (public.is_moderator());

-- company_claims: nunca públicas. Quien reclama ve las suyas.
revoke all on public.company_claims from anon, authenticated;
grant select on public.company_claims to authenticated;
grant insert (company_id, experience_id, claimant_id, claim_type, claimant_name, claimant_position, contact_email, message)
  on public.company_claims to authenticated;
create policy company_claims_insert_own on public.company_claims
  for insert to authenticated
  with check (
    claimant_id = auth.uid()
    and status = 'pendiente'
    and (experience_id is null or public.experience_is_public_for_company(experience_id, company_id))
  );
create policy company_claims_select_own on public.company_claims
  for select to authenticated
  using (claimant_id = auth.uid());
create policy company_claims_select_moderation on public.company_claims
  for select to authenticated
  using (public.is_moderator());

-- company_responses: solo representantes con reclamación de representación
-- aprobada pueden crear; quedan en revisión. Lo público va por vista.
create or replace function public.is_company_representative(p_company uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.company_claims c
    where c.company_id = p_company
      and c.claimant_id = auth.uid()
      and c.claim_type = 'representacion'
      and c.status = 'aprobada'
  );
$$;

revoke all on public.company_responses from anon, authenticated;
grant select on public.company_responses to authenticated;
grant insert (company_id, experience_id, responder_id, body) on public.company_responses to authenticated;
create policy company_responses_insert_representative on public.company_responses
  for insert to authenticated
  with check (
    responder_id = auth.uid()
    and status = 'en_revision'
    and published_at is null
    and public.is_company_representative(company_id)
    and public.experience_is_public_for_company(experience_id, company_id)
  );
create policy company_responses_select_own on public.company_responses
  for select to authenticated
  using (responder_id = auth.uid());
create policy company_responses_select_moderation on public.company_responses
  for select to authenticated
  using (public.is_moderator());

-- appeals: el autor apela decisiones sobre sus propias experiencias.
revoke all on public.appeals from anon, authenticated;
grant select on public.appeals to authenticated;
grant insert (experience_id, appellant_id, reason) on public.appeals to authenticated;
create policy appeals_insert_own on public.appeals
  for insert to authenticated
  with check (
    appellant_id = auth.uid()
    and status = 'pendiente'
    and exists (
      select 1 from public.experiences e
      where e.id = experience_id
        and e.author_id = auth.uid()
        and e.status in ('requiere_ajustes', 'en_disputa', 'restringida', 'retirada')
    )
  );
create policy appeals_select_own on public.appeals
  for select to authenticated
  using (appellant_id = auth.uid());
create policy appeals_select_moderation on public.appeals
  for select to authenticated
  using (public.is_moderator());

-- legal_resources: lectura pública de lo publicado. Escritura solo admin.
revoke all on public.legal_resources from anon, authenticated;
grant select on public.legal_resources to anon, authenticated;
grant insert, update on public.legal_resources to authenticated;
create policy legal_resources_select_published on public.legal_resources
  for select to anon, authenticated
  using (is_published);
create policy legal_resources_select_admin on public.legal_resources
  for select to authenticated
  using (public.is_admin());
create policy legal_resources_insert_admin on public.legal_resources
  for insert to authenticated
  with check (public.is_admin());
create policy legal_resources_update_admin on public.legal_resources
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

revoke all on public.legal_resource_sources from anon, authenticated;
grant select on public.legal_resource_sources to anon, authenticated;
grant insert, update on public.legal_resource_sources to authenticated;
create policy legal_resource_sources_select_published on public.legal_resource_sources
  for select to anon, authenticated
  using (exists (select 1 from public.legal_resources r where r.id = resource_id and r.is_published));
create policy legal_resource_sources_select_admin on public.legal_resource_sources
  for select to authenticated
  using (public.is_admin());
create policy legal_resource_sources_insert_admin on public.legal_resource_sources
  for insert to authenticated
  with check (public.is_admin());
create policy legal_resource_sources_update_admin on public.legal_resource_sources
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());
