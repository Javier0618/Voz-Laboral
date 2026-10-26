-- VozLaboral · 0900 · Búsqueda de empresas por NIT exacto.
-- El NIT sigue en company_private_data (sin acceso público) y nunca se
-- devuelve: la función solo lo compara dentro del servidor. Solo hay
-- coincidencia con el NIT completo, para que no se pueda recorrer la lista
-- probando prefijos.

-- Acepta «899999068», «899.999.068», «899 999 068-1» u «8999990681».
-- Devuelve los NIT candidatos (con y sin dígito de verificación) o null.
create or replace function private.nit_candidates(p_query text)
returns text[]
language sql
immutable
set search_path = ''
as $$
  with limpio as (select regexp_replace(coalesce(p_query, ''), '[\s.]', '', 'g') as v)
  select case
    when v ~ '^[0-9]{6,12}-[0-9]$' then array[split_part(v, '-', 1)]
    when v ~ '^[0-9]{6,13}$' then array[v, left(v, -1)]
  end
  from limpio;
$$;

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
           nullif(private.normalize_text(p_sector), '') as sector,
           private.nit_candidates(p_query) as nits
  ),
  matches as (
    select c.*,
           greatest(
             coalesce(extensions.similarity(c.search_name, q.term), 0),
             coalesce((select max(extensions.similarity(a.search_alias, q.term)) from public.company_aliases a where a.company_id = c.id), 0),
             case when q.term is not null and c.search_name like q.term || '%' then 1 else 0 end,
             case when nit_match.found then 2 else 0 end
           ) as score
      from public.companies c
      cross join q
      cross join lateral (
        select q.nits is not null and exists (
          select 1 from public.company_private_data p where p.company_id = c.id and p.tax_id = any (q.nits)
        ) as found
      ) nit_match
     where c.status = 'activo'
       and (q.city is null or private.normalize_text(c.city) like '%' || q.city || '%')
       and (q.sector is null or private.normalize_text(c.sector) like '%' || q.sector || '%')
       and (
         q.term is null
         or nit_match.found
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

revoke all on function private.nit_candidates(text) from public;
revoke all on function public.search_companies(text, text, text, text, int, int) from public;
grant execute on function public.search_companies(text, text, text, text, int, int) to anon, authenticated;
