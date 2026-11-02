-- Buscador del sitio (/buscar) y registro anónimo de búsquedas.
--
-- 1. search_guides: busca en las guías publicadas sin distinguir mayúsculas
--    ni tildes. Cada palabra de la búsqueda debe aparecer en el título, el
--    resumen o el texto. Ordena primero las coincidencias en el título.
-- 2. search_log: cuenta cuántas veces se buscó cada término por día y
--    cuántos resultados hubo. Es ANÓNIMO: no guarda persona, cuenta, IP ni
--    navegador; solo el término normalizado. Se conserva 180 días.
-- 3. log_search: la página del buscador lo llama una vez por búsqueda
--    terminada. Descarta términos muy cortos, muy largos o con números
--    largos (podrían ser una cédula o un teléfono).
-- 4. editorial_search_gaps: búsquedas con pocos o ningún resultado, para la
--    administración y el redactor (alimentan las sugerencias editoriales).

create or replace function public.search_guides(p_query text, p_limit int default 10)
returns table (slug text, title text, summary text, topic text, category_slug text, score real)
language sql
stable
security definer
set search_path = ''
as $$
  with q as (
    select private.normalize_text(p_query) as term,
           array_remove(regexp_split_to_array(private.normalize_text(p_query), ' '), '') as words
  ),
  g as (
    select r.slug, r.title, r.summary, r.topic, r.category_slug,
           private.normalize_text(r.title) as t,
           private.normalize_text(r.summary) as s,
           private.normalize_text(r.content) as c
      from public.legal_resources r
     where r.status = 'publicado'
  )
  select g.slug, g.title, g.summary, g.topic, g.category_slug,
         (case when g.t like '%' || q.term || '%' then 3 else 0 end
          + (select count(*) from unnest(q.words) w where g.t like '%' || w || '%') * 1.0
          + (select count(*) from unnest(q.words) w where g.s like '%' || w || '%') * 0.5
          + extensions.similarity(g.t, q.term))::real as score
    from g, q
   where length(q.term) >= 2
     and (
       not exists (select 1 from unnest(q.words) w where (g.t || ' ' || g.s || ' ' || g.c) not like '%' || w || '%')
       or extensions.similarity(g.t, q.term) > 0.35
     )
   order by score desc, g.title
   limit least(greatest(coalesce(p_limit, 10), 1), 30);
$$;

create table public.search_log (
  term text not null check (length(term) between 3 and 80),
  day date not null default current_date,
  searches int not null default 1,
  results int not null default 0,
  last_seen timestamptz not null default now(),
  primary key (term, day)
);
create index search_log_day_idx on public.search_log (day);

alter table public.search_log enable row level security;
revoke all on public.search_log from public, anon, authenticated;

create or replace function public.log_search(p_query text, p_results int)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_term text := left(private.normalize_text(p_query), 80);
begin
  if length(v_term) < 3 or v_term ~ '[0-9]{6,}' then
    return;
  end if;
  -- Límite diario de términos nuevos, para que nadie llene la tabla.
  if not exists (select 1 from public.search_log where term = v_term and day = current_date)
     and (select count(*) from public.search_log where day = current_date) >= 3000 then
    return;
  end if;
  insert into public.search_log as l (term, results)
  values (v_term, greatest(coalesce(p_results, 0), 0))
  on conflict (term, day) do update
    set searches = l.searches + 1, results = excluded.results, last_seen = now();
  -- Conservación: 180 días (el índice por día hace este borrado barato).
  delete from public.search_log where day < current_date - 180;
end;
$$;

create or replace function public.editorial_search_gaps(p_days int default 30, p_max_results int default 0)
returns table (term text, searches bigint, results int, last_seen timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_redactor() then
    raise exception using errcode = '42501', message = 'VL403: solo la redacción y la administración ven las búsquedas';
  end if;
  return query
    select l.term, sum(l.searches)::bigint,
           (array_agg(l.results order by l.last_seen desc))[1],
           max(l.last_seen)
      from public.search_log l
     where l.day >= current_date - least(greatest(coalesce(p_days, 30), 1), 180)
     group by l.term
    having (array_agg(l.results order by l.last_seen desc))[1] <= greatest(coalesce(p_max_results, 0), 0)
     order by 2 desc, 4 desc
     limit 100;
end;
$$;

revoke all on function public.search_guides(text, int) from public;
revoke all on function public.log_search(text, int) from public;
revoke all on function public.editorial_search_gaps(int, int) from public, anon;
grant execute on function public.search_guides(text, int) to anon, authenticated;
grant execute on function public.log_search(text, int) to anon, authenticated;
grant execute on function public.editorial_search_gaps(int, int) to authenticated;
