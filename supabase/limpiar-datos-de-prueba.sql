-- VozLaboral: borra TODO el contenido de prueba (empresas marcadas
-- «(contenido de prueba)» y lo que depende de ellas). No toca tu cuenta,
-- tu rol de administrador ni las empresas importadas de Supersociedades.
-- El borrado es definitivo. Se hace en una transacción: o se borra todo o nada.

begin;

create temp table prueba_empresas on commit drop as
  select id from public.companies where trade_name like '%(contenido de prueba)%';
create temp table prueba_experiencias on commit drop as
  select id from public.experiences where company_id in (select id from prueba_empresas);
create temp table prueba_reclamaciones on commit drop as
  select id from public.company_claims
   where company_id in (select id from prueba_empresas) or experience_id in (select id from prueba_experiencias);
create temp table prueba_otros on commit drop as
  select id from public.content_reports where experience_id in (select id from prueba_experiencias)
  union all select id from public.appeals where experience_id in (select id from prueba_experiencias)
  union all select id from public.company_responses where company_id in (select id from prueba_empresas);

-- Lo que se va a borrar (se muestra en el resultado).
select 'empresas' as tipo, count(*) from prueba_empresas
union all select 'experiencias', count(*) from prueba_experiencias
union all select 'reclamaciones', count(*) from prueba_reclamaciones
union all select 'reportes, apelaciones y respuestas', count(*) from prueba_otros;

-- El historial de moderación solo se puede borrar con este permiso explícito.
select set_config('vozlaboral.allow_purge', 'on', true);
delete from public.moderation_events
 where target_id in (select id from prueba_empresas union all select id from prueba_experiencias
                     union all select id from prueba_reclamaciones union all select id from prueba_otros);
select set_config('vozlaboral.allow_purge', 'off', true);

delete from public.company_responses where id in (select id from prueba_otros);
delete from public.company_claims where id in (select id from prueba_reclamaciones);
-- Reportes, apelaciones y archivos se borran en cascada con la experiencia.
delete from public.experiences where id in (select id from prueba_experiencias);
-- Nombres alternativos y datos privados se borran en cascada con la empresa.
delete from public.companies where id in (select id from prueba_empresas);

commit;
