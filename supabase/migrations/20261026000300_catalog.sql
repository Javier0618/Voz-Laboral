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
