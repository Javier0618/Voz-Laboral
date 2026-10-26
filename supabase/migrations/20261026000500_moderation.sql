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
