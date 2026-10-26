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
