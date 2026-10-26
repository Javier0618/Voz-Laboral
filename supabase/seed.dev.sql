-- SOLO PARA DESARROLLO. No ejecutar en producción.
-- Empresas claramente ficticias para probar el buscador y los perfiles.
-- No se cargan experiencias: créalas desde la aplicación para probar el
-- flujo completo de publicación y moderación.
insert into public.companies (slug, trade_name, legal_name, sector, city, department) values
  ('empresa-demo-alfa-contenido-de-prueba', 'Empresa Demo Alfa (contenido de prueba)', 'Empresa Demo Alfa S.A.S. (ficticia)', 'Comercio', 'Bogotá', 'Bogotá D.C.'),
  ('empresa-demo-beta-contenido-de-prueba', 'Empresa Demo Beta (contenido de prueba)', null, 'Logística', 'Medellín', 'Antioquia'),
  ('empresa-demo-gamma-contenido-de-prueba', 'Empresa Demo Gamma (contenido de prueba)', null, 'Servicios', 'Cali', 'Valle del Cauca')
on conflict (slug) do nothing;

insert into public.company_aliases (company_id, alias)
select id, 'Demo Alfa' from public.companies where slug = 'empresa-demo-alfa-contenido-de-prueba'
on conflict do nothing;
