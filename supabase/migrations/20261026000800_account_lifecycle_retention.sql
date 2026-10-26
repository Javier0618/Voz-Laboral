-- VozLaboral · 0800 · Eliminación de cuentas y conservación de registros.
-- Plazos propuestos en docs/retencion.md; deben validarse con un abogado.

-- 1. El titular solicita la eliminación. Hay 15 días para cancelarla.
create or replace function public.request_account_deletion()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  prev text;
begin
  select status into prev from public.profiles where id = auth.uid() for update;
  if prev is null then
    perform private.raise_business_error('VL401', 'Inicia sesión para continuar.');
  end if;
  if prev = 'eliminacion_solicitada' then
    perform private.raise_business_error('VL080', 'Ya solicitaste la eliminación de tu cuenta.');
  end if;
  update public.profiles set status = 'eliminacion_solicitada', deletion_requested_at = now() where id = auth.uid();
  perform private.log_moderation('profile', auth.uid(), prev, 'eliminacion_solicitada', 'Solicitud de eliminación del titular');
end;
$$;

create or replace function public.cancel_account_deletion()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set status = 'activa', deletion_requested_at = null
   where id = auth.uid() and status = 'eliminacion_solicitada';
  if not found then
    perform private.raise_business_error('VL081', 'No hay una solicitud de eliminación pendiente.');
  end if;
  perform private.log_moderation('profile', auth.uid(), 'eliminacion_solicitada', 'activa', 'El titular canceló la eliminación');
end;
$$;

-- 2. Pasado el plazo, la administración (o un proceso programado con la
--    clave de servicio) anonimiza la cuenta:
--    - experiencias publicadas: se conservan sin vínculo con la cuenta;
--    - experiencias no publicadas: se retiran y se desvinculan;
--    - alias: se libera.
--    Después se elimina el usuario de auth.users con la API de administración.
create or replace function public.process_account_deletion(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested timestamptz;
begin
  if not private.is_admin() and coalesce(auth.role(), '') <> 'service_role' then
    raise exception using errcode = '42501', message = 'VL403: no tienes permiso para procesar eliminaciones';
  end if;
  select deletion_requested_at into requested from public.profiles
   where id = p_user_id and status = 'eliminacion_solicitada' for update;
  if requested is null then
    perform private.raise_business_error('VL082', 'La cuenta no tiene una solicitud de eliminación pendiente.');
  end if;
  if requested > now() - interval '15 days' then
    perform private.raise_business_error('VL083', 'El plazo de cancelación de 15 días aún no ha terminado.');
  end if;

  perform set_config('vozlaboral.moderation', 'on', true);
  update public.experiences
     set status = 'retirada', status_reason = 'Retirada al eliminar la cuenta.'
   where author_id = p_user_id and status in ('en_revision', 'requiere_ajustes');
  update public.experiences set author_id = null, anonymized = true where author_id = p_user_id;
  perform set_config('vozlaboral.moderation', 'off', true);

  update public.content_reports set reporter_id = null where reporter_id = p_user_id;
  update public.appeals set author_id = null where author_id = p_user_id;
  update public.company_suggestions set suggested_by = null where suggested_by = p_user_id;
  update public.profiles set alias = null, status = 'eliminada', suspended_reason = null where id = p_user_id;

  perform private.log_moderation('profile', p_user_id, 'eliminacion_solicitada', 'eliminada', 'Cuenta anonimizada tras la solicitud del titular');
end;
$$;

-- 3. Purga por plazo de conservación. Pensada para ejecutarse con pg_cron o
--    con un proceso programado que use la clave de servicio.
create or replace function public.purge_expired_records()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  sec int;
  mod int;
begin
  if not private.is_admin() and coalesce(auth.role(), '') <> 'service_role' then
    raise exception using errcode = '42501', message = 'VL403: no tienes permiso para purgar registros';
  end if;
  perform set_config('vozlaboral.allow_purge', 'on', true);
  delete from public.security_events where created_at < now() - interval '12 months';
  get diagnostics sec = row_count;
  delete from public.moderation_events where created_at < now() - interval '5 years';
  get diagnostics mod = row_count;
  perform set_config('vozlaboral.allow_purge', 'off', true);
  perform private.log_security('purga_conservacion', jsonb_build_object('security_events', sec, 'moderation_events', mod));
  return jsonb_build_object('security_events', sec, 'moderation_events', mod);
end;
$$;

revoke all on function public.request_account_deletion(), public.cancel_account_deletion(),
  public.process_account_deletion(uuid), public.purge_expired_records() from public, anon;
grant execute on function public.request_account_deletion(), public.cancel_account_deletion(),
  public.process_account_deletion(uuid), public.purge_expired_records() to authenticated;
grant execute on function public.process_account_deletion(uuid), public.purge_expired_records() to service_role;
