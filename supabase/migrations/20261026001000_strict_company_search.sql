-- VozLaboral · 1000 · Búsqueda estricta con sugerencias marcadas.
-- Coincidencia: todas las palabras buscadas aparecen en el nombre o en un
-- alias, o el NIT completo coincide. Solo si no hay ninguna coincidencia se
-- devuelven nombres parecidos, marcados con is_suggestion = true, para que la
-- interfaz no los presente como la empresa buscada.

drop function if exists public.search_companies(text, text, text, text, int, int);

create function public.search_companies(
  p_query text default null,
  p_city text default null,
  p_sector text default null,
  p_order text default 'relevancia',
  p_limit int default 20,
  p_offset int default 0
)
returns table (
  id uuid, slug text, trade_name text, legal_name text, sector text, city text, department text,
  visible_experiences bigint, last_activity timestamptz, total_count bigint, is_suggestion boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  with q as (
    select nullif(private.normalize_text(p_query), '') as term,
           string_to_array(nullif(private.normalize_text(p_query), ''), ' ') as words,
           nullif(private.normalize_text(p_city), '') as city,
           nullif(private.normalize_text(p_sector), '') as sector,
           private.nit_candidates(p_query) as nits
  ),
  candidates as (
    select c.*,
           q.term is null
             or (q.nits is not null and exists (
                   select 1 from public.company_private_data p where p.company_id = c.id and p.tax_id = any (q.nits)))
             or not exists (select 1 from unnest(q.words) w where c.search_name not like '%' || w || '%')
             or exists (select 1 from public.company_aliases a
                         where a.company_id = c.id
                           and not exists (select 1 from unnest(q.words) w where a.search_alias not like '%' || w || '%'))
             as strict,
           greatest(
             coalesce(extensions.similarity(c.search_name, q.term), 0),
             coalesce((select max(extensions.similarity(a.search_alias, q.term)) from public.company_aliases a where a.company_id = c.id), 0)
           ) as sim,
           q.term is not null and c.search_name like q.term || '%' as prefix
      from public.companies c, q
     where c.status = 'activo'
       and (q.city is null or private.normalize_text(c.city) like '%' || q.city || '%')
       and (q.sector is null or private.normalize_text(c.sector) like '%' || q.sector || '%')
  ),
  scored as (
    select c.*, bool_or(c.strict) over () as any_strict
      from candidates c
     where c.strict or c.sim > 0.3
  ),
  visible as (
    select s.*,
           (select count(*) from public.experiences e where e.company_id = s.id and e.status in ('publicada', 'en_disputa')) as visible,
           (select max(e.published_at) from public.experiences e where e.company_id = s.id and e.status in ('publicada', 'en_disputa')) as last_pub
      from scored s
     where s.strict or not s.any_strict
  )
  select v.id, v.slug, v.trade_name, v.legal_name, v.sector, v.city, v.department,
         v.visible, v.last_pub, count(*) over (), not v.strict
    from visible v
   order by
     case when p_order = 'actividad' then v.last_pub end desc nulls last,
     v.prefix desc,
     v.sim desc,
     v.trade_name
   limit least(greatest(coalesce(p_limit, 20), 1), 50)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke all on function public.search_companies(text, text, text, text, int, int) from public;
grant execute on function public.search_companies(text, text, text, text, int, int) to anon, authenticated;
