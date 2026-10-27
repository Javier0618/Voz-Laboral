-- VozLaboral: guías de «Tus derechos», parte 2 (6 temas).
--
-- Redactadas el 27 de octubre de 2026 a partir de las normas citadas en cada
-- fuente. Los datos se contrastaron con varias fuentes porque desde el entorno
-- de trabajo no se pudo abrir el texto oficial consolidado: por eso cada
-- guía entra en «pendiente_verificacion» y NO es pública. Un abogado debe
-- revisarla contra la norma vigente antes de publicarla desde Moderación → Guías.
-- Ejecutar una vez en el SQL Editor. Es idempotente (no duplica si se repite).

insert into public.legal_resources (slug, title, summary, content, category_slug, status) values
(
  'vacaciones',
  'Vacaciones: cuántos días te corresponden y cuándo tomarlas',
  'Por cada año trabajado tienes derecho a 15 días hábiles consecutivos de vacaciones pagadas. El empleador fija la fecha y debe avisarte con 15 días de anticipación.',
  $g$## Cuántos días te corresponden
Según el artículo 186 del Código Sustantivo del Trabajo (CST), quien trabaja un año tiene derecho a **15 días hábiles consecutivos** de vacaciones remuneradas. Si tu contrato termina antes de completar el año, las vacaciones se pagan en proporción al tiempo trabajado.

## Quién decide la fecha
- El empleador señala la época de las vacaciones, a más tardar dentro del año siguiente a aquel en que las ganaste (art. 187 del CST).
- Debe avisarte la fecha con **15 días de anticipación**.
- La empresa debe llevar un registro de las vacaciones de cada trabajador.

## Cuánto te pagan
Durante las vacaciones recibes el salario ordinario que ganes el día en que empiezan. Para calcularlo no se cuentan el trabajo en días de descanso obligatorio ni las horas extra (art. 192 del CST).

## ¿Se pueden pagar en dinero o acumular?
- La ley permite, en casos concretos, pagar parte de las vacaciones en dinero en lugar de disfrutarlas, y obliga a pagarlas si el contrato termina sin que las hayas tomado (art. 189 del CST).
- Cada año debes descansar al menos **6 días hábiles continuos**, que no se pueden acumular. Los días restantes pueden acumularse por acuerdo, con los límites que fija el artículo 190 del CST.

> Si llevas más de un año sin vacaciones y no te dan fecha, pídelas por escrito y guarda copia. Los derechos laborales prescriben a los tres años de ser exigibles (art. 488 del CST).$g$,
  'jornadas-descansos',
  'pendiente_verificacion'
),
(
  'cesantias-e-intereses',
  'Cesantías e intereses sobre las cesantías',
  'Cada año ganas un mes de salario de cesantías, que el empleador debe consignar en tu fondo antes del 14 de febrero, y unos intereses del 12 % que te paga directamente en enero.',
  $g$## Qué son las cesantías
Son un ahorro que el empleador te debe por tu trabajo: **un mes de salario por cada año trabajado**, o la parte proporcional si trabajaste menos tiempo (art. 249 del CST).

## Cuándo deben consignarlas
- Al 31 de diciembre se liquida lo que ganaste en el año.
- El empleador debe consignar ese valor en el fondo de cesantías que elijas **antes del 14 de febrero** del año siguiente (art. 99 de la Ley 50 de 1990).
- Si no lo hace a tiempo, la ley prevé una sanción a favor del trabajador por cada día de retraso.

## Los intereses sobre las cesantías
- El empleador te paga directamente unos intereses del **12 % anual** sobre las cesantías acumuladas a 31 de diciembre, o en proporción si trabajaste menos de un año (Ley 52 de 1975).
- Se pagan en **enero** del año siguiente. Si el empleador no los paga, la ley establece una sanción adicional.

## Al terminar el contrato
Cuando termina el contrato, las cesantías del último periodo y sus intereses se pagan directamente al trabajador junto con la liquidación.

## Para qué puedes retirarlas
Mientras trabajas, la ley permite retirar las cesantías del fondo para fines concretos, como comprar o mejorar vivienda o pagar educación. Consulta en tu fondo los requisitos.$g$,
  'pago-salarios',
  'pendiente_verificacion'
),
(
  'prima-de-servicios',
  'Prima de servicios: cuánto y cuándo te la deben pagar',
  'La prima equivale a 30 días de salario por año trabajado y se paga en dos partes: la mitad a más tardar el 30 de junio y la otra mitad a más tardar el 20 de diciembre.',
  $g$## Cuánto es
Según el artículo 306 del CST, el empleador debe pagar una prima de servicios de **30 días de salario por año**, o la parte proporcional al tiempo trabajado.

## Cuándo se paga
- La mitad, a más tardar el **30 de junio**.
- La otra mitad, a más tardar el **20 de diciembre**.

## A quién le corresponde
A los trabajadores con contrato de trabajo. Desde la Ley 1788 de 2016 también la reciben las personas trabajadoras del servicio doméstico, los choferes de servicio familiar y quienes trabajan en fincas, entre otros.

## Si no te la pagan
Si al terminar el contrato el empleador no paga la prima y las demás prestaciones que debe, puede proceder la indemnización por cada día de retraso del artículo 65 del CST. Conviene que el Ministerio del Trabajo o un abogado revisen tu caso.$g$,
  'pago-salarios',
  'pendiente_verificacion'
),
(
  'despido-con-y-sin-justa-causa',
  'Despido con y sin justa causa',
  'El empleador puede terminar el contrato con una justa causa de la ley, diciéndote el motivo al despedirte. Si te despide sin justa causa, debe pagarte una indemnización.',
  $g$## Despido con justa causa
El artículo 62 del CST enumera las causas por las que el empleador puede terminar el contrato sin pagar indemnización, como el engaño con documentos falsos al ser contratado, los actos de violencia o el incumplimiento grave de las obligaciones.

- Quien termina el contrato debe decir a la otra parte el **motivo en el momento de hacerlo**, y después no puede alegar otros distintos (art. 66 del CST).
- Si el despido es una **sanción disciplinaria**, la empresa debe seguir un procedimiento que te permita defenderte, conocer las pruebas y controvertirlas. La Ley 2466 de 2025 fijó garantías mínimas de ese procedimiento (art. 115 del CST).

> Pide siempre la carta de despido con el motivo por escrito. Si la empresa te cita a «descargos», puedes presentar tu versión y tus pruebas.

## Despido sin justa causa: la indemnización
Si el empleador termina el contrato sin una justa causa, debe pagarte una indemnización (art. 64 del CST):

### Contrato a término fijo
El valor de los salarios del tiempo que faltaba para terminar el contrato, con un mínimo de 15 días.

### Contrato a término indefinido
- Si ganas menos de 10 salarios mínimos: 30 días de salario por el primer año y 20 días más por cada año siguiente, en proporción por fracción de año.
- Si ganas 10 salarios mínimos o más: 20 días por el primer año y 15 días más por cada año siguiente.

## Además de la indemnización
Al terminar el contrato, por cualquier causa, el empleador debe pagarte la liquidación: salarios pendientes, cesantías y sus intereses, prima y vacaciones no disfrutadas. Consulta las guías de cesantías, prima y vacaciones.

## Protecciones especiales
Algunas personas no pueden ser despedidas sin autorización previa, por ejemplo durante el embarazo o la licencia de maternidad. Revisa la guía de licencias de maternidad y paternidad.$g$,
  'contrato-condiciones',
  'pendiente_verificacion'
),
(
  'incapacidad-por-enfermedad',
  'Incapacidad por enfermedad: quién paga y cuánto',
  'Si te incapacitan por enfermedad común, el empleador paga los dos primeros días y la EPS desde el tercero. El auxilio es de dos terceras partes del salario los primeros 90 días.',
  $g$## Cuánto recibes
Según el artículo 227 del CST, durante una incapacidad por enfermedad común recibes un auxilio de hasta 180 días:
- Las **dos terceras partes** del salario durante los primeros 90 días.
- La **mitad** del salario por el tiempo restante.

La Corte Constitucional precisó que este auxilio no puede ser inferior al salario mínimo (Sentencia C-543 de 2007).

## Quién paga
- Los **dos primeros días** de incapacidad por enfermedad general están a cargo del empleador.
- **Desde el tercer día**, el pago corresponde a la EPS, que lo reconoce a través del empleador.

Estas reglas están en las normas del sistema de salud (Decreto 780 de 2016, modificado por el Decreto 1427 de 2022).

## Qué debes hacer
1. Pide al médico tratante el certificado de incapacidad.
2. Entrégalo a tu empleador en el plazo que fije el reglamento de la empresa.
3. Guarda copia de la incapacidad y de los desprendibles de pago.

> Si la enfermedad o el accidente se originaron en el trabajo, la incapacidad es de origen laboral y la paga la ARL, con reglas distintas.$g$,
  'seguridad-salud',
  'pendiente_verificacion'
),
(
  'licencias-de-maternidad-y-paternidad',
  'Licencias de maternidad y paternidad',
  'La licencia de maternidad es de 18 semanas pagadas y la de paternidad de 2 semanas. Durante el embarazo y la licencia, la trabajadora no puede ser despedida sin autorización del Ministerio del Trabajo.',
  $g$## Licencia de maternidad
- La trabajadora tiene derecho a una licencia de **18 semanas** remuneradas con el salario que devengue al iniciarla (art. 236 del CST, modificado por la Ley 1822 de 2017).
- Por regla general, una semana se toma antes del parto y el resto después.
- La licencia la paga la EPS, a través del empleador.

## Licencia de paternidad
El padre tiene derecho a una licencia remunerada de **2 semanas** (Ley 2114 de 2021). También aplica en caso de adopción.

## Protección contra el despido
- Ninguna trabajadora puede ser despedida por motivo de embarazo o lactancia (art. 239 del CST).
- Para despedirla durante el embarazo o la licencia, el empleador necesita la autorización previa de un inspector del Ministerio del Trabajo.
- Si la despiden sin esa autorización, la ley prevé una indemnización además de los demás pagos que correspondan.

> Informa a tu empleador del embarazo por escrito y guarda copia: facilita demostrar que conocía tu estado.$g$,
  'otras',
  'pendiente_verificacion'
)
on conflict (slug) do nothing;

-- Fuentes oficiales.
insert into public.legal_resource_sources (resource_id, label, publisher, url, accessed_at)
select r.id, s.label, s.publisher, s.url, date '2026-10-27'
from (values
  ('vacaciones', 'Código Sustantivo del Trabajo, arts. 186, 187, 189, 190, 192 y 488', 'Secretaría General del Senado de la República', 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo.html'),
  ('cesantias-e-intereses', 'Código Sustantivo del Trabajo, art. 249', 'Secretaría General del Senado de la República', 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo.html'),
  ('cesantias-e-intereses', 'Ley 50 de 1990, art. 99', 'Secretaría General del Senado de la República', 'http://www.secretariasenado.gov.co/senado/basedoc/ley_0050_1990.html'),
  ('cesantias-e-intereses', 'Ley 52 de 1975', 'Secretaría General del Senado de la República', 'http://www.secretariasenado.gov.co/senado/basedoc/ley_0052_1975.html'),
  ('prima-de-servicios', 'Código Sustantivo del Trabajo, arts. 65 y 306', 'Secretaría General del Senado de la República', 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo.html'),
  ('prima-de-servicios', 'Ley 1788 de 2016', 'Secretaría General del Senado de la República', 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1788_2016.html'),
  ('despido-con-y-sin-justa-causa', 'Código Sustantivo del Trabajo, arts. 62, 64, 66 y 115', 'Secretaría General del Senado de la República', 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo.html'),
  ('despido-con-y-sin-justa-causa', 'Ley 2466 de 2025, art. 7', 'Departamento Administrativo de la Función Pública', 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=260676'),
  ('incapacidad-por-enfermedad', 'Código Sustantivo del Trabajo, art. 227', 'Secretaría General del Senado de la República', 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo.html'),
  ('incapacidad-por-enfermedad', 'Decreto 1427 de 2022', 'Departamento Administrativo de la Función Pública', 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=191146'),
  ('licencias-de-maternidad-y-paternidad', 'Código Sustantivo del Trabajo, arts. 236 y 239', 'Secretaría General del Senado de la República', 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo.html'),
  ('licencias-de-maternidad-y-paternidad', 'Ley 1822 de 2017', 'Secretaría General del Senado de la República', 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1822_2017.html'),
  ('licencias-de-maternidad-y-paternidad', 'Ley 2114 de 2021', 'Secretaría General del Senado de la República', 'http://www.secretariasenado.gov.co/senado/basedoc/ley_2114_2021.html')
) as s(slug, label, publisher, url)
join public.legal_resources r on r.slug = s.slug
on conflict (resource_id, url) do nothing;
