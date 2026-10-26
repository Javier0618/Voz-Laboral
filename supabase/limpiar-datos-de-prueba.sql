-- VozLaboral: borra TODO el contenido de prueba (empresas marcadas
-- «(contenido de prueba)» y lo que depende de ellas). No toca tu cuenta,
-- tu rol de administrador ni las empresas importadas de Supersociedades.
-- El borrado es definitivo y atómico: o se borra todo o nada.
-- No crea tablas, así que el SQL Editor no debería mostrar el aviso de RLS.

do $$
declare
  empresas uuid[];
  experiencias uuid[];
  reclamaciones uuid[];
  otros uuid[];
begin
  select coalesce(array_agg(id), '{}') into empresas from public.companies where trade_name like '%(contenido de prueba)%';
  select coalesce(array_agg(id), '{}') into experiencias from public.experiences where company_id = any (empresas);
  select coalesce(array_agg(id), '{}') into reclamaciones from public.company_claims
   where company_id = any (empresas) or experience_id = any (experiencias);
  select coalesce(array_agg(id), '{}') into otros from (
    select id from public.content_reports where experience_id = any (experiencias)
    union all select id from public.appeals where experience_id = any (experiencias)
    union all select id from public.company_responses where company_id = any (empresas)
  ) t;

  raise notice 'Se borrarán: % empresas, % experiencias, % reclamaciones, % reportes/apelaciones/respuestas',
    cardinality(empresas), cardinality(experiencias), cardinality(reclamaciones), cardinality(otros);

  -- El historial de moderación solo se puede borrar con este permiso explícito.
  perform set_config('vozlaboral.allow_purge', 'on', true);
  delete from public.moderation_events
   where target_id = any (empresas || experiencias || reclamaciones || otros);
  perform set_config('vozlaboral.allow_purge', 'off', true);

  delete from public.company_responses where company_id = any (empresas);
  delete from public.company_claims where id = any (reclamaciones);
  -- Reportes, apelaciones y archivos se borran en cascada con la experiencia.
  delete from public.experiences where id = any (experiencias);
  -- Nombres alternativos y datos privados se borran en cascada con la empresa.
  delete from public.companies where id = any (empresas);
end;
$$;
