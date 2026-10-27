-- VozLaboral · 1500 · Página propia de cada experiencia y avisos para quien
-- publica (comentarios, reacciones y decisiones de moderación).

-- ---------------------------------------------------------------------------
-- 1. Experiencia publicada por su identificador (para su página y enlaces)
-- ---------------------------------------------------------------------------
create or replace function public.get_public_experience(p_id uuid)
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
         e.tone, e.comments_enabled, 1::bigint
    from public.experiences e
    join public.companies c on c.id = e.company_id and c.status = 'activo'
    join public.experience_categories cat on cat.slug = e.category_slug
    left join public.profiles p on p.id = e.author_id
   where e.id = p_id and e.status in ('publicada', 'en_disputa');
$$;

-- ---------------------------------------------------------------------------
-- 2. Avisos
-- ---------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('comentario', 'reaccion', 'estado')),
  experience_id uuid not null references public.experiences (id) on delete cascade,
  -- Comentarios y reacciones se agrupan mientras el aviso no se haya leído.
  count integer not null default 1 check (count >= 1),
  new_status text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);
create unique index notifications_group_unread on public.notifications (user_id, experience_id, kind)
  where read_at is null and kind in ('comentario', 'reaccion');

alter table public.notifications enable row level security;
revoke all on public.notifications from anon, authenticated;
-- Solo lectura propia; marcar como leído va por función.
grant select (id, kind, experience_id, count, new_status, read_at, created_at) on public.notifications to authenticated;
create policy "avisos propios" on public.notifications
  for select to authenticated using (user_id = auth.uid());

create or replace function private.notify_grouped(p_user uuid, p_kind text, p_experience uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notifications (user_id, kind, experience_id)
  values (p_user, p_kind, p_experience)
  on conflict (user_id, experience_id, kind) where read_at is null and kind in ('comentario', 'reaccion')
  do update set count = public.notifications.count + 1, created_at = now();
$$;

-- Comentario publicado (al instante o tras revisión): avisa al autor de la experiencia.
create or replace function private.notify_on_comment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner uuid;
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
  return new;
end;
$$;

create trigger experience_comments_notify_insert after insert on public.experience_comments
  for each row execute function private.notify_on_comment();
create trigger experience_comments_notify_update after update of status on public.experience_comments
  for each row execute function private.notify_on_comment();

create or replace function private.notify_on_reaction()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner uuid;
begin
  select author_id into owner from public.experiences where id = new.experience_id;
  if owner is not null and owner <> new.user_id then
    perform private.notify_grouped(owner, 'reaccion', new.experience_id);
  end if;
  return new;
end;
$$;

create trigger experience_reactions_notify after insert on public.experience_reactions
  for each row execute function private.notify_on_reaction();

-- Cambio de estado decidido por otra persona (moderación): avisa al autor.
create or replace function private.notify_on_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.author_id is not null and new.status is distinct from old.status
     and auth.uid() is distinct from new.author_id then
    insert into public.notifications (user_id, kind, experience_id, new_status)
    values (new.author_id, 'estado', new.id, new.status);
  end if;
  return new;
end;
$$;

create trigger experiences_notify_status after update of status on public.experiences
  for each row execute function private.notify_on_status();

-- Al eliminar una cuenta se borran sus avisos.
create or replace function private.delete_notifications_on_profile_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'eliminada' and old.status <> 'eliminada' then
    delete from public.notifications where user_id = new.id;
  end if;
  return new;
end;
$$;

create trigger profiles_delete_notifications after update of status on public.profiles
  for each row execute function private.delete_notifications_on_profile_delete();

-- ---------------------------------------------------------------------------
-- 3. Funciones de la interfaz
-- ---------------------------------------------------------------------------
create or replace function public.my_notifications(p_limit int default 30)
returns table (
  id uuid, kind text, experience_id uuid, experience_title text, company_name text,
  count integer, new_status text, read_at timestamptz, created_at timestamptz, experience_public boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select n.id, n.kind, e.id, coalesce(e.title, cat.name), c.trade_name,
         n.count, n.new_status, n.read_at, n.created_at, e.status in ('publicada', 'en_disputa')
    from public.notifications n
    join public.experiences e on e.id = n.experience_id
    join public.companies c on c.id = e.company_id
    join public.experience_categories cat on cat.slug = e.category_slug
   where auth.uid() is not null and n.user_id = auth.uid()
   order by n.created_at desc
   limit least(greatest(coalesce(p_limit, 30), 1), 100);
$$;

create or replace function public.unread_notifications_count()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::int from public.notifications where user_id = auth.uid() and read_at is null;
$$;

create or replace function public.mark_notifications_read(p_ids uuid[] default null)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.notifications set read_at = now()
   where user_id = auth.uid() and read_at is null and (p_ids is null or id = any (p_ids));
$$;

revoke all on function public.get_public_experience(uuid), public.my_notifications(int),
  public.unread_notifications_count(), public.mark_notifications_read(uuid[]) from public;
grant execute on function public.get_public_experience(uuid) to anon, authenticated;
grant execute on function public.my_notifications(int), public.unread_notifications_count(), public.mark_notifications_read(uuid[])
  to authenticated;
revoke all on function private.notify_grouped(uuid, text, uuid) from public;
