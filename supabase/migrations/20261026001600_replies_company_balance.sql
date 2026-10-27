-- VozLaboral · 1600 · Respuestas a comentarios y balance de tono en el
-- perfil de empresa.

-- ---------------------------------------------------------------------------
-- 1. Respuestas a comentarios (un solo nivel)
-- ---------------------------------------------------------------------------
alter table public.experience_comments
  add column parent_id uuid references public.experience_comments (id) on delete cascade;
create index experience_comments_parent_idx on public.experience_comments (parent_id) where parent_id is not null;
grant insert (parent_id) on public.experience_comments to authenticated;

create or replace function private.before_comment_reply()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.parent_id is null then
    return new;
  end if;
  if not exists (select 1 from public.experience_comments p
                  where p.id = new.parent_id and p.experience_id = new.experience_id
                    and p.parent_id is null and p.status = 'publicado') then
    perform private.raise_business_error('VL063', 'Solo se puede responder a un comentario publicado de esta experiencia.');
  end if;
  return new;
end;
$$;

-- Se ejecuta antes que el control general de comentarios (orden alfabético).
create trigger experience_comments_a_reply before insert on public.experience_comments
  for each row execute function private.before_comment_reply();

alter table public.notifications drop constraint notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('comentario', 'reaccion', 'estado', 'respuesta'));
drop index public.notifications_group_unread;
create unique index notifications_group_unread on public.notifications (user_id, experience_id, kind)
  where read_at is null and kind in ('comentario', 'reaccion', 'respuesta');

create or replace function private.notify_grouped(p_user uuid, p_kind text, p_experience uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notifications (user_id, kind, experience_id)
  values (p_user, p_kind, p_experience)
  on conflict (user_id, experience_id, kind) where read_at is null and kind in ('comentario', 'reaccion', 'respuesta')
  do update set count = public.notifications.count + 1, created_at = now();
$$;

-- Comentario publicado: avisa al autor de la experiencia y, si es una
-- respuesta, también a quien escribió el comentario original.
create or replace function private.notify_on_comment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner uuid;
  parent_author uuid;
begin
  if new.status <> 'publicado' then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.status = 'publicado' then
    return new;
  end if;
  select author_id into owner from public.experiences where id = new.experience_id;
  if owner is not null and owner is distinct from new.author_id then
    perform private.notify_grouped(owner, 'comentario', new.experience_id);
  end if;
  if new.parent_id is not null then
    select author_id into parent_author from public.experience_comments where id = new.parent_id;
    if parent_author is not null and parent_author is distinct from new.author_id and parent_author is distinct from owner then
      perform private.notify_grouped(parent_author, 'respuesta', new.experience_id);
    end if;
  end if;
  return new;
end;
$$;

drop function public.list_comments(uuid);
create function public.list_comments(p_experience_id uuid)
returns table (id uuid, parent_id uuid, author_alias text, is_experience_author boolean, is_mine boolean, body text, status text, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select m.id, m.parent_id,
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
revoke all on function public.list_comments(uuid) from public;
grant execute on function public.list_comments(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Balance de tono en el perfil de empresa (sin puntuaciones ni rankings)
-- ---------------------------------------------------------------------------
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
  with visible as (
    select e.* from public.experiences e
     where e.company_id = c.id and e.status in ('publicada', 'en_disputa')
  ),
  counts as (
    select v.category_slug, cat.name, cat.sort_order, count(*) as n,
           count(*) filter (where v.tone = 'positiva') as pos,
           count(*) filter (where v.tone = 'mixta') as mix,
           count(*) filter (where v.tone = 'negativa') as neg
      from visible v
      join public.experience_categories cat on cat.slug = v.category_slug
     group by v.category_slug, cat.name, cat.sort_order
  ),
  shown as (
    select category_slug, name, sort_order, n, pos, mix, neg from counts where n >= 3
    union all
    select 'agrupadas', 'Otras categorías con pocas experiencias', 99, sum(n)::bigint, sum(pos)::bigint, sum(mix)::bigint, sum(neg)::bigint
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
    'tones', case when total < 3 then null else (
      select jsonb_build_object(
        'positiva', count(*) filter (where tone = 'positiva'),
        'mixta', count(*) filter (where tone = 'mixta'),
        'negativa', count(*) filter (where tone = 'negativa'))
      from visible) end,
    'categories', case when total < 3 then '[]'::jsonb else coalesce(
      (select jsonb_agg(jsonb_build_object('slug', category_slug, 'name', name, 'count', n,
                                           'positiva', pos, 'mixta', mix, 'negativa', neg) order by sort_order) from shown), '[]'::jsonb) end,
    'period_from_year', (select extract(year from min(v.period_start))::int from visible v),
    'period_to_year', (select extract(year from max(coalesce(v.period_end, v.period_start)))::int from visible v),
    'open_claims', (select count(*) from public.company_claims cl where cl.company_id = c.id and cl.status in ('recibida', 'en_revision'))
  ) into result;
  return result;
end;
$$;

revoke all on function private.before_comment_reply() from public;
