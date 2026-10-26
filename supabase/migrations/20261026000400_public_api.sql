-- VozLaboral · Migración 4: vistas públicas y RPC.
-- Las vistas pertenecen al propietario de las tablas (no aplican RLS) y
-- exponen únicamente columnas publicables: nunca author_id, email ni auth.uid.

-- La columna proposed_by identifica una cuenta: no se expone.
revoke select on public.companies from anon, authenticated;
grant select (id, name, slug, city, sector, status, created_at, updated_at) on public.companies to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Vistas públicas
-- ---------------------------------------------------------------------------

create view public.public_experiences
with (security_barrier = true)
as
select
  e.id,
  e.company_id,
  c.name as company_name,
  c.slug as company_slug,
  e.category_id,
  cat.name as category_name,
  cat.slug as category_slug,
  e.period_start,
  e.period_end,
  e.relationship,
  e.title,
  e.account_direct,
  e.account_third_party,
  e.has_documents,
  e.status,
  e.published_at,
  coalesce(p.alias, 'Cuenta eliminada') as author_alias
from public.experiences e
join public.companies c on c.id = e.company_id and c.status = 'activa'
join public.experience_categories cat on cat.id = e.category_id
left join public.profiles p on p.id = e.author_id
where e.status in ('publicada', 'en_disputa');

create view public.public_company_responses
with (security_barrier = true)
as
select r.id, r.company_id, r.experience_id, r.body, r.published_at
from public.company_responses r
join public.companies c on c.id = r.company_id and c.status = 'activa'
where r.status = 'publicada';

revoke all on public.public_experiences from anon, authenticated;
revoke all on public.public_company_responses from anon, authenticated;
grant select on public.public_experiences to anon, authenticated;
grant select on public.public_company_responses to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Búsqueda y estadísticas públicas
-- ---------------------------------------------------------------------------

create or replace function public.search_companies(
  p_query text default null,
  p_city text default null,
  p_sector text default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  id uuid,
  name text,
  slug text,
  city text,
  sector text,
  experience_count bigint,
  total_count bigint
)
language sql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
  with q as (
    select
      nullif(public.normalize_text(p_query), '') as term,
      nullif(public.normalize_text(p_city), '') as city,
      nullif(public.normalize_text(p_sector), '') as sector
  ),
  matches as (
    select
      c.id, c.name, c.slug, c.city, c.sector,
      greatest(
        similarity(public.normalize_text(c.name), coalesce(q.term, '')),
        coalesce((
          select max(similarity(public.normalize_text(a.alias), q.term))
          from public.company_aliases a where a.company_id = c.id
        ), 0)
      ) as score
    from public.companies c, q
    where c.status = 'activa'
      and (q.city is null or public.normalize_text(c.city) = q.city)
      and (q.sector is null or public.normalize_text(c.sector) = q.sector)
      and (
        q.term is null
        or public.normalize_text(c.name) like '%' || q.term || '%'
        or public.normalize_text(c.name) % q.term
        or exists (
          select 1 from public.company_aliases a
          where a.company_id = c.id
            and (public.normalize_text(a.alias) like '%' || q.term || '%'
                 or public.normalize_text(a.alias) % q.term)
        )
      )
  )
  select
    m.id, m.name, m.slug, m.city, m.sector,
    (select count(*) from public.public_experiences pe where pe.company_id = m.id) as experience_count,
    count(*) over () as total_count
  from matches m
  order by m.score desc, m.name asc
  limit least(greatest(coalesce(p_limit, 20), 1), 50)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

-- Distribución por categoría. Oculta las categorías con menos de 3
-- publicaciones visibles para reducir el riesgo de identificar a alguien.
-- Sin puntuaciones ni rankings.
create or replace function public.company_stats(p_company_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with visible as (
    select pe.category_id, pe.category_name, pe.period_start, coalesce(pe.period_end, pe.period_start) as period_end
    from public.public_experiences pe
    where pe.company_id = p_company_id
  ),
  per_category as (
    select v.category_id, v.category_name, count(*) as total
    from visible v
    group by v.category_id, v.category_name
  )
  select jsonb_build_object(
    'visible_count', (select count(*) from visible),
    'period_from', (select min(v.period_start) from visible v),
    'period_to', (select max(v.period_end) from visible v),
    'categories', coalesce((
      select jsonb_agg(jsonb_build_object('category_id', pc.category_id, 'name', pc.category_name, 'count', pc.total)
                       order by pc.total desc, pc.category_name)
      from per_category pc where pc.total >= 3
    ), '[]'::jsonb),
    'hidden_categories', (select count(*) from per_category pc where pc.total < 3)
  );
$$;

create or replace function public.category_stats()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with per_category as (
    select pe.category_id, pe.category_name, count(*) as total
    from public.public_experiences pe
    group by pe.category_id, pe.category_name
  )
  select jsonb_build_object(
    'visible_count', (select count(*) from public.public_experiences),
    'period_from', (select min(pe.period_start) from public.public_experiences pe),
    'period_to', (select max(coalesce(pe.period_end, pe.period_start)) from public.public_experiences pe),
    'categories', coalesce((
      select jsonb_agg(jsonb_build_object('category_id', pc.category_id, 'name', pc.category_name, 'count', pc.total)
                       order by pc.total desc, pc.category_name)
      from per_category pc where pc.total >= 3
    ), '[]'::jsonb),
    'hidden_categories', (select count(*) from per_category pc where pc.total < 3)
  );
$$;

-- ---------------------------------------------------------------------------
-- Acciones de usuarios autenticados
-- ---------------------------------------------------------------------------

create or replace function public.require_user()
returns uuid
language plpgsql
stable
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Necesitas iniciar sesión' using errcode = '42501';
  end if;
  return v_uid;
end;
$$;

create or replace function public.slugify(p_text text)
returns text
language sql
immutable
set search_path = ''
as $$
  select btrim(regexp_replace(public.normalize_text(p_text), '[^a-z0-9]+', '-', 'g'), '-');
$$;

-- Propone una empresa que no existe. Queda como "propuesta" hasta que la
-- moderación la active. Si ya existe con el mismo nombre y ciudad, devuelve
-- la existente (cuando es visible) en lugar de duplicarla.
create or replace function public.propose_company(p_name text, p_city text default null, p_sector text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_user();
  v_existing uuid;
  v_recent integer;
  v_slug text;
  v_id uuid;
begin
  if char_length(btrim(coalesce(p_name, ''))) < 2 then
    raise exception 'Escribe el nombre de la empresa' using errcode = '22023';
  end if;

  select c.id into v_existing
  from public.companies c
  where public.normalize_text(c.name) = public.normalize_text(p_name)
    and public.normalize_text(coalesce(c.city, '')) = public.normalize_text(coalesce(p_city, ''))
    and (c.status = 'activa' or c.proposed_by = v_uid);
  if v_existing is not null then
    return v_existing;
  end if;

  select count(*) into v_recent from public.companies c
  where c.proposed_by = v_uid and c.created_at > now() - interval '24 hours';
  if v_recent >= 5 then
    raise exception 'Llegaste al límite de empresas propuestas por hoy' using errcode = 'P0001';
  end if;

  v_slug := public.slugify(p_name || coalesce('-' || nullif(btrim(p_city), ''), ''));
  if v_slug = '' then
    raise exception 'Nombre de empresa no válido' using errcode = '22023';
  end if;
  if exists (select 1 from public.companies c where c.slug = v_slug) then
    v_slug := v_slug || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
  end if;

  insert into public.companies (name, slug, city, sector, status, proposed_by)
  values (btrim(p_name), v_slug, nullif(btrim(p_city), ''), nullif(btrim(p_sector), ''), 'propuesta', v_uid)
  returning id into v_id;
  return v_id;
end;
$$;

-- La persona pide eliminar su cuenta. Se bloquean nuevas publicaciones y
-- la administración la procesa dentro del plazo de docs/retencion.md.
create or replace function public.request_account_deletion()
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_user();
  v_at timestamptz;
begin
  update public.profiles
     set deletion_requested_at = coalesce(deletion_requested_at, now())
   where id = v_uid
  returning deletion_requested_at into v_at;
  perform public.log_security_event('account_deletion_requested', v_uid, '{}'::jsonb);
  return v_at;
end;
$$;

create or replace function public.cancel_account_deletion()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_user();
begin
  update public.profiles set deletion_requested_at = null where id = v_uid;
  perform public.log_security_event('account_deletion_cancelled', v_uid, '{}'::jsonb);
end;
$$;

-- ---------------------------------------------------------------------------
-- Moderación (exige rol; todo cambio de estado queda en moderation_events)
-- ---------------------------------------------------------------------------

create or replace function public.require_moderator()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_user();
begin
  if not public.is_moderator() then
    perform public.log_security_event('moderation_denied', v_uid, '{}'::jsonb);
    raise exception 'No tienes permisos de moderación' using errcode = '42501';
  end if;
  return v_uid;
end;
$$;

create or replace function public.require_reason(p_reason text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
begin
  if char_length(btrim(coalesce(p_reason, ''))) < 3 then
    raise exception 'Indica el motivo de la decisión' using errcode = '22023';
  end if;
  return btrim(p_reason);
end;
$$;

create or replace function public.moderate_experience(
  p_experience_id uuid,
  p_new_status public.experience_status,
  p_reason text,
  p_internal_note text default null
)
returns public.experience_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_mod uuid := public.require_moderator();
  v_reason text := public.require_reason(p_reason);
  v_exp public.experiences%rowtype;
  v_company_status public.company_status;
begin
  select * into v_exp from public.experiences where id = p_experience_id for update;
  if not found then
    raise exception 'La experiencia no existe' using errcode = 'P0002';
  end if;
  if v_exp.author_id = v_mod then
    raise exception 'No puedes moderar tu propio contenido' using errcode = '42501';
  end if;
  if v_exp.status = p_new_status then
    raise exception 'La experiencia ya tiene ese estado' using errcode = '22023';
  end if;
  if not (
    (v_exp.status = 'en_revision' and p_new_status in ('publicada', 'requiere_ajustes', 'restringida', 'retirada'))
    or (v_exp.status = 'requiere_ajustes' and p_new_status in ('en_revision', 'restringida', 'retirada'))
    or (v_exp.status = 'publicada' and p_new_status in ('en_disputa', 'requiere_ajustes', 'restringida', 'retirada'))
    or (v_exp.status = 'en_disputa' and p_new_status in ('publicada', 'requiere_ajustes', 'restringida', 'retirada'))
    or (v_exp.status = 'restringida' and p_new_status in ('publicada', 'en_revision', 'retirada'))
    or (v_exp.status = 'retirada' and p_new_status in ('en_revision'))
  ) then
    raise exception 'Transición no permitida: % a %', v_exp.status, p_new_status using errcode = '22023';
  end if;
  if p_new_status = 'publicada' then
    select c.status into v_company_status from public.companies c where c.id = v_exp.company_id;
    if v_company_status <> 'activa' then
      raise exception 'Activa primero la empresa antes de publicar' using errcode = '22023';
    end if;
  end if;

  perform set_config('vozlaboral.moderation_rpc', 'on', true);
  update public.experiences
     set status = p_new_status,
         moderation_reason = v_reason,
         published_at = case when p_new_status = 'publicada' then coalesce(published_at, now()) else published_at end
   where id = p_experience_id;
  perform set_config('vozlaboral.moderation_rpc', 'off', true);

  perform public.log_moderation_event('experience', p_experience_id, v_exp.status::text, p_new_status::text,
                                      v_reason, p_internal_note, v_mod);
  return p_new_status;
end;
$$;

create or replace function public.set_company_status(
  p_company_id uuid,
  p_new_status public.company_status,
  p_reason text,
  p_internal_note text default null
)
returns public.company_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_mod uuid := public.require_moderator();
  v_reason text := public.require_reason(p_reason);
  v_old public.company_status;
begin
  select status into v_old from public.companies where id = p_company_id for update;
  if not found then
    raise exception 'La empresa no existe' using errcode = 'P0002';
  end if;
  if v_old = p_new_status then
    raise exception 'La empresa ya tiene ese estado' using errcode = '22023';
  end if;
  update public.companies set status = p_new_status where id = p_company_id;
  perform public.log_moderation_event('company', p_company_id, v_old::text, p_new_status::text,
                                      v_reason, p_internal_note, v_mod);
  return p_new_status;
end;
$$;

create or replace function public.add_company_alias(p_company_id uuid, p_alias text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_mod uuid := public.require_moderator();
  v_id uuid;
begin
  insert into public.company_aliases (company_id, alias) values (p_company_id, btrim(p_alias))
  returning id into v_id;
  perform public.log_moderation_event('company', p_company_id, null, 'alias_agregado',
                                      'Alias agregado: ' || btrim(p_alias), null, v_mod);
  return v_id;
end;
$$;

create or replace function public.resolve_report(
  p_report_id uuid,
  p_new_status public.report_status,
  p_resolution_note text,
  p_internal_note text default null
)
returns public.report_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_mod uuid := public.require_moderator();
  v_reason text := public.require_reason(p_resolution_note);
  v_report public.content_reports%rowtype;
begin
  select * into v_report from public.content_reports where id = p_report_id for update;
  if not found then
    raise exception 'El reporte no existe' using errcode = 'P0002';
  end if;
  if v_report.reporter_id = v_mod then
    raise exception 'No puedes resolver tu propio reporte' using errcode = '42501';
  end if;
  if v_report.status in ('resuelto', 'descartado') then
    raise exception 'El reporte ya está cerrado' using errcode = '22023';
  end if;
  update public.content_reports set status = p_new_status, resolution_note = v_reason where id = p_report_id;
  perform public.log_moderation_event('content_report', p_report_id, v_report.status::text, p_new_status::text,
                                      v_reason, p_internal_note, v_mod);
  return p_new_status;
end;
$$;

create or replace function public.review_company_claim(
  p_claim_id uuid,
  p_new_status public.claim_status,
  p_resolution_note text,
  p_internal_note text default null
)
returns public.claim_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_mod uuid := public.require_moderator();
  v_reason text := public.require_reason(p_resolution_note);
  v_claim public.company_claims%rowtype;
begin
  select * into v_claim from public.company_claims where id = p_claim_id for update;
  if not found then
    raise exception 'La reclamación no existe' using errcode = 'P0002';
  end if;
  if v_claim.claimant_id = v_mod then
    raise exception 'No puedes revisar tu propia reclamación' using errcode = '42501';
  end if;
  if v_claim.status <> 'pendiente' or p_new_status = 'pendiente' then
    raise exception 'La reclamación ya fue revisada' using errcode = '22023';
  end if;
  update public.company_claims
     set status = p_new_status, resolution_note = v_reason, reviewed_at = now()
   where id = p_claim_id;
  perform public.log_moderation_event('company_claim', p_claim_id, v_claim.status::text, p_new_status::text,
                                      v_reason, p_internal_note, v_mod);
  return p_new_status;
end;
$$;

create or replace function public.moderate_company_response(
  p_response_id uuid,
  p_new_status public.response_status,
  p_reason text,
  p_internal_note text default null
)
returns public.response_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_mod uuid := public.require_moderator();
  v_reason text := public.require_reason(p_reason);
  v_resp public.company_responses%rowtype;
begin
  select * into v_resp from public.company_responses where id = p_response_id for update;
  if not found then
    raise exception 'La respuesta no existe' using errcode = 'P0002';
  end if;
  if v_resp.responder_id = v_mod then
    raise exception 'No puedes moderar tu propia respuesta' using errcode = '42501';
  end if;
  if v_resp.status = p_new_status then
    raise exception 'La respuesta ya tiene ese estado' using errcode = '22023';
  end if;
  update public.company_responses
     set status = p_new_status,
         published_at = case when p_new_status = 'publicada' then coalesce(published_at, now()) else published_at end
   where id = p_response_id;
  perform public.log_moderation_event('company_response', p_response_id, v_resp.status::text, p_new_status::text,
                                      v_reason, p_internal_note, v_mod);
  return p_new_status;
end;
$$;

create or replace function public.resolve_appeal(
  p_appeal_id uuid,
  p_new_status public.appeal_status,
  p_resolution_note text,
  p_internal_note text default null
)
returns public.appeal_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_mod uuid := public.require_moderator();
  v_reason text := public.require_reason(p_resolution_note);
  v_appeal public.appeals%rowtype;
begin
  select * into v_appeal from public.appeals where id = p_appeal_id for update;
  if not found then
    raise exception 'La apelación no existe' using errcode = 'P0002';
  end if;
  if v_appeal.appellant_id = v_mod then
    raise exception 'No puedes resolver tu propia apelación' using errcode = '42501';
  end if;
  if v_appeal.status <> 'pendiente' or p_new_status = 'pendiente' then
    raise exception 'La apelación ya fue resuelta' using errcode = '22023';
  end if;
  update public.appeals
     set status = p_new_status, resolution_note = v_reason, resolved_at = now()
   where id = p_appeal_id;
  perform public.log_moderation_event('appeal', p_appeal_id, v_appeal.status::text, p_new_status::text,
                                      v_reason, p_internal_note, v_mod);
  -- Si se acepta, la experiencia se cambia aparte con moderate_experience,
  -- para que ese cambio quede registrado con su propio motivo.
  return p_new_status;
end;
$$;

-- ---------------------------------------------------------------------------
-- Administración
-- ---------------------------------------------------------------------------

create or replace function public.admin_set_role(p_user_id uuid, p_role public.app_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_user();
begin
  if not public.is_admin() then
    perform public.log_security_event('role_change_denied', v_uid, jsonb_build_object('target', p_user_id));
    raise exception 'Solo la administración puede asignar roles' using errcode = '42501';
  end if;
  if p_user_id = v_uid then
    raise exception 'No puedes cambiar tu propio rol' using errcode = '42501';
  end if;
  if p_role is null then
    delete from public.admin_roles where user_id = p_user_id;
  else
    insert into public.admin_roles (user_id, role, granted_by) values (p_user_id, p_role, v_uid)
    on conflict (user_id) do update set role = excluded.role, granted_by = excluded.granted_by;
  end if;
  perform public.log_security_event('role_changed', v_uid,
                                    jsonb_build_object('target', p_user_id, 'role', p_role));
end;
$$;

-- Ejecuta una solicitud de eliminación: anonimiza publicaciones y borra la
-- cuenta. moderation_events y security_events se conservan (sin FK).
create or replace function public.process_account_deletion(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_user();
  v_count integer;
begin
  if not public.is_admin() then
    perform public.log_security_event('account_deletion_denied', v_uid, jsonb_build_object('target', p_user_id));
    raise exception 'Solo la administración puede procesar eliminaciones' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles p where p.id = p_user_id and p.deletion_requested_at is not null) then
    raise exception 'No hay una solicitud de eliminación para esa cuenta' using errcode = '22023';
  end if;
  update public.experiences set anonymized_at = now() where author_id = p_user_id;
  get diagnostics v_count = row_count;
  delete from auth.users where id = p_user_id;
  perform public.log_security_event('account_deleted', p_user_id,
                                    jsonb_build_object('processed_by', v_uid, 'anonymized_experiences', v_count));
  return v_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- Permisos de ejecución
-- ---------------------------------------------------------------------------

revoke execute on function public.search_companies(text, text, text, integer, integer) from public;
revoke execute on function public.company_stats(uuid) from public;
revoke execute on function public.category_stats() from public;
grant execute on function public.search_companies(text, text, text, integer, integer) to anon, authenticated;
grant execute on function public.company_stats(uuid) to anon, authenticated;
grant execute on function public.category_stats() to anon, authenticated;

do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.propose_company(text, text, text)',
    'public.request_account_deletion()',
    'public.cancel_account_deletion()',
    'public.moderate_experience(uuid, public.experience_status, text, text)',
    'public.set_company_status(uuid, public.company_status, text, text)',
    'public.add_company_alias(uuid, text)',
    'public.resolve_report(uuid, public.report_status, text, text)',
    'public.review_company_claim(uuid, public.claim_status, text, text)',
    'public.moderate_company_response(uuid, public.response_status, text, text)',
    'public.resolve_appeal(uuid, public.appeal_status, text, text)',
    'public.admin_set_role(uuid, public.app_role)',
    'public.process_account_deletion(uuid)'
  ] loop
    execute format('revoke execute on function %s from public, anon', fn);
    execute format('grant execute on function %s to authenticated', fn);
  end loop;
end;
$$;

revoke execute on function public.require_moderator() from public, anon, authenticated;
