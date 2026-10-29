-- VozLaboral: guías de «Tus derechos», parte 4.
--
-- Redactada el 29 de octubre de 2026 a partir del texto oficial consolidado de
-- la Secretaría del Senado (codigo_sustantivo_trabajo_pr005 y pr006).
--
-- 1. Nueva guía «Descanso dominical y festivos» (CST, arts. 172 a 185). Entra
--    en «pendiente_verificacion»: NO es pública hasta que la revises y la
--    publiques desde Moderación → Guías.
-- 2. La guía de jornada, ya publicada, gana dos apartados: el descanso dentro
--    de la jornada (art. 167) y el límite de horas extra (art. 167A).
-- 3. Cuando publiques la guía nueva, vuelve a ejecutar este archivo: la guía de
--    jornada enlazará a ella. Antes de publicarla no se añade el enlace, para no
--    dejar un enlace roto.
--
-- Es idempotente: se puede ejecutar varias veces sin duplicar nada.

begin;

insert into public.legal_resources (slug, title, summary, content, category_slug, status) values
(
  'descanso-dominical-y-festivos',
  'Descanso dominical y festivos: cuándo se pagan y cuánto',
  'Tienes derecho a un día de descanso remunerado a la semana y a los festivos. Si trabajas ese día, te deben un recargo y, según el caso, un descanso compensatorio.',
  $g$## Tu día de descanso obligatorio
El empleador debe darte un descanso remunerado de al menos 24 horas cada semana (art. 172 del CST). Por regla general es el domingo, pero pueden acordar por escrito que sea otro día. Si el contrato no dice nada, el día de descanso obligatorio es el domingo (art. 179, parágrafo 3, del CST).

## Cuándo te pagan el descanso
- Si trabajas todos los días laborales de la semana, el descanso se paga con el salario ordinario de un día (art. 173 del CST).
- Si faltas por justa causa, conservas ese pago. La ley entiende por justa causa el accidente, la enfermedad, la calamidad doméstica, la fuerza mayor y el caso fortuito. También lo conservas si faltas por culpa o por decisión del empleador.
- Si faltas sin justa causa, puedes perder el pago del descanso de esa semana.
- Si tu jornada no incluye todos los días laborales de la semana, el descanso se paga en proporción al tiempo trabajado.
- Si tienes un sueldo mensual, el pago de los días de descanso ya está incluido en él (art. 174 del CST).

## Los festivos
También tienes derecho a descanso remunerado en los festivos (art. 177 del CST): 1 de enero, 6 de enero, 19 de marzo, 1 de mayo, 29 de junio, 20 de julio, 7 de agosto, 15 de agosto, 12 de octubre, 1 de noviembre, 11 de noviembre, 8 de diciembre y 25 de diciembre, además del Jueves y el Viernes Santo, la Ascensión del Señor, Corpus Christi y el Sagrado Corazón.

Los del 6 de enero, 19 de marzo, 29 de junio, 15 de agosto, 12 de octubre, 1 de noviembre, Ascensión, Corpus Christi y Sagrado Corazón se trasladan al lunes siguiente cuando no caen en lunes. Por eso el número de festivos es el mismo cada año, pero sus fechas cambian.

El festivo se paga igual que el descanso dominical, con una diferencia: no se descuenta aunque hayas faltado al trabajo esa semana.

## Si trabajas el día de descanso o un festivo
Ese trabajo se paga con un recargo sobre el salario ordinario, en proporción a las horas trabajadas, además del salario de la semana (art. 179 del CST, modificado por la Ley 2466 de 2025). El recargo sube de forma gradual:
- 80 % desde el 1 de julio de 2025.
- 90 % desde el 1 de julio de 2026.
- 100 % desde el 1 de julio de 2027.

Si el día de descanso coincide con un festivo, solo se paga un recargo, no dos.

## Descanso compensatorio
La ley distingue dos casos según cuántos días de descanso trabajes en el mes calendario (art. 179, parágrafo 1, del CST):
- Ocasional, si trabajas hasta 2. Puedes elegir entre un descanso compensatorio remunerado o el pago en dinero (art. 180 del CST).
- Habitual, si trabajas 3 o más. Tienes derecho al descanso compensatorio remunerado y también al pago en dinero (art. 181 del CST).

El descanso compensatorio puede darse otro día laborable de la semana siguiente, o desde el mediodía o la 1:00 p. m. del domingo hasta el mediodía o la 1:00 p. m. del lunes (art. 183 del CST). Si trabajar el domingo es habitual, el empleador debe publicar en un lugar visible, con al menos 12 horas de anticipación, la lista de quienes trabajarán y el día y la hora de su descanso compensatorio (art. 185 del CST).

## Quiénes pueden trabajar en el día de descanso
Solo se permite trabajar en días de descanso obligatorio pagándolo o dando un descanso compensatorio remunerado, y solo en estos casos (art. 175 del CST):
- Labores que por su naturaleza o por motivos técnicos no pueden interrumpirse.
- Labores para necesidades que no pueden aplazarse, como los servicios públicos o la preparación y venta de medicamentos y alimentos.
- El servicio doméstico y los conductores particulares.

## Calcula tu caso
Las [calculadoras de nómina](/calculadoras) separan las horas de domingo y festivo y les aplican el recargo vigente en cada fecha. Para el resto de recargos y las horas extra, lee la guía de [jornada, horas extra y recargos](/derechos/jornada-horas-extra-y-recargos).$g$,
  'jornadas-descansos',
  'pendiente_verificacion'
)
on conflict (slug) do nothing;

-- Guía de jornada: descanso dentro de la jornada y límite de horas extra.
-- Solo si sigue sin hablar del art. 167A y conserva su apartado de domingos.
update public.legal_resources
set content = replace(content, E'## Domingos y festivos\n', $g$## El descanso dentro de la jornada
La jornada diaria debe repartirse al menos en dos partes, con un descanso en medio que se adapte al tipo de trabajo y a las necesidades de los trabajadores. Ese descanso, como la hora de almuerzo, no cuenta en la jornada (art. 167 del CST). Si durante ese tiempo sigues trabajando o debes quedarte disponible en tu puesto, no es un descanso real.

## Límite de horas extra
Las horas extra, diurnas o nocturnas, no pueden pasar de 2 al día ni de 12 a la semana (art. 167A del CST, modificado por la Ley 2466 de 2025). Se exceptúan el sector de seguridad, según la Ley 1920 de 2018, y el sector salud. Si trabajaste más horas extra de las permitidas, igual te las deben pagar.

## Domingos y festivos
$g$)
where slug = 'jornada-horas-extra-y-recargos'
  and content not like '%167A%'
  and content like E'%\n## Domingos y festivos\n%';

-- Enlace a la guía nueva, solo cuando ya esté publicada.
update public.legal_resources
set content = replace(content,
  'Si no lo acuerdan, el descanso obligatorio es el domingo.',
  'Si no lo acuerdan, el descanso obligatorio es el domingo. Lee la guía de [descanso dominical y festivos](/derechos/descanso-dominical-y-festivos).')
where slug = 'jornada-horas-extra-y-recargos'
  and content not like '%/derechos/descanso-dominical-y-festivos%'
  and exists (select 1 from public.legal_resources where slug = 'descanso-dominical-y-festivos' and status = 'publicado');

-- Fuentes oficiales.
insert into public.legal_resource_sources (resource_id, label, publisher, url, accessed_at)
select r.id, s.label, 'Secretaría General del Senado de la República', s.url, date '2026-10-29'
from (values
  ('descanso-dominical-y-festivos', 'Código Sustantivo del Trabajo, arts. 172 a 176', 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo_pr005.html'),
  ('descanso-dominical-y-festivos', 'Código Sustantivo del Trabajo, arts. 177 a 185', 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo_pr006.html')
) as s(slug, label, url)
join public.legal_resources r on r.slug = s.slug
on conflict (resource_id, url) do nothing;

insert into public.legal_resource_sources (resource_id, label, publisher, url, accessed_at)
select r.id, 'Ley 2466 de 2025, art. 14 (art. 179 del CST)', 'Departamento Administrativo de la Función Pública',
  'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=260676', date '2026-10-29'
from public.legal_resources r where r.slug = 'descanso-dominical-y-festivos'
on conflict (resource_id, url) do nothing;

-- La guía de jornada ya cita la página pr005 del CST; se actualiza su nombre.
update public.legal_resource_sources s
set label = 'Código Sustantivo del Trabajo, arts. 160, 161, 167, 167A y 168'
from public.legal_resources r
where s.resource_id = r.id and r.slug = 'jornada-horas-extra-y-recargos'
  and s.url = 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo_pr005.html';

commit;
