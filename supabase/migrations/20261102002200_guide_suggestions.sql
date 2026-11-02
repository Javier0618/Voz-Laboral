-- Sugerencias editoriales: temas de guías que conviene publicar o actualizar.
--
-- Las crea el «redactor» (una cuenta con el rol nuevo «redactor», que usa
-- Claude con scripts/editorial.mjs) después de revisar fuentes oficiales y
-- especializadas. La administración las revisa en Moderación → Sugerencias:
--   nueva ──► pedida (botón «Redactar guía») ──► redactada
--     │          └──► nueva (cancelar el pedido)
--     ├──► descartada
--     └──► existente («Ya la tenemos»)
-- Una sugerencia pedida se redacta como guía en BORRADOR (nunca se publica
-- sola) o, si es de tipo «actualizar», como propuesta de texto que la
-- administración aplica a la guía existente.
--
-- El redactor solo puede crear sugerencias y borradores, y solo mediante las
-- funciones de este archivo: no publica, no borra y no lee datos de usuarios.

-- ---------------------------------------------------------------------------
-- Rol «redactor»
-- ---------------------------------------------------------------------------
alter table public.admin_roles drop constraint if exists admin_roles_role_check;
alter table public.admin_roles
  add constraint admin_roles_role_check check (role in ('moderator', 'admin', 'redactor'));

-- La administración también puede actuar como redactor (útil para probar).
create or replace function private.is_redactor()
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
      and r.role in ('redactor', 'admin')
      and p.status = 'activa'
  );
$$;
revoke all on function private.is_redactor() from public;
grant execute on function private.is_redactor() to authenticated;

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
  if p_role not in ('moderator', 'admin', 'redactor') then
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

-- ---------------------------------------------------------------------------
-- Sugerencias
-- ---------------------------------------------------------------------------
create table public.guide_suggestions (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'nueva' check (kind in ('nueva', 'actualizar')),
  title text not null check (length(trim(title)) between 5 and 160),
  -- Por qué publicarla: norma nueva, cambio que afecta una guía, temporada…
  reason text not null check (length(trim(reason)) between 20 and 2000),
  -- Señales de interés o de búsqueda (estimación, no datos de Google).
  demand text not null default '' check (length(demand) <= 1000),
  priority text not null default 'media' check (priority in ('alta', 'media', 'baja')),
  topic text not null default '' check (topic ~ '^[a-z0-9-]{0,40}$'),
  keywords text[] not null default '{}' check (cardinality(keywords) <= 15),
  -- [{ "label": "...", "url": "https://..." }]
  sources jsonb not null default '[]'::jsonb
    check (jsonb_typeof(sources) = 'array' and jsonb_array_length(sources) <= 15),
  target_resource_id uuid references public.legal_resources (id) on delete set null,
  status text not null default 'nueva' check (status in ('nueva', 'pedida', 'redactada', 'descartada', 'existente')),
  -- Indicaciones de la administración al pedir la redacción.
  instructions text not null default '' check (length(instructions) <= 2000),
  draft_resource_id uuid references public.legal_resources (id) on delete set null,
  -- Para «actualizar»: texto completo propuesto y resumen de cambios.
  proposal text check (proposal is null or length(trim(proposal)) >= 50),
  proposal_notes text not null default '' check (length(proposal_notes) <= 2000),
  created_by uuid references auth.users (id) on delete set null,
  decided_by uuid references auth.users (id) on delete set null,
  requested_at timestamptz,
  drafted_at timestamptz,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
  -- «actualizar» exige guía de destino al crearse (editorial_add_suggestion); no
  -- se fuerza aquí para que borrar esa guía siga siendo posible.
);

create index guide_suggestions_status_idx on public.guide_suggestions (status, created_at desc);

create trigger guide_suggestions_touch before update on public.guide_suggestions
  for each row execute function private.touch_updated_at();

alter table public.guide_suggestions enable row level security;
revoke all on public.guide_suggestions from anon, authenticated;
grant select on public.guide_suggestions to authenticated;

create policy "sugerencias: administración y redacción" on public.guide_suggestions
  for select to authenticated using (private.is_admin() or private.is_redactor());

-- Comprueba que cada fuente sea {label, url} con dirección http(s).
create or replace function private.valid_suggestion_sources(p_sources jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(p_sources) = 'array'
     and not exists (
       select 1 from jsonb_array_elements(p_sources) s
       where jsonb_typeof(s) <> 'object'
          or coalesce(length(trim(s ->> 'label')), 0) not between 3 and 200
          or coalesce(s ->> 'url', '') !~ '^https?://[^\s]+$'
     );
$$;

-- ---------------------------------------------------------------------------
-- Redactor: crear una sugerencia. Si ya hay una abierta con el mismo título
-- (sin contar mayúsculas ni tildes), devuelve esa en lugar de duplicarla.
-- ---------------------------------------------------------------------------
create or replace function public.editorial_add_suggestion(
  p_kind text, p_title text, p_reason text, p_demand text default '', p_priority text default 'media',
  p_topic text default '', p_keywords text[] default '{}', p_sources jsonb default '[]'::jsonb, p_target_slug text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_target uuid;
  v_id uuid;
begin
  if not private.is_redactor() then
    raise exception using errcode = '42501', message = 'VL403: solo la redacción crea sugerencias';
  end if;
  if not private.valid_suggestion_sources(coalesce(p_sources, '[]'::jsonb)) then
    perform private.raise_business_error('VL080', 'Cada fuente necesita un nombre y una dirección http(s).');
  end if;
  if p_target_slug is not null then
    select id into v_target from public.legal_resources where slug = p_target_slug;
    if v_target is null then
      perform private.raise_business_error('VL081', 'No existe una guía con esa dirección.');
    end if;
  end if;
  if p_kind = 'actualizar' and v_target is null then
    perform private.raise_business_error('VL082', 'Una sugerencia de actualización necesita la guía que se actualiza.');
  end if;

  select id into v_id from public.guide_suggestions
   where status in ('nueva', 'pedida')
     and private.normalize_text(title) = private.normalize_text(p_title)
   limit 1;
  if v_id is not null then
    return v_id;
  end if;

  insert into public.guide_suggestions (kind, title, reason, demand, priority, topic, keywords, sources, target_resource_id, created_by)
  values (p_kind, trim(p_title), trim(p_reason), trim(coalesce(p_demand, '')), coalesce(p_priority, 'media'), coalesce(p_topic, ''),
          coalesce(p_keywords, '{}'), coalesce(p_sources, '[]'::jsonb), v_target, auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Administración: pedir, cancelar, descartar, marcar como existente o reabrir.
-- ---------------------------------------------------------------------------
create or replace function public.editorial_set_status(p_id uuid, p_status text, p_instructions text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current text;
begin
  if not private.is_admin() then
    raise exception using errcode = '42501', message = 'VL403: solo la administración decide sobre las sugerencias';
  end if;
  select status into v_current from public.guide_suggestions where id = p_id for update;
  if v_current is null then
    perform private.raise_business_error('VL083', 'La sugerencia no existe.');
  end if;
  if not (
       (v_current = 'nueva' and p_status in ('pedida', 'descartada', 'existente'))
    or (v_current = 'pedida' and p_status in ('nueva', 'descartada'))
    or (v_current in ('descartada', 'existente') and p_status = 'nueva')
    or (v_current = 'redactada' and p_status = 'descartada')
  ) then
    perform private.raise_business_error('VL084', format('No se puede pasar de «%s» a «%s».', v_current, p_status));
  end if;

  update public.guide_suggestions
     set status = p_status,
         instructions = case when p_status = 'pedida' then trim(coalesce(p_instructions, '')) else instructions end,
         requested_at = case when p_status = 'pedida' then now() when p_status = 'nueva' then null else requested_at end,
         decided_at = case when p_status in ('descartada', 'existente') then now() when p_status = 'nueva' then null else decided_at end,
         decided_by = auth.uid()
   where id = p_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Redactor: guarda la guía redactada como BORRADOR, con sus fuentes.
-- Si la dirección ya existe, añade un sufijo.
-- ---------------------------------------------------------------------------
create or replace function public.editorial_save_draft(
  p_id uuid, p_slug text, p_title text, p_summary text, p_content text, p_category_slug text default null,
  p_sources jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_suggestion public.guide_suggestions;
  v_slug text;
  v_resource uuid;
  v_source jsonb;
  attempt int := 0;
begin
  if not private.is_redactor() then
    raise exception using errcode = '42501', message = 'VL403: solo la redacción guarda borradores';
  end if;
  select * into v_suggestion from public.guide_suggestions where id = p_id for update;
  if v_suggestion.id is null or v_suggestion.status <> 'pedida' or v_suggestion.kind <> 'nueva' then
    perform private.raise_business_error('VL085', 'Solo se redacta una sugerencia de guía nueva que la administración pidió.');
  end if;
  if jsonb_typeof(coalesce(p_sources, '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_sources, '[]'::jsonb)) = 0 then
    perform private.raise_business_error('VL086', 'La guía necesita al menos una fuente.');
  end if;
  if not private.valid_suggestion_sources(p_sources) then
    perform private.raise_business_error('VL080', 'Cada fuente necesita un nombre y una dirección http(s).');
  end if;

  loop
    v_slug := case when attempt = 0 then p_slug else left(p_slug, 75) || '-' || (attempt + 1) end;
    exit when not exists (select 1 from public.legal_resources where slug = v_slug);
    attempt := attempt + 1;
    if attempt > 5 then
      perform private.raise_business_error('VL072', 'Ya existe una guía con una dirección muy parecida.');
    end if;
  end loop;

  insert into public.legal_resources (slug, title, summary, content, category_slug, status)
  values (v_slug, trim(p_title), trim(p_summary), trim(p_content), nullif(p_category_slug, ''), 'borrador')
  returning id into v_resource;

  for v_source in select * from jsonb_array_elements(p_sources) loop
    insert into public.legal_resource_sources (resource_id, label, publisher, url, accessed_at)
    values (v_resource, trim(v_source ->> 'label'), coalesce(nullif(trim(v_source ->> 'publisher'), ''), 'Fuente oficial'),
            v_source ->> 'url', coalesce((v_source ->> 'accessed_at')::date, current_date))
    on conflict (resource_id, url) do nothing;
  end loop;

  update public.guide_suggestions
     set status = 'redactada', draft_resource_id = v_resource, drafted_at = now()
   where id = p_id;
  return v_resource;
end;
$$;

-- ---------------------------------------------------------------------------
-- Redactor: propuesta de texto para actualizar una guía existente.
-- ---------------------------------------------------------------------------
create or replace function public.editorial_save_proposal(p_id uuid, p_content text, p_notes text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_suggestion public.guide_suggestions;
begin
  if not private.is_redactor() then
    raise exception using errcode = '42501', message = 'VL403: solo la redacción guarda propuestas';
  end if;
  select * into v_suggestion from public.guide_suggestions where id = p_id for update;
  if v_suggestion.id is null or v_suggestion.status <> 'pedida' or v_suggestion.kind <> 'actualizar' then
    perform private.raise_business_error('VL087', 'Solo se propone texto para una actualización que la administración pidió.');
  end if;
  update public.guide_suggestions
     set status = 'redactada', proposal = trim(p_content), proposal_notes = trim(coalesce(p_notes, '')), drafted_at = now()
   where id = p_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Administración: aplica la propuesta a la guía. Si la guía está publicada,
-- el cambio se ve de inmediato; la interfaz lo advierte antes.
-- ---------------------------------------------------------------------------
create or replace function public.editorial_apply_proposal(p_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_suggestion public.guide_suggestions;
  v_slug text;
begin
  if not private.is_admin() then
    raise exception using errcode = '42501', message = 'VL403: solo la administración aplica propuestas';
  end if;
  select * into v_suggestion from public.guide_suggestions where id = p_id for update;
  if v_suggestion.id is null or v_suggestion.status <> 'redactada' or v_suggestion.proposal is null or v_suggestion.target_resource_id is null then
    perform private.raise_business_error('VL088', 'Esta sugerencia no tiene una propuesta lista para aplicar.');
  end if;
  update public.legal_resources set content = v_suggestion.proposal
   where id = v_suggestion.target_resource_id
  returning slug into v_slug;
  update public.guide_suggestions
     set draft_resource_id = v_suggestion.target_resource_id, decided_at = now(), decided_by = auth.uid()
   where id = p_id;
  return v_slug;
end;
$$;

-- ---------------------------------------------------------------------------
-- Redactor: lista de guías existentes (también borradores) para no duplicar.
-- ---------------------------------------------------------------------------
create or replace function public.editorial_existing_guides()
returns table (slug text, title text, status text, category_slug text, last_verified_at date, updated_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_redactor() then
    raise exception using errcode = '42501', message = 'VL403: solo la redacción consulta esta lista';
  end if;
  return query
    select r.slug, r.title, r.status, r.category_slug, r.last_verified_at, r.updated_at
      from public.legal_resources r
     order by r.title;
end;
$$;

-- Contenido de una guía (para proponer actualizaciones), aunque no esté publicada.
create or replace function public.editorial_guide_content(p_slug text)
returns table (slug text, title text, summary text, content text, status text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_redactor() then
    raise exception using errcode = '42501', message = 'VL403: solo la redacción consulta guías sin publicar';
  end if;
  return query
    select r.slug, r.title, r.summary, r.content, r.status from public.legal_resources r where r.slug = p_slug;
end;
$$;

revoke all on function public.editorial_add_suggestion(text, text, text, text, text, text, text[], jsonb, text) from public, anon;
revoke all on function public.editorial_set_status(uuid, text, text) from public, anon;
revoke all on function public.editorial_save_draft(uuid, text, text, text, text, text, jsonb) from public, anon;
revoke all on function public.editorial_save_proposal(uuid, text, text) from public, anon;
revoke all on function public.editorial_apply_proposal(uuid) from public, anon;
revoke all on function public.editorial_existing_guides() from public, anon;
revoke all on function public.editorial_guide_content(text) from public, anon;
grant execute on function public.editorial_add_suggestion(text, text, text, text, text, text, text[], jsonb, text) to authenticated;
grant execute on function public.editorial_set_status(uuid, text, text) to authenticated;
grant execute on function public.editorial_save_draft(uuid, text, text, text, text, text, jsonb) to authenticated;
grant execute on function public.editorial_save_proposal(uuid, text, text) to authenticated;
grant execute on function public.editorial_apply_proposal(uuid) to authenticated;
grant execute on function public.editorial_existing_guides() to authenticated;
grant execute on function public.editorial_guide_content(text) to authenticated;
