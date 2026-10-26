-- DATOS DE DEMO SOLO PARA DESARROLLO LOCAL. NO EJECUTAR EN PRODUCCIÓN.
-- Todas las empresas son ficticias y están marcadas como prueba.
-- Uso: psql "$DATABASE_URL" -f supabase/seed.dev.sql

insert into public.companies (name, slug, city, sector, status) values
  ('[PRUEBA] Confecciones Ficticias del Valle', 'prueba-confecciones-ficticias-del-valle', 'Cali', 'Manufactura', 'activa'),
  ('[PRUEBA] Logística Imaginaria Andina', 'prueba-logistica-imaginaria-andina', 'Bogotá', 'Transporte', 'activa'),
  ('[PRUEBA] Servicios Inventados de la Costa', 'prueba-servicios-inventados-de-la-costa', 'Barranquilla', 'Servicios', 'activa')
on conflict do nothing;

insert into public.company_aliases (company_id, alias)
select id, 'CFV (prueba)' from public.companies where slug = 'prueba-confecciones-ficticias-del-valle'
on conflict do nothing;
