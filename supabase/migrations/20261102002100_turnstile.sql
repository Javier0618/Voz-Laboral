-- Protección contra bots (Cloudflare Turnstile) para los envíos sin cuenta.
--
-- Queda INACTIVA hasta que se guarde la clave secreta:
--   insert into private.app_settings (name, value) values ('turnstile_secret', '0x…')
--   on conflict (name) do update set value = excluded.value, updated_at = now();
-- Para desactivarla: delete from private.app_settings where name = 'turnstile_secret';
--
-- El registro y el inicio de sesión usan la protección propia de Supabase Auth
-- (Authentication → Attack Protection), con la misma clave secreta.

-- Extensión para llamar a Cloudflare desde la base de datos (en Supabase está
-- disponible; si no, la comprobación falla cerrada cuando hay clave secreta).
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'http') then
    create extension if not exists http with schema extensions;
  end if;
end;
$$;

-- Ajustes privados del servidor. El esquema private no está expuesto en la API.
create table if not exists private.app_settings (
  name text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
revoke all on private.app_settings from public, anon, authenticated;

-- true si no hay clave configurada o si Cloudflare valida el token.
create or replace function private.captcha_ok(p_token text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  secret text;
  resp_status int;
  resp_content text;
begin
  select value into secret from private.app_settings where name = 'turnstile_secret';
  if coalesce(secret, '') = '' then
    return true;
  end if;
  if p_token is null or length(p_token) < 10 or length(p_token) > 4096 then
    return false;
  end if;
  begin
    -- SQL dinámico: la función se crea aunque la extensión http no exista.
    execute 'select status, content from extensions.http_post($1, $2, $3)'
      into resp_status, resp_content
      using 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
            jsonb_build_object('secret', secret, 'response', p_token)::text,
            'application/json';
  exception when others then
    -- Sin conexión con Cloudflare (o sin la extensión http): falla cerrada.
    return false;
  end;
  return resp_status = 200 and coalesce((resp_content::jsonb ->> 'success')::boolean, false);
exception when others then
  -- Respuesta ilegible de Cloudflare: no se acepta el envío.
  return false;
end;
$$;
revoke all on function private.captcha_ok(text) from public, anon, authenticated;

-- El envío sin cuenta recibe el token de Turnstile. p_captcha tiene valor por
-- defecto para que la versión anterior de la web siga funcionando mientras no
-- haya clave secreta.
drop function if exists public.submit_anonymous_experience(uuid, text, text, date, date, text, text, text, boolean, boolean);

create function public.submit_anonymous_experience(
  p_company_id uuid, p_category text, p_tone text, p_period_start date, p_period_end date,
  p_relationship text, p_title text, p_body text, p_has_documents boolean, p_rules_accepted boolean,
  p_captcha text default null
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
  if not private.captcha_ok(p_captcha) then
    perform private.raise_business_error('VL039', 'No pudimos comprobar que no eres un robot. Completa la verificación e inténtalo de nuevo.');
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

revoke all on function public.submit_anonymous_experience(uuid, text, text, date, date, text, text, text, boolean, boolean, text) from public;
grant execute on function public.submit_anonymous_experience(uuid, text, text, date, date, text, text, text, boolean, boolean, text) to anon, authenticated;
