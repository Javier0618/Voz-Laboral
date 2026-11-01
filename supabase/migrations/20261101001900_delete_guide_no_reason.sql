-- Borrar una guía ya no exige motivo. El registro en moderation_events se
-- mantiene, con un motivo por defecto cuando no se indica ninguno.

create or replace function public.delete_legal_resource(p_id uuid, p_reason text default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  g record;
  motivo text := coalesce(nullif(trim(p_reason), ''), 'Guía borrada desde el panel');
begin
  if not private.is_admin() then
    raise exception using errcode = '42501', message = 'VL403: solo la administración puede borrar guías';
  end if;
  if length(motivo) < 3 then
    motivo := 'Guía borrada desde el panel';
  end if;
  select id, slug, title, status into g from public.legal_resources where id = p_id for update;
  if g.id is null then
    perform private.raise_business_error('VL404', 'La guía no existe o ya se borró.');
  end if;
  perform private.log_moderation('legal_resource', g.id, g.status, 'eliminado', motivo,
    format('Guía borrada: «%s» (/derechos/%s)', g.title, g.slug));
  delete from public.legal_resources where id = g.id;
  return g.slug;
end;
$$;

revoke all on function public.delete_legal_resource(uuid, text) from public, anon;
grant execute on function public.delete_legal_resource(uuid, text) to authenticated;
