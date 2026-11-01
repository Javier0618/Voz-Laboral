-- Borrar guías de forma definitiva, solo desde administración y con registro.
--
-- Antes, la administración podía borrar filas de legal_resources sin dejar
-- rastro. Ahora el borrado pasa por public.delete_legal_resource, que:
--   - exige rol de administración;
--   - pide un motivo;
--   - registra en moderation_events el estado previo, el slug y el título;
--   - borra la guía (sus fuentes y visitas se borran en cascada).
-- Las imágenes del bucket «guias» las limpia el panel después de borrar.

create or replace function public.delete_legal_resource(p_id uuid, p_reason text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  g record;
begin
  if not private.is_admin() then
    raise exception using errcode = '42501', message = 'VL403: solo la administración puede borrar guías';
  end if;
  if p_reason is null or length(trim(p_reason)) < 3 then
    perform private.raise_business_error('VL072', 'Indica el motivo para borrar la guía.');
  end if;
  select id, slug, title, status into g from public.legal_resources where id = p_id for update;
  if g.id is null then
    perform private.raise_business_error('VL404', 'La guía no existe o ya se borró.');
  end if;
  perform private.log_moderation('legal_resource', g.id, g.status, 'eliminado', trim(p_reason),
    format('Guía borrada: «%s» (/derechos/%s)', g.title, g.slug));
  delete from public.legal_resources where id = g.id;
  return g.slug;
end;
$$;

revoke all on function public.delete_legal_resource(uuid, text) from public, anon;
grant execute on function public.delete_legal_resource(uuid, text) to authenticated;

-- El borrado directo queda cerrado: solo por la función anterior.
revoke delete on public.legal_resources from authenticated;
