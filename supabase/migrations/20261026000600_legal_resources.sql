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
