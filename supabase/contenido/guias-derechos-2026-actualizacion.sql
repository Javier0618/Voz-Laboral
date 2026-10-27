-- VozLaboral: actualización de las 16 guías de las partes 1 y 2.
--
-- 1. Convierte las referencias a otras guías en enlaces internos
--    [texto](/derechos/slug), que la página abre sin salir de VozLaboral.
-- 2. Precisa algunos datos: vacaciones (arts. 189 y 190), cesantías (sanciones),
--    prima (trabajadores ocasionales, C-825 de 2006) y maternidad (Ley 2114).
-- 3. Cambia la fuente general del Código por la página del Senado que contiene
--    cada artículo y añade fuentes que faltaban.
--
-- Ejecutar DESPUÉS de guias-derechos-2026-parte-3.sql: varios enlaces llevan a
-- esas guías nuevas, que deben publicarse para que el enlace funcione.
-- Es idempotente: cada guía se actualiza solo si aún no tiene enlaces internos,
-- y solo cambia los párrafos que siguen igual que en la versión original.
-- Si un párrafo fue editado a mano, se deja como está.
--
-- Las guías siguen publicadas. Si prefieres que un abogado revise los cambios
-- antes de que se vean, ejecuta también la línea comentada al final.

begin;

-- El editor de Supabase guarda los saltos de línea como \r\n: se normalizan
-- para que los reemplazos encuentren el texto original.
update public.legal_resources
   set content = replace(content, E'\r\n', E'\n')
 where content like E'%\r\n%';

-- Partes 1 y 2: enlaces internos y precisiones.
update public.legal_resources set content = replace(content,
  $o$Las reglas cambian según tu salario y el tiempo transcurrido, así que conviene que el Ministerio del Trabajo o un abogado revisen tu caso.$o$,
  $n$Las reglas cambian según tu salario y el tiempo transcurrido, así que conviene que el Ministerio del Trabajo o un abogado revisen tu caso. Lee la guía de la [liquidación](/derechos/liquidacion-al-terminar-el-contrato).$n$)
 where slug = 'pago-del-salario' and content not like '%](/derechos/%';
update public.legal_resources set content = replace(content,
  $o$una remuneración mínima vital y móvil, proporcional a la cantidad y calidad del trabajo.$o$,
  $n$una remuneración mínima vital y móvil, proporcional a la cantidad y calidad del trabajo. Lee la guía de [salario mínimo, auxilio de transporte y dotación](/derechos/salario-minimo-auxilio-de-transporte-y-dotacion).$n$)
 where slug = 'pago-del-salario' and content not like '%(/derechos/salario-minimo%';

update public.legal_resources set content = replace(content,
  $o$pero quien decide si existe contrato de trabajo es un juez.$o$,
  $n$pero quien decide si existe contrato de trabajo es un juez.

Para conocer las modalidades de contrato, lee la guía de [tipos de contrato y período de prueba](/derechos/tipos-de-contrato-y-periodo-de-prueba).$n$)
 where slug = 'cuando-existe-contrato-de-trabajo' and content not like '%](/derechos/%';

update public.legal_resources set content = replace(content,
  $o$Consulta la guía sobre acoso laboral para saber a dónde acudir.$o$,
  $n$Consulta la guía sobre [acoso laboral](/derechos/acoso-laboral-que-es-y-donde-acudir) para saber a dónde acudir.$n$)
 where slug in ('limites-de-las-ordenes-del-empleador', 'igualdad-y-no-discriminacion') and content not like '%](/derechos/%';

update public.legal_resources set content = replace(replace(content,
  $o$La ley describe otras modalidades.$o$,
  $n$La ley describe otras modalidades. Si la conducta tiene connotación sexual, lee la guía de [acoso sexual en el trabajo](/derechos/acoso-sexual-en-el-trabajo).$n$),
  $o$Esas pruebas son las que pide la ley.$o$,
  $n$Esas pruebas son las que pide la ley. Para saber qué puede hacer el Ministerio del Trabajo, lee la guía [a dónde acudir](/derechos/a-donde-acudir-ministerio-y-derecho-de-peticion).$n$)
 where slug = 'acoso-laboral-que-es-y-donde-acudir' and content not like '%](/derechos/%';

update public.legal_resources set content = replace(content,
  $o$Por cada año de servicio tienes derecho a 15 días hábiles consecutivos de vacaciones remuneradas (art. 186 del CST).$o$,
  $n$Por cada año de servicio tienes derecho a 15 días hábiles consecutivos de vacaciones remuneradas (art. 186 del CST). Lee la guía de [vacaciones](/derechos/vacaciones).$n$)
 where slug = 'jornada-horas-extra-y-recargos' and content not like '%](/derechos/%';

update public.legal_resources set content = replace(content,
  $o$consulta a la administradora de riesgos laborales a la que estás afiliado o al Ministerio del Trabajo.$o$,
  $n$consulta a la administradora de riesgos laborales a la que estás afiliado o al Ministerio del Trabajo.

Lee también las guías de [seguridad social](/derechos/seguridad-social-eps-pension-arl-y-caja) y de [accidente de trabajo y enfermedad laboral](/derechos/accidente-de-trabajo-y-enfermedad-laboral).$n$)
 where slug = 'seguridad-y-salud-en-el-trabajo' and content not like '%](/derechos/%';

update public.legal_resources set content = replace(content,
  $o$Si te la niegan, guarda también la respuesta.$o$,
  $n$Si te la niegan, guarda también la respuesta.

Las licencias por nacimiento tienen su propia guía: [licencias de maternidad y paternidad](/derechos/licencias-de-maternidad-y-paternidad).$n$)
 where slug = 'licencias-remuneradas' and content not like '%](/derechos/%';

update public.legal_resources set content = replace(content,
  $o$Describe los hechos en orden y con fechas.$o$,
  $n$Describe los hechos en orden y con fechas.

## Ten en cuenta los plazos
Los derechos laborales prescriben a los tres años desde que son exigibles. Un reclamo escrito al empleador sobre un derecho concreto interrumpe ese plazo una sola vez, y desde ese reclamo vuelve a contar (arts. 488 y 489 del CST).

Si tu reclamo es por acoso, lee las guías de [acoso laboral](/derechos/acoso-laboral-que-es-y-donde-acudir) y de [acoso sexual](/derechos/acoso-sexual-en-el-trabajo).$n$)
 where slug = 'a-donde-acudir-ministerio-y-derecho-de-peticion' and content not like '%](/derechos/%';

update public.legal_resources set content = replace(replace(replace(content,
  $o$- La ley permite, en casos concretos, pagar parte de las vacaciones en dinero en lugar de disfrutarlas, y obliga a pagarlas si el contrato termina sin que las hayas tomado (art. 189 del CST).$o$,
  $n$- Puedes pedir por escrito que te paguen en dinero hasta la mitad de tus vacaciones, si el empleador está de acuerdo. Si el contrato termina sin que las hayas tomado, deben pagártelas en dinero en la [liquidación](/derechos/liquidacion-al-terminar-el-contrato) (art. 189 del CST).$n$),
  $o$Los días restantes pueden acumularse por acuerdo, con los límites que fija el artículo 190 del CST.$o$,
  $n$Los días restantes pueden acumularse por acuerdo escrito hasta por dos años, o hasta por cuatro si se trata de trabajadores técnicos, especializados, de confianza o de manejo, o de extranjeros que trabajan lejos de su familia (art. 190 del CST).$n$),
  $o$Los derechos laborales prescriben a los tres años de ser exigibles (art. 488 del CST).$o$,
  $n$Los derechos laborales prescriben a los tres años de ser exigibles (art. 488 del CST). Lee la guía [a dónde acudir](/derechos/a-donde-acudir-ministerio-y-derecho-de-peticion).$n$)
 where slug = 'vacaciones' and content not like '%](/derechos/%';

update public.legal_resources set content = replace(replace(replace(content,
  $o$- Si no lo hace a tiempo, la ley prevé una sanción a favor del trabajador por cada día de retraso.$o$,
  $n$- Si no lo hace a tiempo, debe pagarte un día de salario por cada día de retraso (art. 99 de la Ley 50 de 1990).$n$),
  $o$Si el empleador no los paga, la ley establece una sanción adicional.$o$,
  $n$Si el empleador no los paga a tiempo, debe pagarte además, por una sola vez, una suma igual a esos intereses (Ley 52 de 1975).$n$),
  $o$se pagan directamente al trabajador junto con la liquidación.$o$,
  $n$se pagan directamente al trabajador junto con la [liquidación](/derechos/liquidacion-al-terminar-el-contrato).$n$)
 where slug = 'cesantias-e-intereses' and content not like '%](/derechos/%';

update public.legal_resources set content = replace(replace(replace(content,
  $o$- La otra mitad, a más tardar el **20 de diciembre**.$o$,
  $n$- La otra mitad, dentro de los **primeros 20 días de diciembre**.

Si trabajaste solo una parte del semestre, la prima se paga en proporción al tiempo trabajado.$n$),
  $o$A los trabajadores con contrato de trabajo.$o$,
  $n$A todas las personas con contrato de trabajo, también a las ocasionales o transitorias: la Corte Constitucional eliminó esa exclusión en la Sentencia C-825 de 2006.$n$),
  $o$Conviene que el Ministerio del Trabajo o un abogado revisen tu caso.$o$,
  $n$Conviene que el Ministerio del Trabajo o un abogado revisen tu caso. Lee la guía de la [liquidación](/derechos/liquidacion-al-terminar-el-contrato).$n$)
 where slug = 'prima-de-servicios' and content not like '%](/derechos/%';

update public.legal_resources set content = replace(replace(replace(content,
  $o$Consulta las guías de cesantías, prima y vacaciones.$o$,
  $n$Lee las guías de la [liquidación](/derechos/liquidacion-al-terminar-el-contrato), las [cesantías](/derechos/cesantias-e-intereses), la [prima](/derechos/prima-de-servicios) y las [vacaciones](/derechos/vacaciones).$n$),
  $o$Revisa la guía de licencias de maternidad y paternidad.$o$,
  $n$Revisa las guías de [estabilidad laboral reforzada](/derechos/estabilidad-laboral-reforzada) y de [licencias de maternidad y paternidad](/derechos/licencias-de-maternidad-y-paternidad).$n$),
  $o$Si la empresa te cita a «descargos», puedes presentar tu versión y tus pruebas.$o$,
  $n$Si la empresa te cita a «descargos», puedes presentar tu versión y tus pruebas. Si eres tú quien quiere terminar el contrato, lee la guía de [renuncia](/derechos/renuncia-y-preaviso).$n$)
 where slug = 'despido-con-y-sin-justa-causa' and content not like '%](/derechos/%';

update public.legal_resources set content = replace(content,
  $o$la incapacidad es de origen laboral y la paga la ARL, con reglas distintas.$o$,
  $n$la incapacidad es de origen laboral y la paga la ARL, con reglas distintas. Lee la guía de [accidente de trabajo y enfermedad laboral](/derechos/accidente-de-trabajo-y-enfermedad-laboral).$n$)
 where slug = 'incapacidad-por-enfermedad' and content not like '%](/derechos/%';

update public.legal_resources set content = replace(replace(replace(content,
  $o$- Por regla general, una semana se toma antes del parto y el resto después.$o$,
  $n$- Por regla general, una semana se toma antes del parto y el resto después.
- Las **12 semanas siguientes al parto** son solo para la madre. Desde la Ley 2114 de 2021, la madre puede ceder al padre hasta 6 de sus últimas semanas como licencia parental compartida.$n$),
  $o$También aplica en caso de adopción.$o$,
  $n$También aplica en caso de adopción. La ley prevé ampliarla de forma gradual, hasta 5 semanas, si baja la tasa de desempleo.$n$),
  $o$- Si la despiden sin esa autorización, la ley prevé una indemnización además de los demás pagos que correspondan.$o$,
  $n$- Si la despiden sin esa autorización, la ley prevé una indemnización además de los demás pagos que correspondan. Lee la guía de [estabilidad laboral reforzada](/derechos/estabilidad-laboral-reforzada).$n$)
 where slug = 'licencias-de-maternidad-y-paternidad' and content not like '%](/derechos/%';

-- Fuentes nuevas. Se insertan antes de borrar la fuente general, porque una
-- guía publicada no puede quedarse sin fuentes.
insert into public.legal_resource_sources (resource_id, label, publisher, url, accessed_at)
select r.id, s.label, s.publisher, s.url, date '2026-10-27'
from (values
  ('vacaciones', 'Código Sustantivo del Trabajo, arts. 186, 187, 189, 190 y 192', 'Secretaría General del Senado de la República', 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo_pr006.html'),
  ('vacaciones', 'Código Sustantivo del Trabajo, art. 488', 'Secretaría General del Senado de la República', 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo_pr016.html'),
  ('vacaciones', 'Ley 1429 de 2010, art. 20 (pago en dinero de las vacaciones)', 'Secretaría General del Senado de la República', 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1429_2010.html'),
  ('cesantias-e-intereses', 'Código Sustantivo del Trabajo, arts. 249 y 251', 'Secretaría General del Senado de la República', 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo_pr008.html'),
  ('prima-de-servicios', 'Código Sustantivo del Trabajo, art. 306', 'Secretaría General del Senado de la República', 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo_pr010.html'),
  ('prima-de-servicios', 'Código Sustantivo del Trabajo, art. 65', 'Secretaría General del Senado de la República', 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo_pr001.html'),
  ('prima-de-servicios', 'Sentencia C-825 de 2006', 'Corte Constitucional', 'https://www.corteconstitucional.gov.co/relatoria/2006/C-825-06.htm'),
  ('despido-con-y-sin-justa-causa', 'Código Sustantivo del Trabajo, arts. 62, 64 y 66', 'Secretaría General del Senado de la República', 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo_pr001.html'),
  ('despido-con-y-sin-justa-causa', 'Código Sustantivo del Trabajo, art. 115', 'Secretaría General del Senado de la República', 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo_pr003.html'),
  ('incapacidad-por-enfermedad', 'Código Sustantivo del Trabajo, art. 227', 'Secretaría General del Senado de la República', 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo_pr007.html'),
  ('incapacidad-por-enfermedad', 'Sentencia C-543 de 2007', 'Corte Constitucional', 'https://www.corteconstitucional.gov.co/relatoria/2007/C-543-07.htm'),
  ('licencias-de-maternidad-y-paternidad', 'Código Sustantivo del Trabajo, arts. 236 y 239', 'Secretaría General del Senado de la República', 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo_pr007.html'),
  ('acoso-laboral-que-es-y-donde-acudir', 'Ley 2365 de 2024 (acoso sexual en el contexto laboral)', 'Colpensiones (compilación normativa)', 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/ley_2365_2024.htm'),
  ('licencias-remuneradas', 'Ley 2466 de 2025 (modifica el art. 57 del CST)', 'Departamento Administrativo de la Función Pública', 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=260676'),
  ('seguridad-y-salud-en-el-trabajo', 'Ley 1562 de 2012', 'Secretaría General del Senado de la República', 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1562_2012.html'),
  ('a-donde-acudir-ministerio-y-derecho-de-peticion', 'Ley 1755 de 2015 (derecho de petición)', 'Secretaría General del Senado de la República', 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1755_2015.html'),
  ('jornada-horas-extra-y-recargos', 'Ley 2466 de 2025 (modifica los arts. 160, 161 y 179 del CST)', 'Departamento Administrativo de la Función Pública', 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=260676')
) as s(slug, label, publisher, url)
join public.legal_resources r on r.slug = s.slug
on conflict (resource_id, url) do nothing;

-- Fuentes: la página general del Código se cambia por la que contiene cada artículo.
delete from public.legal_resource_sources s
 using public.legal_resources r
 where r.id = s.resource_id
   and s.url = 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo.html'
   and r.slug in ('vacaciones', 'cesantias-e-intereses', 'prima-de-servicios', 'despido-con-y-sin-justa-causa', 'incapacidad-por-enfermedad', 'licencias-de-maternidad-y-paternidad');

update public.legal_resource_sources s
   set label = 'Código Sustantivo del Trabajo, arts. 485, 486, 488 y 489'
  from public.legal_resources r
 where r.id = s.resource_id
   and r.slug = 'a-donde-acudir-ministerio-y-derecho-de-peticion'
   and s.url = 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo_pr016.html';

-- Opcional: devolver a revisión las guías que cambiaron, para que un abogado
-- las vea antes de que vuelvan a ser públicas.
-- update public.legal_resources set status = 'pendiente_verificacion' where content like '%](/derechos/%' and status = 'publicado';

commit;
