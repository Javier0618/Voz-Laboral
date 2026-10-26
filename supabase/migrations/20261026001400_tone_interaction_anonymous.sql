-- VozLaboral · 1400 · Experiencias buenas y malas, envíos sin cuenta con
-- enlace de seguimiento, reacciones de apoyo y comentarios.
--
-- Decisiones:
--  - Cada experiencia indica su tono (positiva, negativa o mixta) y las
--    categorías pasan a nombres neutros (los slugs no cambian).
--  - Se puede compartir sin cuenta. Quien lo hace recibe un enlace privado
--    de seguimiento; solo se guarda el hash del token. Al registrarse puede
--    vincular la experiencia a su cuenta.
--  - Reaccionar y comentar exige cuenta con alias.
--  - Los comentarios se publican al instante, salvo que parezcan contener
--    datos personales: entonces quedan retenidos para revisión.
--  - El autor puede desactivar los comentarios de su experiencia.

-- ---------------------------------------------------------------------------
-- 1. Tono y categorías neutras
-- ---------------------------------------------------------------------------
alter table public.experiences add column tone text;
update public.experiences set tone = 'negativa' where tone is null;
alter table public.experiences
  alter column tone set default 'mixta',
  alter column tone set not null,
  add constraint experiences_tone_check check (tone in ('positiva', 'negativa', 'mixta'));
create index experiences_tone_idx on public.experiences (tone, status);

update public.experience_categories set name = v.name, description = v.description
  from (values
    ('pago-salarios', 'Salario y pagos', 'Puntualidad y forma de pago del salario, prestaciones y beneficios económicos.'),
    ('contrato-condiciones', 'Contrato y condiciones', 'Tipo de contrato, condiciones pactadas y si la empresa las cumple.'),
    ('ascensos-ajustes', 'Crecimiento y ascensos', 'Oportunidades de crecer, formación, ascensos y ajustes salariales.'),
    ('abuso-autoridad', 'Trato de los jefes', 'Cómo dirigen y tratan los jefes: respeto, órdenes, apoyo o abuso de autoridad.'),
    ('posible-acoso-laboral', 'Posible acoso laboral', 'Conductas reiteradas que podrían constituir acoso laboral, y cómo respondió la empresa.'),
    ('jornadas-descansos', 'Horarios y descansos', 'Jornada, horas extra, recargos, descansos, vacaciones y equilibrio con la vida personal.'),
    ('seguridad-salud', 'Seguridad y salud en el trabajo', 'Prevención de riesgos, elementos de protección y bienestar en el lugar de trabajo.'),
    ('discriminacion', 'Igualdad e inclusión', 'Trato igualitario, inclusión y diversidad, o situaciones de discriminación.'),
    ('organizacion-administracion', 'Ambiente y organización', 'Ambiente de trabajo, comunicación interna y organización de la empresa.'),
    ('otras', 'Otras experiencias', 'Experiencias sobre el trabajo que no encajan en las demás categorías.')
  ) as v(slug, name, description)
 where experience_categories.slug = v.slug;

-- ---------------------------------------------------------------------------
-- 2. Envíos sin cuenta y ajustes del autor
-- ---------------------------------------------------------------------------
alter table public.experiences
  add column submitted_without_account boolean not null default false,
  add column tracking_hash text unique,
  add column comments_enabled boolean not null default true;

grant select (tone, comments_enabled, submitted_without_account) on public.experiences to anon, authenticated;
grant insert (tone) on public.experiences to authenticated;
grant update (tone) on public.experiences to authenticated;

-- Sustituye el control de ediciones para admitir dos cambios del sistema:
-- activar o desactivar comentarios y vincular un envío sin cuenta.
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
  -- Ajuste de comentarios por su autor: no toca el contenido ni el estado.
  if current_setting('vozlaboral.settings', true) = 'on' and auth.uid() = old.author_id then
    return new;
  end if;
  -- Vinculación de un envío sin cuenta a la cuenta de quien tiene el enlace.
  if current_setting('vozlaboral.claim', true) = 'on' and old.author_id is null and old.submitted_without_account
     and new.author_id = auth.uid() then
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

-- Las inserciones sin cuenta solo entran por submit_anonymous_experience(),
-- que marca la transacción. El resto sigue las reglas de siempre.
create or replace function private.before_experience_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  author public.profiles%rowtype;
  recent int;
  anonymous boolean := current_setting('vozlaboral.anonymous_submission', true) = 'on' and auth.uid() is null;
begin
  if anonymous then
    new.author_id := null;
    new.submitted_without_account := true;
    -- Freno global: sin cuenta no hay a quién limitar individualmente.
    select count(*) into recent from public.experiences
      where submitted_without_account and created_at > now() - interval '1 hour';
    if recent >= 30 then
      perform private.raise_business_error('VL037', 'Ahora mismo hay muchos envíos sin cuenta. Crea una cuenta o inténtalo en un rato.');
    end if;
  else
    -- El autor siempre es quien hace la petición: no se puede suplantar.
    new.author_id := auth.uid();
    new.submitted_without_account := false;
    new.tracking_hash := null;
    select * into author from public.profiles where id = new.author_id;
    if author.id is null or author.alias is null then
      perform private.raise_business_error('VL030', 'Elige un alias público antes de compartir una experiencia.');
    end if;
    if author.status <> 'activa' then
      perform private.raise_business_error('VL031', 'Tu cuenta no puede publicar en este momento.');
    end if;
    select count(*) into recent from public.experiences
      where author_id = new.author_id and created_at > now() - interval '24 hours';
    if recent >= 3 then
      perform private.log_security('limite_publicaciones', jsonb_build_object('limite', 3));
      perform private.raise_business_error('VL033', 'Puedes enviar hasta 3 experiencias cada 24 horas. Inténtalo más tarde.');
    end if;
  end if;

  if not exists (select 1 from public.companies c where c.id = new.company_id and c.status = 'activo') then
    perform private.raise_business_error('VL032', 'La empresa seleccionada no está disponible en el catálogo.');
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
  new.comments_enabled := true;
  new.content_hash := md5(private.normalize_text(new.body));
  new.auto_flags := private.detect_personal_data(coalesce(new.title, '') || ' ' || new.body);

  if exists (select 1 from public.experiences
             where content_hash = new.content_hash
               and (author_id = new.author_id or (anonymous and submitted_without_account and created_at > now() - interval '30 days'))) then
    perform private.raise_business_error('VL035', 'Ya se envió una experiencia con este mismo texto.');
  end if;

  return new;
end;
$$;

create or replace function public.submit_anonymous_experience(
  p_company_id uuid, p_category text, p_tone text, p_period_start date, p_period_end date,
  p_relationship text, p_title text, p_body text, p_has_documents boolean, p_rules_accepted boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  token text := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  new_id uuid;
begin
  if auth.uid() is not null then
    perform private.raise_business_error('VL038', 'Ya iniciaste sesión: comparte desde tu cuenta para verla en Mi cuenta.');
  end if;
  perform set_config('vozlaboral.anonymous_submission', 'on', true);
  insert into public.experiences (company_id, category_slug, tone, period_start, period_end, relationship, title, body,
                                  has_documents, rules_accepted, tracking_hash)
  values (p_company_id, p_category, coalesce(p_tone, 'mixta'), p_period_start, p_period_end, p_relationship,
          nullif(trim(p_title), ''), p_body, coalesce(p_has_documents, false), coalesce(p_rules_accepted, false),
          encode(sha256(convert_to(token, 'UTF8')), 'hex'))
  returning id into new_id;
  perform set_config('vozlaboral.anonymous_submission', 'off', true);
  return jsonb_build_object('id', new_id, 'token', token, 'status', 'en_revision');
end;
$$;

-- Vista de seguimiento para quien tiene el enlace: estado, motivo y la
-- reacción de la comunidad. Nunca devuelve datos de otras cuentas.
create or replace function public.get_tracked_experience(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  e public.experiences%rowtype;
begin
  if p_token is null or length(p_token) <> 64 then
    return null;
  end if;
  select * into e from public.experiences
   where tracking_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex');
  if e.id is null then
    return null;
  end if;
  return jsonb_build_object(
    'id', e.id, 'title', e.title, 'tone', e.tone, 'status', e.status, 'status_reason', e.status_reason,
    'created_at', e.created_at, 'published_at', e.published_at,
    'company_name', (select c.trade_name from public.companies c where c.id = e.company_id),
    'company_slug', (select c.slug from public.companies c where c.id = e.company_id),
    'category_name', (select cat.name from public.experience_categories cat where cat.slug = e.category_slug),
    'reactions', private.reaction_counts(e.id),
    'comments_count', (select count(*) from public.experience_comments m where m.experience_id = e.id and m.status = 'publicado')
  );
end;
$$;

create or replace function public.claim_tracked_experience(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  exp_id uuid;
  author public.profiles%rowtype;
begin
  select * into author from public.profiles where id = auth.uid();
  if author.id is null or author.alias is null or author.status <> 'activa' then
    perform private.raise_business_error('VL030', 'Inicia sesión y elige un alias antes de vincular la experiencia.');
  end if;
  select id into exp_id from public.experiences
   where tracking_hash = encode(sha256(convert_to(coalesce(p_token, ''), 'UTF8')), 'hex')
     and author_id is null and submitted_without_account
   for update;
  if exp_id is null then
    perform private.raise_business_error('VL404', 'El enlace de seguimiento no es válido o ya se vinculó a una cuenta.');
  end if;
  perform set_config('vozlaboral.claim', 'on', true);
  update public.experiences set author_id = auth.uid(), tracking_hash = null where id = exp_id;
  perform set_config('vozlaboral.claim', 'off', true);
  perform private.log_moderation('experience', exp_id, 'sin_cuenta', 'vinculada', 'Envío sin cuenta vinculado a la cuenta de su autor');
  return exp_id;
end;
$$;

create or replace function public.set_comments_enabled(p_experience_id uuid, p_enabled boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.experiences where id = p_experience_id and author_id = auth.uid()) then
    perform private.raise_business_error('VL404', 'No encontramos esa experiencia en tu cuenta.');
  end if;
  perform set_config('vozlaboral.settings', 'on', true);
  update public.experiences set comments_enabled = coalesce(p_enabled, true) where id = p_experience_id;
  perform set_config('vozlaboral.settings', 'off', true);
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Reacciones de apoyo (no son votos ni puntuaciones)
-- ---------------------------------------------------------------------------
create table public.experience_reactions (
  experience_id uuid not null references public.experiences (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('me_paso', 'me_sirvio', 'gracias')),
  created_at timestamptz not null default now(),
  primary key (experience_id, user_id, kind)
);
create index experience_reactions_experience_idx on public.experience_reactions (experience_id);

create or replace function private.experience_is_public(p_experience_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.experiences e where e.id = p_experience_id and e.status in ('publicada', 'en_disputa'));
$$;

create or replace function private.account_can_interact()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'activa' and p.alias is not null);
$$;

create or replace function private.reaction_counts(p_experience_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'me_paso', count(*) filter (where kind = 'me_paso'),
    'me_sirvio', count(*) filter (where kind = 'me_sirvio'),
    'gracias', count(*) filter (where kind = 'gracias'))
  from public.experience_reactions where experience_id = p_experience_id;
$$;

alter table public.experience_reactions enable row level security;
revoke all on public.experience_reactions from anon, authenticated;
grant select (experience_id, kind, created_at) on public.experience_reactions to authenticated;
grant insert (experience_id, kind) on public.experience_reactions to authenticated;
grant delete on public.experience_reactions to authenticated;

create policy "reacciones propias" on public.experience_reactions
  for select to authenticated using (user_id = auth.uid());
create policy "reaccionar a experiencias públicas" on public.experience_reactions
  for insert to authenticated
  with check (user_id = auth.uid() and private.experience_is_public(experience_id) and private.account_can_interact());
create policy "quitar reacción propia" on public.experience_reactions
  for delete to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 4. Comentarios
-- ---------------------------------------------------------------------------
create table public.experience_comments (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.experiences (id) on delete cascade,
  author_id uuid default auth.uid() references public.profiles (id) on delete set null,
  body text not null check (length(trim(body)) between 2 and 1000),
  status text not null default 'publicado' check (status in ('publicado', 'retenido', 'oculto', 'eliminado')),
  status_reason text,
  auto_flags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index experience_comments_experience_idx on public.experience_comments (experience_id, status, created_at);
create index experience_comments_author_idx on public.experience_comments (author_id, created_at desc);
create index experience_comments_queue_idx on public.experience_comments (status, created_at) where status = 'retenido';

create trigger experience_comments_touch before update on public.experience_comments
  for each row execute function private.touch_updated_at();

create or replace function private.before_comment_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  recent int;
begin
  new.author_id := auth.uid();
  if not private.account_can_interact() then
    perform private.raise_business_error('VL060', 'Inicia sesión y elige un alias para comentar.');
  end if;
  if not exists (select 1 from public.experiences e
                  where e.id = new.experience_id and e.status in ('publicada', 'en_disputa') and e.comments_enabled) then
    perform private.raise_business_error('VL061', 'Esta experiencia no admite comentarios.');
  end if;
  select count(*) into recent from public.experience_comments
   where author_id = new.author_id and created_at > now() - interval '24 hours';
  if recent >= 30 then
    perform private.raise_business_error('VL062', 'Has comentado mucho hoy. Inténtalo de nuevo mañana.');
  end if;
  new.body := trim(new.body);
  new.auto_flags := private.detect_personal_data(new.body);
  new.status := case when cardinality(new.auto_flags) > 0 then 'retenido' else 'publicado' end;
  new.status_reason := null;
  return new;
end;
$$;

create trigger experience_comments_before_insert before insert on public.experience_comments
  for each row execute function private.before_comment_insert();

alter table public.experience_comments enable row level security;
revoke all on public.experience_comments from anon, authenticated;
-- author_id y auto_flags no se exponen: la lectura pública va por list_comments().
grant insert (experience_id, body) on public.experience_comments to authenticated;

create policy "comentar con cuenta" on public.experience_comments
  for insert to authenticated with check (author_id = auth.uid());

-- Comentarios visibles de una experiencia pública, con alias y sin
-- identificadores de cuenta. Quien comentó ve también los suyos retenidos.
create or replace function public.list_comments(p_experience_id uuid)
returns table (id uuid, author_alias text, is_experience_author boolean, is_mine boolean, body text, status text, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select m.id,
         coalesce(p.alias, 'Cuenta eliminada'),
         m.author_id is not null and m.author_id = e.author_id,
         m.author_id is not null and m.author_id = auth.uid(),
         m.body, m.status, m.created_at
    from public.experience_comments m
    join public.experiences e on e.id = m.experience_id and e.status in ('publicada', 'en_disputa')
    left join public.profiles p on p.id = m.author_id
   where m.experience_id = p_experience_id
     and (m.status = 'publicado' or (m.status = 'retenido' and m.author_id = auth.uid()))
   order by m.created_at;
$$;

create or replace function public.delete_my_comment(p_comment_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.experience_comments set status = 'eliminado', status_reason = 'Eliminado por su autor.'
   where id = p_comment_id and author_id = auth.uid() and status <> 'eliminado';
  if not found then
    perform private.raise_business_error('VL404', 'No encontramos ese comentario en tu cuenta.');
  end if;
end;
$$;

-- Reacciones y comentarios de varias experiencias a la vez, para los listados.
create or replace function public.experience_engagement(p_ids uuid[])
returns table (experience_id uuid, me_paso bigint, me_sirvio bigint, gracias bigint, comments bigint, my_reactions text[], comments_enabled boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select e.id,
         (select count(*) from public.experience_reactions r where r.experience_id = e.id and r.kind = 'me_paso'),
         (select count(*) from public.experience_reactions r where r.experience_id = e.id and r.kind = 'me_sirvio'),
         (select count(*) from public.experience_reactions r where r.experience_id = e.id and r.kind = 'gracias'),
         (select count(*) from public.experience_comments m where m.experience_id = e.id and m.status = 'publicado'),
         coalesce((select array_agg(r.kind order by r.kind) from public.experience_reactions r
                    where r.experience_id = e.id and r.user_id = auth.uid()), '{}'),
         e.comments_enabled
    from public.experiences e
   where e.id = any (p_ids[1:50]) and e.status in ('publicada', 'en_disputa');
$$;

-- ---------------------------------------------------------------------------
-- 5. Reportes y moderación de comentarios
-- ---------------------------------------------------------------------------
alter table public.content_reports add column comment_id uuid references public.experience_comments (id) on delete cascade;
alter table public.content_reports drop constraint content_reports_experience_id_reporter_id_key;
create unique index content_reports_unique_target on public.content_reports (experience_id, comment_id, reporter_id) nulls not distinct;
grant select (comment_id) on public.content_reports to authenticated;
grant insert (comment_id) on public.content_reports to authenticated;

create or replace function private.comment_is_public(p_comment_id uuid, p_experience_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.experience_comments m
                  where m.id = p_comment_id and m.experience_id = p_experience_id and m.status = 'publicado');
$$;

create policy "reportar solo comentarios visibles" on public.content_reports
  as restrictive for insert to authenticated
  with check (comment_id is null or private.comment_is_public(comment_id, experience_id));

alter table public.moderation_events drop constraint moderation_events_target_type_check;
alter table public.moderation_events add constraint moderation_events_target_type_check
  check (target_type in ('experience', 'report', 'claim', 'appeal', 'profile', 'company', 'company_response',
                         'company_suggestion', 'legal_resource', 'comment'));

create or replace function public.moderate_comment(p_comment_id uuid, p_new_status text, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.experience_comments%rowtype;
begin
  if not private.is_moderator() then
    raise exception using errcode = '42501', message = 'VL403: no tienes permiso para moderar comentarios';
  end if;
  if p_new_status not in ('publicado', 'oculto') then
    perform private.raise_business_error('VL050', 'Estado de moderación no válido.');
  end if;
  if p_reason is null or length(trim(p_reason)) < 10 then
    perform private.raise_business_error('VL051', 'Escribe un motivo de al menos 10 caracteres.');
  end if;
  select * into c from public.experience_comments where id = p_comment_id for update;
  if c.id is null then
    perform private.raise_business_error('VL404', 'El comentario no existe.');
  end if;
  if c.author_id = auth.uid() then
    perform private.raise_business_error('VL052', 'No puedes moderar tus propios comentarios.');
  end if;
  if c.status = p_new_status then
    perform private.raise_business_error('VL053', 'El comentario ya está en ese estado.');
  end if;
  update public.experience_comments set status = p_new_status, status_reason = trim(p_reason) where id = p_comment_id;
  perform private.log_moderation('comment', p_comment_id, c.status, p_new_status, trim(p_reason));
end;
$$;

create or replace function public.moderation_comments(p_filter text default 'retenido')
returns table (
  id uuid, experience_id uuid, experience_title text, company_name text, body text, status text,
  auto_flags text[], author_alias text, open_reports bigint, created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_moderator() then
    raise exception using errcode = '42501', message = 'VL403: no tienes permiso para ver los comentarios en moderación';
  end if;
  return query
    select m.id, e.id, coalesce(e.title, cat.name), co.trade_name, m.body, m.status, m.auto_flags,
           coalesce(p.alias, 'Cuenta eliminada'),
           (select count(*) from public.content_reports r where r.comment_id = m.id and r.status in ('abierto', 'en_revision')) as reports,
           m.created_at
      from public.experience_comments m
      join public.experiences e on e.id = m.experience_id
      join public.companies co on co.id = e.company_id
      join public.experience_categories cat on cat.slug = e.category_slug
      left join public.profiles p on p.id = m.author_id
     where (p_filter = 'retenido' and m.status = 'retenido')
        or (p_filter = 'reportados' and m.status = 'publicado' and exists (
              select 1 from public.content_reports r where r.comment_id = m.id and r.status in ('abierto', 'en_revision')))
        or (p_filter = 'ocultos' and m.status = 'oculto')
     order by m.created_at
     limit 100;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. Funciones de lectura con tono, sin cuenta e interacción
-- ---------------------------------------------------------------------------
drop function public.list_experiences(uuid, text, date, date, int, int);
create function public.list_experiences(
  p_company_id uuid default null,
  p_category text default null,
  p_from date default null,
  p_to date default null,
  p_limit int default 20,
  p_offset int default 0,
  p_tone text default null
)
returns table (
  id uuid, company_id uuid, company_slug text, company_name text, category_slug text, category_name text,
  period_start date, period_end date, relationship text, title text, body text, has_documents boolean,
  status text, published_at timestamptz, author_alias text, tone text, comments_enabled boolean, total_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select e.id, c.id, c.slug, c.trade_name, cat.slug, cat.name,
         e.period_start, e.period_end, e.relationship, e.title, e.body, e.has_documents,
         e.status, e.published_at,
         case when e.submitted_without_account and e.author_id is null then 'Persona sin cuenta'
              when e.anonymized or p.alias is null then 'Autor anónimo'
              else p.alias end,
         e.tone, e.comments_enabled,
         count(*) over ()
    from public.experiences e
    join public.companies c on c.id = e.company_id and c.status = 'activo'
    join public.experience_categories cat on cat.slug = e.category_slug
    left join public.profiles p on p.id = e.author_id
   where e.status in ('publicada', 'en_disputa')
     and (p_company_id is null or e.company_id = p_company_id)
     and (p_category is null or e.category_slug = p_category)
     and (p_tone is null or e.tone = p_tone)
     and (p_from is null or coalesce(e.period_end, e.period_start) >= p_from)
     and (p_to is null or e.period_start <= p_to)
   order by e.published_at desc nulls last, e.id
   limit least(greatest(coalesce(p_limit, 20), 1), 50)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

drop function public.my_experiences();
create function public.my_experiences()
returns table (
  id uuid, company_id uuid, company_slug text, company_name text, category_slug text, category_name text,
  period_start date, period_end date, relationship text, title text, body text, has_documents boolean,
  status text, status_reason text, published_at timestamptz, created_at timestamptz, updated_at timestamptz,
  tone text, comments_enabled boolean, reactions jsonb, comments_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select e.id, c.id, c.slug, c.trade_name, cat.slug, cat.name,
         e.period_start, e.period_end, e.relationship, e.title, e.body, e.has_documents,
         e.status, e.status_reason, e.published_at, e.created_at, e.updated_at,
         e.tone, e.comments_enabled, private.reaction_counts(e.id),
         (select count(*) from public.experience_comments m where m.experience_id = e.id and m.status = 'publicado')
    from public.experiences e
    join public.companies c on c.id = e.company_id
    join public.experience_categories cat on cat.slug = e.category_slug
   where auth.uid() is not null and e.author_id = auth.uid()
   order by e.created_at desc;
$$;

drop function public.moderation_queue(text, int, int);
create function public.moderation_queue(p_status text default 'en_revision', p_limit int default 50, p_offset int default 0)
returns table (
  id uuid, company_id uuid, company_name text, category_slug text, title text, body text,
  period_start date, period_end date, relationship text, has_documents boolean, status text,
  status_reason text, auto_flags text[], author_alias text, author_id uuid, open_reports bigint, created_at timestamptz,
  tone text, submitted_without_account boolean
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
           case when e.submitted_without_account and e.author_id is null then 'Persona sin cuenta'
                else coalesce(p.alias, 'Cuenta eliminada') end,
           e.author_id,
           (select count(*) from public.content_reports r where r.experience_id = e.id and r.comment_id is null and r.status in ('abierto', 'en_revision')),
           e.created_at, e.tone, e.submitted_without_account
      from public.experiences e
      join public.companies c on c.id = e.company_id
      left join public.profiles p on p.id = e.author_id
     where p_status is null or e.status = p_status
     order by cardinality(e.auto_flags) desc, e.created_at
     limit least(greatest(p_limit, 1), 100) offset greatest(p_offset, 0);
end;
$$;

-- Eliminación de cuenta: los comentarios quedan sin autor («Cuenta eliminada»).
create or replace function private.anonymize_comments_on_profile_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'eliminada' and old.status <> 'eliminada' then
    update public.experience_comments set author_id = null where author_id = new.id;
    delete from public.experience_reactions where user_id = new.id;
  end if;
  return new;
end;
$$;

create trigger profiles_anonymize_interaction after update of status on public.profiles
  for each row execute function private.anonymize_comments_on_profile_delete();

-- ---------------------------------------------------------------------------
-- Permisos de ejecución
-- ---------------------------------------------------------------------------
revoke all on function public.submit_anonymous_experience(uuid, text, text, date, date, text, text, text, boolean, boolean),
  public.get_tracked_experience(text), public.claim_tracked_experience(text), public.set_comments_enabled(uuid, boolean),
  public.list_comments(uuid), public.delete_my_comment(uuid), public.experience_engagement(uuid[]),
  public.moderate_comment(uuid, text, text), public.moderation_comments(text),
  public.list_experiences(uuid, text, date, date, int, int, text), public.my_experiences(),
  public.moderation_queue(text, int, int) from public;

grant execute on function public.submit_anonymous_experience(uuid, text, text, date, date, text, text, text, boolean, boolean),
  public.get_tracked_experience(text), public.list_comments(uuid), public.experience_engagement(uuid[]),
  public.list_experiences(uuid, text, date, date, int, int, text) to anon, authenticated;
grant execute on function public.claim_tracked_experience(text), public.set_comments_enabled(uuid, boolean),
  public.delete_my_comment(uuid), public.moderate_comment(uuid, text, text), public.moderation_comments(text),
  public.my_experiences(), public.moderation_queue(text, int, int) to authenticated;

revoke all on function private.experience_is_public(uuid), private.account_can_interact(), private.reaction_counts(uuid),
  private.comment_is_public(uuid, uuid) from public;
grant execute on function private.experience_is_public(uuid), private.account_can_interact(), private.comment_is_public(uuid, uuid)
  to authenticated;
