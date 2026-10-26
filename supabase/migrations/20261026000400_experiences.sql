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
