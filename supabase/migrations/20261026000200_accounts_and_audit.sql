-- VozLaboral · 0200 · Cuentas, roles y registros de auditoría.

-- ---------------------------------------------------------------------------
-- Perfiles: solo el alias público y el estado de la cuenta.
-- El correo vive únicamente en auth.users y nunca se copia aquí.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  alias text,
  status text not null default 'activa'
    check (status in ('activa', 'suspendida', 'eliminacion_solicitada', 'eliminada')),
  suspended_reason text,
  deletion_requested_at timestamptz,
  alias_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index profiles_alias_unique on public.profiles (lower(alias)) where alias is not null;

create trigger profiles_touch before update on public.profiles
  for each row execute function private.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Roles administrativos. Solo se asignan con admin_set_role() o, para el
-- primer administrador, desde el editor SQL del panel de Supabase.
-- ---------------------------------------------------------------------------
create table public.admin_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('moderator', 'admin')),
  granted_by uuid references auth.users (id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

create or replace function private.is_moderator()
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
      and r.role in ('moderator', 'admin')
      and p.status = 'activa'
  );
$$;

create or replace function private.is_admin()
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
      and r.role = 'admin'
      and p.status = 'activa'
  );
$$;

-- ---------------------------------------------------------------------------
-- Historial de decisiones. Solo inserción, mediante funciones. Inmutable
-- salvo la purga por plazo de conservación (ver 0800).
-- ---------------------------------------------------------------------------
create table public.moderation_events (
  id bigint generated always as identity primary key,
  target_type text not null
    check (target_type in ('experience', 'report', 'claim', 'appeal', 'profile', 'company', 'company_response', 'company_suggestion', 'legal_resource')),
  target_id uuid not null,
  previous_status text,
  new_status text,
  reason text not null check (length(trim(reason)) >= 3),
  internal_note text,
  actor_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index moderation_events_target_idx on public.moderation_events (target_type, target_id, created_at desc);
create index moderation_events_created_idx on public.moderation_events (created_at);

-- Eventos de seguridad: sin direcciones IP ni agentes de usuario.
create table public.security_events (
  id bigint generated always as identity primary key,
  event_type text not null,
  user_id uuid references auth.users (id) on delete set null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index security_events_created_idx on public.security_events (created_at);

create or replace function private.forbid_audit_changes()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' and current_setting('vozlaboral.allow_purge', true) = 'on' then
    return old;
  end if;
  raise exception using errcode = '42501', message = 'VL403: los registros de auditoría no se pueden modificar';
end;
$$;

create trigger moderation_events_immutable before update or delete on public.moderation_events
  for each row execute function private.forbid_audit_changes();
create trigger security_events_immutable before update or delete on public.security_events
  for each row execute function private.forbid_audit_changes();

create or replace function private.log_moderation(
  p_target_type text, p_target_id uuid, p_previous text, p_new text, p_reason text, p_internal_note text default null
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.moderation_events (target_type, target_id, previous_status, new_status, reason, internal_note, actor_id)
  values (p_target_type, p_target_id, p_previous, p_new, p_reason, nullif(trim(p_internal_note), ''), auth.uid());
$$;

create or replace function private.log_security(p_event_type text, p_details jsonb default '{}'::jsonb)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.security_events (event_type, user_id, details)
  values (p_event_type, auth.uid(), coalesce(p_details, '{}'::jsonb));
$$;

-- ---------------------------------------------------------------------------
-- Alias: formato, palabras reservadas y no coincidir con el correo.
-- ---------------------------------------------------------------------------
create or replace function private.check_alias()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized text := private.normalize_text(new.alias);
  email_local text;
  reserved text[] := array[
    'admin', 'administrador', 'moderador', 'moderator', 'vozlaboral', 'soporte', 'support',
    'oficial', 'ministerio', 'mintrabajo', 'gobierno', 'staff', 'root', 'sistema', 'equipo'
  ];
  word text;
begin
  if new.alias is null then
    if tg_op = 'UPDATE' and old.alias is not null and new.status <> 'eliminada' then
      perform private.raise_business_error('VL010', 'El alias no puede quedar vacío.');
    end if;
    return new;
  end if;

  new.alias := trim(new.alias);

  if new.alias !~ '^[[:alnum:]_.-]{3,24}$' then
    perform private.raise_business_error('VL011', 'El alias debe tener entre 3 y 24 caracteres: letras, números, punto, guion o guion bajo.');
  end if;

  foreach word in array reserved loop
    if position(word in replace(normalized, ' ', '')) > 0 then
      perform private.raise_business_error('VL012', 'Ese alias puede confundirse con una cuenta oficial. Elige otro.');
    end if;
  end loop;

  select private.normalize_text(split_part(u.email, '@', 1)) into email_local
  from auth.users u where u.id = new.id;

  if email_local is not null and length(email_local) >= 3
     and replace(normalized, ' ', '') = replace(email_local, ' ', '') then
    perform private.raise_business_error('VL013', 'El alias no puede coincidir con tu correo. Así protegemos tu identidad.');
  end if;

  if tg_op = 'UPDATE' and old.alias is not null and new.alias is distinct from old.alias
     and old.alias_updated_at > now() - interval '7 days' then
    perform private.raise_business_error('VL014', 'Solo puedes cambiar el alias una vez cada 7 días.');
  end if;

  if tg_op = 'INSERT' or new.alias is distinct from old.alias then
    new.alias_updated_at := now();
  end if;

  return new;
end;
$$;

create trigger profiles_check_alias before insert or update of alias on public.profiles
  for each row execute function private.check_alias();

-- Crea el perfil vacío al registrarse. El alias se elige después.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------------------
-- Privilegios y RLS
-- Supabase concede ALL por defecto a anon/authenticated en "public": se
-- revoca todo y se concede solo lo necesario, columna por columna.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.admin_roles enable row level security;
alter table public.moderation_events enable row level security;
alter table public.security_events enable row level security;

revoke all on public.profiles, public.admin_roles, public.moderation_events, public.security_events from anon, authenticated;

grant select (id, alias, status, suspended_reason, deletion_requested_at, alias_updated_at, created_at) on public.profiles to authenticated;
grant update (alias) on public.profiles to authenticated;
grant select on public.admin_roles to authenticated;
grant select on public.moderation_events to authenticated;
grant select on public.security_events to authenticated;

create policy "perfil propio o moderación" on public.profiles
  for select to authenticated
  using (id = auth.uid() or private.is_moderator());

create policy "editar alias propio" on public.profiles
  for update to authenticated
  using (id = auth.uid() and status = 'activa')
  with check (id = auth.uid());

create policy "roles propios o administración" on public.admin_roles
  for select to authenticated
  using (user_id = auth.uid() or private.is_admin());

create policy "historial para moderación" on public.moderation_events
  for select to authenticated
  using (private.is_moderator());

create policy "seguridad para administración" on public.security_events
  for select to authenticated
  using (private.is_admin());

-- Funciones auxiliares que usan las políticas.
grant execute on function private.is_moderator() to anon, authenticated;
grant execute on function private.is_admin() to anon, authenticated;
