-- VozLaboral: guías de «Tus derechos», parte 3 (8 temas).
--
-- Redactadas el 27 de octubre de 2026. Desde el entorno de trabajo no se pudo
-- abrir el texto oficial consolidado: los datos se contrastaron con los
-- fragmentos publicados por la Secretaría del Senado, la Corte Constitucional
-- y otras compilaciones oficiales. Por eso cada guía entra en
-- «pendiente_verificacion» y NO es pública. Un abogado debe revisarla contra
-- la norma vigente antes de publicarla desde Moderación → Guías.
-- Ejecutar una vez en el SQL Editor. Es idempotente (no duplica si se repite).

insert into public.legal_resources (slug, title, summary, content, category_slug, status) values
(
  'liquidacion-al-terminar-el-contrato',
  'La liquidación: qué te deben pagar al terminar el contrato',
  'Al terminar el contrato, por cualquier causa, el empleador debe pagarte los salarios pendientes, las cesantías y sus intereses, la prima y las vacaciones no disfrutadas. Si te despidieron sin justa causa, también la indemnización.',
  $g$## Qué incluye la liquidación
Cuando termina el contrato, sin importar quién lo termine ni por qué, el empleador debe pagarte:
- Los **salarios** y las horas extra o recargos que te deba.
- Las **cesantías** del último periodo y sus **intereses** del 12 % anual, que en este caso se pagan directamente a ti y no al fondo (art. 249 del CST y Ley 52 de 1975).
- La **prima de servicios** proporcional al tiempo trabajado en el semestre (art. 306 del CST).
- Las **vacaciones** que no alcanzaste a disfrutar, pagadas en dinero (art. 189 del CST).

Si el empleador terminó el contrato **sin justa causa**, debe sumar la indemnización del artículo 64 del CST. Lee la guía de [despido con y sin justa causa](/derechos/despido-con-y-sin-justa-causa).

## Cómo se calcula cada parte
Estas son las fórmulas que se usan en la práctica, con el salario mensual y los días trabajados en el periodo:
- Cesantías: salario × días trabajados en el año ÷ 360.
- Intereses sobre las cesantías: cesantías × días trabajados en el año × 12 % ÷ 360.
- Prima: salario × días trabajados en el semestre ÷ 360.
- Vacaciones no disfrutadas: salario × días trabajados sin vacaciones ÷ 720.

Si recibes auxilio de transporte, se suma al salario para calcular las cesantías y la prima, pero no las vacaciones. Si tu salario es variable, se usa el promedio de lo recibido.

> Estas fórmulas sirven para revisar tu liquidación. Si las cuentas no te cuadran, pide al empleador el detalle por escrito.

## Otros documentos que te deben dar
- Una certificación con el tiempo de servicio, la clase de trabajo y el salario, si la pides (art. 57, numeral 7, del CST).
- La orden para el examen médico de retiro, si lo solicitas.
- Una constancia del pago de tus aportes a salud y pensión de los últimos meses. La ley exige informarte por escrito el estado de esos pagos al terminar el contrato (art. 65 del CST, parágrafo 1).

## Si no te pagan
El artículo 65 del CST prevé una **indemnización moratoria**: si al terminar el contrato el empleador no paga los salarios y las prestaciones que debe, tendrá que pagarte un día de salario por cada día de retraso, hasta por 24 meses. Después de ese plazo se deben intereses. Quien gana un salario mínimo o menos conserva el pago de un día de salario por cada día de retraso, sin ese límite.

Esta indemnización no es automática: un juez revisa si el empleador actuó de buena fe. Si no está de acuerdo con lo que debe, el empleador puede consignar ante un juez el valor que acepta deber.

## Qué hacer
1. Pide la liquidación por escrito y revisa cada concepto.
2. No firmes un «paz y salvo» si no estás de acuerdo con los valores: puedes firmar dejando constancia de tu desacuerdo.
3. Si no te pagan, reclama por escrito y guarda copia. Los derechos laborales prescriben a los tres años, y un reclamo escrito interrumpe ese plazo una vez (arts. 488 y 489 del CST).
4. Busca orientación en el Ministerio del Trabajo. Lee la guía [a dónde acudir](/derechos/a-donde-acudir-ministerio-y-derecho-de-peticion).

Más detalle en las guías de [cesantías](/derechos/cesantias-e-intereses), [prima](/derechos/prima-de-servicios) y [vacaciones](/derechos/vacaciones).$g$,
  'pago-salarios',
  'pendiente_verificacion'
),
(
  'renuncia-y-preaviso',
  'Renunciar: preaviso, liquidación y renuncia por justa causa',
  'Puedes renunciar en cualquier momento. En el contrato indefinido, la ley pide avisar con 30 días de anticipación, pero no permite pactar una multa por no hacerlo. Al renunciar también te deben la liquidación.',
  $g$## Puedes renunciar cuando quieras
Nadie puede obligarte a seguir trabajando. La renuncia es una decisión tuya y debe ser libre: si te presionan para firmarla, guarda pruebas, porque un juez puede considerar que en realidad fue un despido.

## El preaviso
- En el **contrato a término indefinido**, quien renuncia debe avisar por escrito con **30 días** de anticipación. Desde la Ley 2466 de 2025, no puede pactarse una multa o sanción por no dar ese aviso (art. 47 del CST).
- En el **contrato a término fijo**, renunciar antes de que termine el plazo, sin justa causa, puede obligarte a indemnizar al empleador (art. 64 del CST). Aun así, el empleador no puede descontar esa suma de tu liquidación sin tu autorización escrita o una orden de un juez (art. 59 del CST).

Si no conoces tu tipo de contrato, revisa la guía de [tipos de contrato y período de prueba](/derechos/tipos-de-contrato-y-periodo-de-prueba).

## Al renunciar te deben la liquidación
Renunciar no te hace perder las cesantías, sus intereses, la prima proporcional ni las vacaciones pendientes. Lo único que no recibes, si renuncias sin justa causa, es la indemnización por despido. Lee la guía de la [liquidación](/derechos/liquidacion-al-terminar-el-contrato).

## Renuncia por justa causa
El artículo 62 del CST también enumera justas causas para que **el trabajador** termine el contrato. Entre ellas están:
- Los malos tratos, las injurias o las amenazas del empleador o de sus representantes.
- Que el empleador no te pague el salario en las condiciones y fechas pactadas.
- Que te exija trabajos distintos de los pactados o te ponga en peligro sin las medidas de protección necesarias.
- El incumplimiento grave de las obligaciones del empleador.

Si renuncias por una justa causa atribuible al empleador, puedes reclamar la indemnización como si te hubieran despedido sin justa causa. Para eso debes decir **por escrito, al renunciar, cuál es el motivo**, porque después no podrás alegar otro (art. 66 del CST). En caso de desacuerdo, lo decide un juez.

> Antes de renunciar por justa causa, reúne pruebas del incumplimiento: desprendibles, mensajes y correos. Conviene que un abogado o el Ministerio del Trabajo revisen tu caso.

## Cómo presentar la renuncia
1. Escríbela con la fecha, tu nombre y la fecha en que dejarás de trabajar.
2. Entrégala con copia y pide que te firmen o sellen el recibido, o envíala por correo electrónico y guarda el mensaje.
3. Si renuncias por justa causa, explica los hechos concretos en la misma carta.$g$,
  'contrato-condiciones',
  'pendiente_verificacion'
),
(
  'tipos-de-contrato-y-periodo-de-prueba',
  'Tipos de contrato de trabajo y período de prueba',
  'El contrato a término indefinido es la regla general. El contrato a término fijo debe constar por escrito y no puede superar 4 años. El período de prueba debe pactarse por escrito y dura como máximo 2 meses.',
  $g$## El contrato a término indefinido es la regla
Desde la Ley 2466 de 2025, el contrato de trabajo a término indefinido es la regla general en Colombia (art. 47 del CST). Las demás modalidades son excepciones y deben cumplir sus requisitos.

## Las modalidades
### A término indefinido
No tiene fecha de terminación. Termina por renuncia, por despido o por las demás causas de la ley.

### A término fijo
- Debe constar **por escrito**; si no, se entiende que es a término indefinido.
- Su duración máxima es de **4 años** (art. 46 del CST, modificado por la Ley 2466 de 2025).
- Si ninguna de las partes avisa por escrito, con al menos 30 días de anticipación, que no lo renovará, el contrato se prorroga. La ley limita las prórrogas sucesivas por periodos cortos.
- Tienes los mismos derechos que con un contrato indefinido: prestaciones, vacaciones y seguridad social, en proporción al tiempo trabajado.

### Por obra o labor
Dura lo que dure la obra o labor contratada, que debe quedar determinada por escrito. Si la obra termina y sigues trabajando en otra cosa, conviene revisar tu situación.

### Ocasional o transitorio
Es para labores cortas, de no más de un mes, distintas de las actividades normales de la empresa (art. 6 del CST).

## El contrato de prestación de servicios no es contrato de trabajo
Si te contratan por prestación de servicios pero trabajas tú mismo, bajo órdenes y a cambio de un pago, puede existir un contrato de trabajo. Lee la guía sobre [cuándo existe un contrato de trabajo](/derechos/cuando-existe-contrato-de-trabajo).

## El período de prueba
- Debe pactarse **por escrito**; si no, no existe (art. 77 del CST).
- Dura como máximo **2 meses**. En los contratos a término fijo de menos de un año, no puede superar la quinta parte del plazo pactado (art. 78 del CST).
- Si firmas contratos sucesivos con el mismo empleador, solo vale el período de prueba del primero.
- Durante el período de prueba, cualquiera de las partes puede terminar el contrato sin previo aviso y sin indemnización (art. 80 del CST).

> Estar en período de prueba no te quita derechos: te deben el salario, la afiliación a la seguridad social desde el primer día y las prestaciones proporcionales.$g$,
  'contrato-condiciones',
  'pendiente_verificacion'
),
(
  'seguridad-social-eps-pension-arl-y-caja',
  'Seguridad social: EPS, pensión, ARL y caja de compensación',
  'Si tienes contrato de trabajo, el empleador debe afiliarte a salud, pensión, riesgos laborales y caja de compensación. La ARL y la caja las paga por completo el empleador; salud y pensión se reparten.',
  $g$## Las cuatro afiliaciones obligatorias
Con contrato de trabajo, el empleador debe afiliarte y pagar los aportes a:
- **Salud (EPS)**: atención médica para ti y tu familia, e incapacidades por enfermedad común.
- **Pensión**: el ahorro o los aportes para tu vejez, invalidez o para tu familia si falleces (Ley 100 de 1993).
- **Riesgos laborales (ARL)**: cubre accidentes de trabajo y enfermedades laborales (Ley 1562 de 2012).
- **Caja de compensación familiar**: subsidio familiar, recreación, capacitación y otros servicios.

La afiliación a la ARL debe hacerse **antes de que empieces a trabajar**: un accidente el primer día ya debe estar cubierto.

## Quién paga cada aporte
Los aportes se calculan sobre tu salario mensual:
- Salud: 12,5 %. Tú pagas el 4 % y el empleador el 8,5 %. Muchos empleadores están exonerados de su parte para quienes ganan menos de 10 salarios mínimos.
- Pensión: 16 %. Tú pagas el 4 % y el empleador el 12 %. Si ganas 4 salarios mínimos o más, se suma un aporte al fondo de solidaridad pensional.
- ARL: la paga **toda el empleador**. El porcentaje depende del nivel de riesgo de tu trabajo.
- Caja de compensación: 4 %, a cargo **del empleador**.

> Tu parte de salud y pensión se descuenta del salario. Revisa en tu desprendible que esos descuentos aparezcan y que correspondan a tu salario real.

## Cómo comprobar que estás afiliado
1. Consulta en la página de tu EPS, tu fondo de pensiones y tu ARL con tu número de documento.
2. Revisa el Registro Único de Afiliados (RUAF) del Ministerio de Salud, donde aparecen tus afiliaciones.
3. Pide a tu empleador las planillas de pago de aportes (PILA).

## Si no te afilian o no pagan
- Si el empleador te descuenta los aportes y no los paga, o no te afilia, puede responder por las prestaciones que el sistema habría cubierto, como una incapacidad o un accidente.
- Puedes presentar una queja ante el Ministerio del Trabajo. Lee la guía [a dónde acudir](/derechos/a-donde-acudir-ministerio-y-derecho-de-peticion).

Para lo que cubre cada sistema, lee las guías de [incapacidad por enfermedad](/derechos/incapacidad-por-enfermedad) y de [accidente de trabajo y enfermedad laboral](/derechos/accidente-de-trabajo-y-enfermedad-laboral).$g$,
  'seguridad-salud',
  'pendiente_verificacion'
),
(
  'accidente-de-trabajo-y-enfermedad-laboral',
  'Accidente de trabajo y enfermedad laboral',
  'Si te accidentas por causa o con ocasión del trabajo, el empleador debe reportarlo a la ARL dentro de los dos días hábiles siguientes. La ARL cubre la atención médica y te paga el 100 % del salario de cotización durante la incapacidad.',
  $g$## Qué es un accidente de trabajo
Según el artículo 3 de la Ley 1562 de 2012, es todo suceso repentino que ocurra por causa o con ocasión del trabajo y que te produzca una lesión, una perturbación funcional o psiquiátrica, una invalidez o la muerte. También lo es:
- El que ocurre mientras cumples órdenes del empleador, aunque sea fuera del lugar o del horario de trabajo.
- El que ocurre en el traslado entre tu casa y el trabajo, cuando el transporte lo da el empleador.

## Qué es una enfermedad laboral
Es la que contraes como resultado de la exposición a los riesgos propios de tu trabajo o del medio en que trabajas (art. 4 de la Ley 1562 de 2012). El Gobierno publica una tabla de enfermedades laborales; si la tuya no aparece pero se demuestra la relación con el trabajo, también se reconoce.

## Qué hacer si te accidentas
1. Pide atención médica de inmediato. El empleador debe prestarte los primeros auxilios.
2. Avisa a tu jefe o a la persona de seguridad y salud en el trabajo lo antes posible.
3. El empleador debe **reportar el accidente a la ARL y a la EPS dentro de los dos días hábiles** siguientes.
4. Pide copia del reporte. Si el empleador no lo hace, tú o tu familia pueden informar el accidente directamente a la ARL.
5. Guarda la historia clínica, las incapacidades y los nombres de los testigos.

## Qué te cubre la ARL
- La **atención médica completa**: consultas, medicamentos, cirugías, rehabilitación y prótesis.
- Durante la incapacidad temporal, el **100 % del salario sobre el que se cotizaba**, desde el día siguiente al accidente (art. 3 de la Ley 776 de 2002).
- Si queda una secuela, una indemnización por incapacidad permanente parcial o, si es grave, una pensión de invalidez. Si la persona fallece, su familia puede recibir una pensión de sobrevivientes.

## Al volver al trabajo
Al terminar la incapacidad, el empleador debe reintegrarte a tu cargo o a uno compatible con tu capacidad, de igual nivel (art. 4 de la Ley 776 de 2002). Puede que también tengas protección contra el despido: lee la guía de [estabilidad laboral reforzada](/derechos/estabilidad-laboral-reforzada).

> Si la EPS o la ARL dicen que tu accidente o enfermedad no es de origen laboral y no estás de acuerdo, puedes controvertir esa calificación ante la junta de calificación de invalidez. Los plazos son cortos: pide orientación pronto.

Si la enfermedad no viene del trabajo, aplica la guía de [incapacidad por enfermedad](/derechos/incapacidad-por-enfermedad).$g$,
  'seguridad-salud',
  'pendiente_verificacion'
),
(
  'estabilidad-laboral-reforzada',
  'Estabilidad laboral reforzada: cuándo no pueden despedirte',
  'Algunas personas no pueden ser despedidas sin una autorización previa: por ejemplo, quienes tienen una discapacidad o un problema de salud que afecta su trabajo, las trabajadoras embarazadas o en licencia y quienes tienen fuero sindical.',
  $g$## Qué es
Es una protección especial que impide despedir a ciertas personas por su condición, salvo que exista una autorización previa. No significa que nunca puedan terminar tu contrato, sino que el empleador debe pedir permiso y demostrar una causa ajena a esa condición.

## Personas con discapacidad o con problemas de salud
- Según el artículo 26 de la Ley 361 de 1997, nadie puede ser despedido por razón de su discapacidad sin autorización de la oficina del trabajo (el Ministerio del Trabajo).
- Si lo despiden sin esa autorización, tiene derecho a una **indemnización de 180 días de salario**, además de los demás pagos que correspondan.
- La Corte Constitucional ha extendido esta protección a quienes tienen un problema de salud que les dificulta trabajar en condiciones normales, aunque no tengan una calificación de discapacidad (por ejemplo, Sentencia SU-049 de 2017).
- La Corte también ha señalado que la indemnización no basta por sí sola: un juez puede ordenar el **reintegro** y el pago de los salarios dejados de recibir (Sentencia SU-348 de 2022).

Para que la protección aplique, normalmente debe probarse que el empleador **conocía** tu condición de salud. Avisa por escrito y guarda tus incapacidades y recomendaciones médicas.

## Embarazo y licencia de maternidad
Ninguna trabajadora puede ser despedida por motivo de embarazo o lactancia, y durante el embarazo y la licencia se necesita autorización previa del Ministerio del Trabajo (art. 239 del CST). Lee la guía de [licencias de maternidad y paternidad](/derechos/licencias-de-maternidad-y-paternidad).

## Fuero sindical
Quienes tienen fuero sindical, como ciertos directivos de un sindicato, no pueden ser despedidos ni desmejorados sin autorización previa de un juez del trabajo (art. 405 del CST).

## Si te despiden sin autorización
1. Pide la carta de despido con el motivo por escrito.
2. Reúne las pruebas de tu condición y de que el empleador la conocía.
3. Busca orientación pronto. Muchas personas acuden a la acción de tutela, que debe presentarse en un tiempo razonable después del despido, o a una demanda laboral.

> La jurisprudencia sobre este tema cambia y depende mucho de cada caso. Conviene que un abogado o un consultorio jurídico revise tu situación.

Lee también la guía de [despido con y sin justa causa](/derechos/despido-con-y-sin-justa-causa).$g$,
  'contrato-condiciones',
  'pendiente_verificacion'
),
(
  'acoso-sexual-en-el-trabajo',
  'Acoso sexual en el trabajo: qué es y a dónde acudir',
  'La Ley 2365 de 2024 obliga a los empleadores a prevenir y atender el acoso sexual en el trabajo, con rutas de atención y respeto por la intimidad de la víctima. El acoso sexual también es un delito.',
  $g$## Qué es
La Ley 2365 de 2024 entiende por acoso sexual en el contexto laboral todo acto de persecución, hostigamiento o asedio de carácter o connotación sexual, lasciva o libidinosa. Puede venir de un jefe, de un compañero o de otra persona con quien te relacionas por el trabajo, y puede ocurrir una o varias veces.

Algunos ejemplos: comentarios o insinuaciones sexuales no deseadas, mensajes o imágenes de contenido sexual, contacto físico no consentido, o pedir favores sexuales a cambio de beneficios en el trabajo o bajo amenaza.

## A quién protege
La ley protege a cualquier persona en el contexto laboral, **sin importar el tipo de vinculación**: trabajadores con contrato, contratistas, pasantes y practicantes.

## Qué debe hacer el empleador
Según la Ley 2365 de 2024, el empleador debe:
- Tener políticas de prevención con protocolos y rutas de atención contra el acoso sexual.
- Recibir las quejas, proteger la intimidad de la víctima y evitar que tenga que contar los hechos una y otra vez.
- Remitir de inmediato la queja a la autoridad competente si la víctima lo pide.

## A dónde acudir
- La **ruta interna** de tu empresa, si existe.
- La **Fiscalía General de la Nación**: el acoso sexual es un delito en el artículo 210A del Código Penal.
- Un **inspector del Ministerio del Trabajo**, para que revise si el empleador cumple sus obligaciones.
- La Defensoría del Pueblo o la personería de tu municipio, para orientación.
- La **línea 155**, de orientación a mujeres víctimas de violencia, de atención gratuita.

> No tienes que demostrarlo todo antes de pedir ayuda. Aun así, guarda mensajes, correos, fechas y nombres de testigos: facilitan cualquier reclamo.

## Diferencia con el acoso laboral
El acoso laboral de la Ley 1010 de 2006 es una conducta persistente que busca intimidarte o hacerte renunciar. El acoso sexual tiene connotación sexual y puede configurarse con un solo hecho. Lee la guía de [acoso laboral](/derechos/acoso-laboral-que-es-y-donde-acudir).$g$,
  'posible-acoso-laboral',
  'pendiente_verificacion'
),
(
  'salario-minimo-auxilio-de-transporte-y-dotacion',
  'Salario mínimo, auxilio de transporte y dotación',
  'Nadie que trabaje la jornada completa puede ganar menos del salario mínimo. Si ganas hasta dos salarios mínimos, también tienes derecho al auxilio de transporte y a tres entregas de dotación al año.',
  $g$## El salario mínimo
Es la remuneración más baja que puede recibir quien trabaja la jornada completa (art. 145 del CST). Lo fija cada año el Gobierno por decreto cuando no hay acuerdo en la comisión de concertación.

- Para 2026, el Decreto 1469 de 2025 fijó el salario mínimo mensual en **$1.750.905**.
- Si trabajas menos horas que la jornada máxima, puede pagarse en proporción al tiempo trabajado.
- Ningún pacto puede fijar un salario menor: sería ineficaz.

> Este decreto fue objeto de demandas. Antes de hacer cuentas, confirma el valor vigente en el Ministerio del Trabajo.

## El auxilio de transporte
- Lo reciben quienes ganan **hasta dos salarios mínimos** (Ley 15 de 1959).
- Para 2026, el Decreto 1470 de 2025 lo fijó en **$249.095** al mes.
- Se paga por los días trabajados. No es salario, pero se suma para calcular las cesantías y la prima. Lee la guía de la [liquidación](/derechos/liquidacion-al-terminar-el-contrato).

## La dotación
Si ganas hasta dos salarios mínimos y llevas más de tres meses con el empleador, tienes derecho a recibir **un par de zapatos y un vestido de trabajo** cada cuatro meses, de forma gratuita (art. 230 del CST). Las entregas se hacen:
- A más tardar el **30 de abril**.
- A más tardar el **31 de agosto**.
- A más tardar el **20 de diciembre**.

La dotación debe ser adecuada a tu labor y no puede pagarse en dinero (art. 234 del CST). Tú debes usarla durante el trabajo; si no la usas, el empleador puede quedar libre de entregarla en el periodo siguiente (art. 233 del CST).

## Si no te pagan lo que corresponde
Pide la corrección por escrito y guarda tus desprendibles. Lee las guías [cuándo y cómo deben pagarte el salario](/derechos/pago-del-salario) y [a dónde acudir](/derechos/a-donde-acudir-ministerio-y-derecho-de-peticion).$g$,
  'pago-salarios',
  'pendiente_verificacion'
)
on conflict (slug) do nothing;

-- Fuentes oficiales. Las del Código Sustantivo del Trabajo apuntan a la página
-- del Senado que contiene cada artículo.
insert into public.legal_resource_sources (resource_id, label, publisher, url, accessed_at)
select r.id, s.label, s.publisher, s.url, date '2026-10-27'
from (values
  ('liquidacion-al-terminar-el-contrato', 'Código Sustantivo del Trabajo, arts. 57, 64 y 65', 'Secretaría General del Senado de la República', 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo_pr001.html'),
  ('liquidacion-al-terminar-el-contrato', 'Código Sustantivo del Trabajo, art. 189', 'Secretaría General del Senado de la República', 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo_pr006.html'),
  ('liquidacion-al-terminar-el-contrato', 'Código Sustantivo del Trabajo, art. 249', 'Secretaría General del Senado de la República', 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo_pr008.html'),
  ('liquidacion-al-terminar-el-contrato', 'Código Sustantivo del Trabajo, art. 306', 'Secretaría General del Senado de la República', 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo_pr010.html'),
  ('liquidacion-al-terminar-el-contrato', 'Código Sustantivo del Trabajo, arts. 488 y 489', 'Secretaría General del Senado de la República', 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo_pr016.html'),
  ('liquidacion-al-terminar-el-contrato', 'Ley 52 de 1975', 'Secretaría General del Senado de la República', 'http://www.secretariasenado.gov.co/senado/basedoc/ley_0052_1975.html'),
  ('liquidacion-al-terminar-el-contrato', 'Ley 789 de 2002, art. 29', 'Secretaría General del Senado de la República', 'http://www.secretariasenado.gov.co/senado/basedoc/ley_0789_2002.html'),
  ('renuncia-y-preaviso', 'Código Sustantivo del Trabajo, arts. 59, 62, 64 y 66', 'Secretaría General del Senado de la República', 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo_pr001.html'),
  ('renuncia-y-preaviso', 'Ley 2466 de 2025, art. 5 (art. 47 del CST)', 'Departamento Administrativo de la Función Pública', 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=260676'),
  ('tipos-de-contrato-y-periodo-de-prueba', 'Código Sustantivo del Trabajo, art. 6', 'Secretaría General del Senado de la República', 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo.html'),
  ('tipos-de-contrato-y-periodo-de-prueba', 'Código Sustantivo del Trabajo, arts. 76 a 80', 'Secretaría General del Senado de la República', 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo_pr002.html'),
  ('tipos-de-contrato-y-periodo-de-prueba', 'Ley 2466 de 2025, arts. 5 y 6 (arts. 46 y 47 del CST)', 'Departamento Administrativo de la Función Pública', 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=260676'),
  ('seguridad-social-eps-pension-arl-y-caja', 'Ley 100 de 1993', 'Secretaría General del Senado de la República', 'http://www.secretariasenado.gov.co/senado/basedoc/ley_0100_1993.html'),
  ('seguridad-social-eps-pension-arl-y-caja', 'Ley 1562 de 2012', 'Secretaría General del Senado de la República', 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1562_2012.html'),
  ('seguridad-social-eps-pension-arl-y-caja', 'Ley 21 de 1982 (subsidio familiar)', 'Secretaría General del Senado de la República', 'http://www.secretariasenado.gov.co/senado/basedoc/ley_0021_1982.html'),
  ('accidente-de-trabajo-y-enfermedad-laboral', 'Ley 1562 de 2012, arts. 3 y 4', 'Secretaría General del Senado de la República', 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1562_2012.html'),
  ('accidente-de-trabajo-y-enfermedad-laboral', 'Ley 776 de 2002, arts. 3 y 4', 'Secretaría General del Senado de la República', 'http://www.secretariasenado.gov.co/senado/basedoc/ley_0776_2002.html'),
  ('accidente-de-trabajo-y-enfermedad-laboral', 'Decreto 1295 de 1994', 'Secretaría General del Senado de la República', 'http://www.secretariasenado.gov.co/senado/basedoc/decreto_1295_1994.html'),
  ('estabilidad-laboral-reforzada', 'Ley 361 de 1997, art. 26', 'Secretaría General del Senado de la República', 'http://www.secretariasenado.gov.co/senado/basedoc/ley_0361_1997.html'),
  ('estabilidad-laboral-reforzada', 'Sentencia SU-049 de 2017', 'Corte Constitucional', 'https://www.corteconstitucional.gov.co/relatoria/2017/SU049-17.htm'),
  ('estabilidad-laboral-reforzada', 'Sentencia SU-348 de 2022', 'Corte Constitucional', 'https://www.corteconstitucional.gov.co/relatoria/2022/su348-22.htm'),
  ('estabilidad-laboral-reforzada', 'Código Sustantivo del Trabajo, art. 239', 'Secretaría General del Senado de la República', 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo_pr007.html'),
  ('estabilidad-laboral-reforzada', 'Código Sustantivo del Trabajo, art. 405', 'Secretaría General del Senado de la República', 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo.html'),
  ('acoso-sexual-en-el-trabajo', 'Ley 2365 de 2024', 'Colpensiones (compilación normativa)', 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/ley_2365_2024.htm'),
  ('acoso-sexual-en-el-trabajo', 'Código Penal, art. 210A', 'Secretaría General del Senado de la República', 'http://www.secretariasenado.gov.co/senado/basedoc/ley_0599_2000.html'),
  ('acoso-sexual-en-el-trabajo', 'Ley 1010 de 2006, art. 9', 'Secretaría General del Senado de la República', 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1010_2006.html'),
  ('salario-minimo-auxilio-de-transporte-y-dotacion', 'Código Sustantivo del Trabajo, arts. 145 y 147', 'Secretaría General del Senado de la República', 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo_pr004.html'),
  ('salario-minimo-auxilio-de-transporte-y-dotacion', 'Código Sustantivo del Trabajo, arts. 230 a 234', 'Secretaría General del Senado de la República', 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo_pr007.html'),
  ('salario-minimo-auxilio-de-transporte-y-dotacion', 'Ley 15 de 1959', 'Secretaría General del Senado de la República', 'http://www.secretariasenado.gov.co/senado/basedoc/ley_0015_1959.html')
) as s(slug, label, publisher, url)
join public.legal_resources r on r.slug = s.slug
on conflict (resource_id, url) do nothing;
