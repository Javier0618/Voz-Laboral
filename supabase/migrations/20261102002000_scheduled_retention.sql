-- Tareas programadas de conservación (docs/retencion.md) y corrección que
-- permite eliminar cuentas.
--
-- Cada día, a las 3:17 a. m. hora de Colombia (08:17 UTC):
--   1. Anonimiza y elimina las cuentas cuyo plazo de cancelación de 15 días
--      ya venció: process_account_deletion() y después el usuario de Auth
--      (en cascada se borran el perfil y las reacciones; las experiencias y
--      los comentarios quedan sin autor).
--   2. Purga los registros vencidos: purge_expired_records().
--
-- Necesita la extensión pg_cron (Supabase: Database → Extensions). Si no está
-- disponible, la función se crea igual y puede ejecutarse a mano:
--   select private.run_scheduled_retention();

-- Los registros de auditoría son inmutables, pero al eliminar una cuenta la
-- base de datos debe dejar en blanco la referencia a esa persona (actor_id en
-- moderation_events, user_id en security_events: «on delete set null»).
-- Antes, la protección también lo bloqueaba y ninguna cuenta podía
-- eliminarse. Ahora se permite solo ese cambio: quitar la referencia a la
-- persona, con todo lo demás del registro idéntico.
create or replace function private.forbid_audit_changes()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  col text := case tg_table_name when 'moderation_events' then 'actor_id' else 'user_id' end;
begin
  if tg_op = 'DELETE' and current_setting('vozlaboral.allow_purge', true) = 'on' then
    return old;
  end if;
  if tg_op = 'UPDATE'
     and (to_jsonb(old) ->> col) is not null
     and (to_jsonb(new) ->> col) is null
     and (to_jsonb(new) - col) = (to_jsonb(old) - col) then
    return new;
  end if;
  raise exception using errcode = '42501', message = 'VL403: los registros de auditoría no se pueden modificar';
end;
$$;

create or replace function private.run_scheduled_retention()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
  eliminadas int := 0;
  fallidas int := 0;
  purga jsonb;
begin
  -- Actúa como proceso de servicio: las funciones de borrado lo exigen.
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);

  for r in
    select id from public.profiles
     where status = 'eliminacion_solicitada'
       and deletion_requested_at <= now() - interval '15 days'
  loop
    begin
      perform public.process_account_deletion(r.id);
      delete from auth.users where id = r.id;
      eliminadas := eliminadas + 1;
    exception when others then
      -- Una cuenta con problemas no frena a las demás; queda registrada.
      fallidas := fallidas + 1;
      perform private.log_security('eliminacion_programada_fallida', jsonb_build_object('error', sqlerrm));
    end;
  end loop;

  purga := public.purge_expired_records();
  perform set_config('request.jwt.claims', '', true);
  return jsonb_build_object('cuentas_eliminadas', eliminadas, 'cuentas_con_error', fallidas) || purga;
end;
$$;

revoke all on function private.run_scheduled_retention() from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.unschedule(jobid) from cron.job where jobname = 'tuvozlaboral-conservacion';
    perform cron.schedule('tuvozlaboral-conservacion', '17 8 * * *', 'select private.run_scheduled_retention()');
  else
    raise notice 'pg_cron no está disponible: activa la extensión y vuelve a ejecutar esta migración, o ejecuta a mano select private.run_scheduled_retention();';
  end if;
end;
$$;
