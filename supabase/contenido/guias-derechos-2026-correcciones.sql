-- VozLaboral: correcciones a las 24 guías tras revisarlas contra el texto oficial.
--
-- Revisión del 27 de octubre de 2026 contra el texto consolidado de la
-- compilación normativa oficial de Colpensiones (Código Sustantivo del Trabajo,
-- leyes y decretos citados) y las sentencias publicadas por la Corte
-- Constitucional. Cambios principales:
--   - Despido: el mínimo de 15 días de indemnización es del contrato por obra o
--     labor, no del contrato a término fijo; procedimiento disciplinario del
--     art. 115 (Ley 2466 de 2025) y aviso de 15 días (art. 62).
--   - Cesantías: se consignan antes del 15 de febrero (no del 14); la sanción por
--     no pagar los intereses se causa cada vez que se incumple; pagos mensuales
--     de la Ley 2466 de 2025; pérdida del derecho (art. 250).
--   - Vacaciones: el pago al terminar el contrato está en la Ley 995 de 2005.
--   - Maternidad y paternidad: indemnización de 60 días, presunción de despido
--     por embarazo, protección del padre (Ley 2141 de 2021), licencia compartida
--     y lactancia.
--   - Incapacidad: la regla de los dos primeros días está en el art. 3.2.1.10 del
--     Decreto 780 de 2016, y se exigen 4 semanas cotizadas (Decreto 2126 de 2023).
--   - Licencias: luto (5 días hábiles) y cuidado de la niñez (10 días hábiles).
--   - Acoso laboral: protección de 6 meses contra el despido y caducidad de 3 años.
--   - Acoso sexual: obligaciones del empleador, medidas de protección en 5 días
--     hábiles y estabilidad de 6 meses (Ley 2365 de 2024).
--   - Renuncia, tipos de contrato, seguridad social, accidente de trabajo,
--     estabilidad reforzada, salario mínimo y liquidación: precisiones con el
--     texto vigente (prórrogas, preaviso, ARL, reforma pensional, decretos 2026).
--
-- Cada guía solo se actualiza si su texto sigue igual al publicado el 27 de
-- octubre de 2026. Si la editaste a mano, se deja como está y la consulta del
-- final la muestra como «revisar a mano».
-- Es idempotente: repetirlo no cambia nada.

begin;

update public.legal_resources set content = $c$## El Ministerio del Trabajo
La vigilancia y el control del cumplimiento de las normas laborales corresponden al Ministerio del Trabajo (art. 485 del CST). Según el artículo 486, sus funcionarios pueden:
- Citar a los empleadores y exigirles información, libros, registros y planillas.
- Entrar sin previo aviso en las empresas y ordenar medidas preventivas.
- Imponer multas de 1 a 5.000 salarios mínimos mensuales según la gravedad de la infracción, cada vez y mientras la infracción continúe.

Los inspectores también pueden actuar como conciliadores entre el trabajador y el empleador.

Lo que no pueden hacer es declarar derechos individuales ni resolver controversias que corresponden a los jueces. Si lo que reclamas es, por ejemplo, el pago de una suma concreta, la decisión final es de la justicia laboral.

## El derecho de petición
Toda persona puede presentar peticiones respetuosas a las autoridades y obtener pronta respuesta (art. 23 de la Constitución). Por regla general, la respuesta debe llegar dentro de los **15 días hábiles** siguientes (art. 14 de la Ley 1755 de 2015).

También puedes presentar un derecho de petición ante una empresa privada para proteger tus derechos fundamentales (art. 32 de la Ley 1755 de 2015), y ante tu EPS, tu fondo de pensiones o tu caja de compensación (art. 33). Sirve, por ejemplo, para pedir copia de tus desprendibles o de tu historia laboral.

## Antes de acudir
Reúne lo que tengas por escrito: contrato, desprendibles de pago, mensajes, correos y nombres de testigos. Describe los hechos en orden y con fechas.

## Ten en cuenta los plazos
Los derechos laborales prescriben a los tres años desde que son exigibles. Un reclamo escrito al empleador sobre un derecho concreto interrumpe ese plazo una sola vez, y desde ese reclamo vuelve a contar (arts. 488 y 489 del CST).

Si tu reclamo es por acoso, lee las guías de [acoso laboral](/derechos/acoso-laboral-que-es-y-donde-acudir) y de [acoso sexual](/derechos/acoso-sexual-en-el-trabajo).$c$
 where slug = 'a-donde-acudir-ministerio-y-derecho-de-peticion' and md5(replace(content, E'\r\n', E'\n')) = 'faa1b68e8899e10989f66046f00ed0c3';

update public.legal_resources set content = $c$## Qué es un accidente de trabajo
Según el artículo 3 de la Ley 1562 de 2012, es todo suceso repentino que ocurra por causa o con ocasión del trabajo y que te produzca una lesión, una perturbación funcional o psiquiátrica, una invalidez o la muerte. También lo es:
- El que ocurre mientras cumples órdenes del empleador, aunque sea fuera del lugar o del horario de trabajo.
- El que ocurre en el traslado entre tu casa y el trabajo, cuando el transporte lo da el empleador.
- El que ocurre ejerciendo la función sindical, aunque estés en permiso sindical.
- El que ocurre en actividades recreativas, deportivas o culturales cuando actúas por cuenta o en representación del empleador.

Estas reglas cubren también a los contratistas afiliados a la ARL.

## Qué es una enfermedad laboral
Es la que contraes como resultado de la exposición a los riesgos propios de tu trabajo o del medio en que trabajas (art. 4 de la Ley 1562 de 2012). El Gobierno publica una tabla de enfermedades laborales; si la tuya no aparece pero se demuestra la relación con el trabajo, también se reconoce.

## Qué hacer si te accidentas
1. Pide atención médica de inmediato. El empleador debe prestarte los primeros auxilios.
2. Avisa a tu jefe o a la persona de seguridad y salud en el trabajo lo antes posible.
3. El empleador debe **reportar el accidente a la ARL y a la EPS, al mismo tiempo, dentro de los dos días hábiles** siguientes. El mismo plazo corre para la enfermedad laboral desde que se diagnostica (art. 62 del Decreto 1295 de 1994).
4. Pide copia del reporte. Si el empleador no lo hace, comunícate con la ARL y con tu EPS, y avisa al Ministerio del Trabajo: la omisión del reporte puede costarle al empleador multas de hasta 1.000 salarios mínimos (art. 30 de la Ley 1562 de 2012).
5. Guarda la historia clínica, las incapacidades y los nombres de los testigos.

## Qué te cubre la ARL
- La **atención médica completa**: consultas, medicamentos, cirugías, rehabilitación y prótesis.
- Durante la incapacidad temporal, el **100 % del salario sobre el que se cotizaba**, desde el día siguiente al accidente o al diagnóstico de la enfermedad laboral. Se paga hasta por 180 días, prorrogables por otros 180 si hace falta para el tratamiento o la rehabilitación (art. 3 de la Ley 776 de 2002).
- Mientras dura la incapacidad, la ARL paga además la parte del empleador de tus aportes a salud y pensión.
- Si queda una secuela, una indemnización por incapacidad permanente parcial o, si es grave, una pensión de invalidez. Si la persona fallece, su familia puede recibir una pensión de sobrevivientes.

## Al volver al trabajo
Al terminar la incapacidad, el empleador debe reintegrarte a tu cargo o a uno compatible con tu capacidad, de la misma categoría (art. 4 de la Ley 776 de 2002). Puede que también tengas protección contra el despido: lee la guía de [estabilidad laboral reforzada](/derechos/estabilidad-laboral-reforzada).

> Si la EPS o la ARL dicen que tu accidente o enfermedad no es de origen laboral y no estás de acuerdo, puedes controvertir esa calificación ante la junta de calificación de invalidez. Los plazos son cortos: pide orientación pronto.

Si la enfermedad no viene del trabajo, aplica la guía de [incapacidad por enfermedad](/derechos/incapacidad-por-enfermedad).$c$
 where slug = 'accidente-de-trabajo-y-enfermedad-laboral' and md5(replace(content, E'\r\n', E'\n')) = 'e57ebdf36db61f01bab0132a4aac052e';

update public.legal_resources set content = $c$## Qué dice la ley
Según el artículo 2 de la Ley 1010 de 2006, el acoso laboral es toda conducta persistente y demostrable, ejercida por un empleador, un jefe, un compañero o un subalterno, que busca infundir miedo, intimidación, terror y angustia, causar perjuicio laboral, desmotivar o inducir la renuncia.

## Algunas formas que puede tomar
- Maltrato laboral: violencia física o moral, expresiones injuriosas o comportamientos que buscan menoscabar tu autoestima y tu dignidad.
- Persecución laboral: conductas reiteradas o arbitrarias para inducir tu renuncia, como descalificaciones, carga excesiva de trabajo o cambios permanentes de horario.
- Discriminación laboral: trato diferente por raza, género, edad, origen, religión, preferencia política o situación social sin ninguna razón laboral.

La ley describe otras modalidades: el entorpecimiento laboral (esconder o dañar tus herramientas o información), la inequidad laboral (asignarte funciones para menospreciarte) y la desprotección laboral (ponerte en riesgo sin las medidas de seguridad mínimas). Si la conducta tiene connotación sexual, lee la guía de [acoso sexual en el trabajo](/derechos/acoso-sexual-en-el-trabajo). Que un hecho aislado te moleste no basta: la ley habla de conductas persistentes y demostrables.

## A dónde acudir
El artículo 9 de la Ley 1010 de 2006 prevé estas vías:
- El procedimiento interno, confidencial y conciliatorio que debe incluir el reglamento de trabajo de tu empresa.
- Una denuncia por escrito, con el detalle de los hechos y alguna prueba, ante el inspector de trabajo del lugar, los inspectores municipales de policía, los personeros municipales o la Defensoría del Pueblo.
- Una institución de conciliación autorizada, para intentar superar la situación de forma amigable.

## Protección si denuncias
Si presentas una queja por acoso laboral, el despido que te hagan dentro de los **6 meses** siguientes no produce efecto, siempre que la autoridad compruebe los hechos. La misma protección cubre a los testigos (art. 11 de la Ley 1010 de 2006).

## Plazo para actuar
Las acciones por acoso laboral caducan a los **3 años** desde que ocurrieron los hechos (art. 18 de la Ley 1010 de 2006, modificado por la Ley 2209 de 2022).

## Antes de denunciar
Anota fechas, horas y lugares; guarda mensajes y correos, e identifica a posibles testigos. Esas pruebas son las que pide la ley. Para saber qué puede hacer el Ministerio del Trabajo, lee la guía [a dónde acudir](/derechos/a-donde-acudir-ministerio-y-derecho-de-peticion).$c$
 where slug = 'acoso-laboral-que-es-y-donde-acudir' and md5(replace(content, E'\r\n', E'\n')) = 'ffe92b7e2653309b3fab0d803f305195';

update public.legal_resources set content = $c$## Qué es
La Ley 2365 de 2024 entiende por acoso sexual todo acto de persecución, hostigamiento o asedio de carácter o connotación sexual, lasciva o libidinosa, que se dé en el contexto laboral. Puede venir de un jefe o de un compañero, porque la ley cubre las relaciones de poder verticales y horizontales, y puede ocurrir **una o varias veces** (art. 2).

Algunos ejemplos: comentarios o insinuaciones sexuales no deseadas, mensajes o imágenes de contenido sexual, contacto físico no consentido, o pedir favores sexuales a cambio de beneficios en el trabajo o bajo amenaza.

## A quién protege y dónde
La ley protege a cualquier persona en el contexto laboral, **sin importar el tipo de vinculación**: trabajadores con contrato, contratistas de prestación de servicios, pasantes y practicantes (art. 7). Se presume que el acoso ocurrió en el contexto laboral cuando sucede, entre otros lugares:
- En el lugar de trabajo, incluido el trabajo en casa, el remoto y el teletrabajo.
- En los espacios de descanso, comedores, baños y vestuarios.
- En viajes, eventos o actividades sociales o de formación relacionados con el trabajo.
- En las comunicaciones de trabajo, incluidas las digitales.
- En el trayecto entre la casa y el trabajo, o en el alojamiento que da el empleador, cuando lo comete alguien del contexto laboral.

## Qué debe hacer el empleador
Según el artículo 11 de la Ley 2365 de 2024, el empleador debe prevenir, investigar y sancionar el acoso sexual. Para eso debe:
- Tener una política de prevención, con protocolos y rutas de atención, incluida en el reglamento de trabajo y en los contratos, y darla a conocer.
- Garantizar los derechos de las víctimas y tomar medidas de protección inmediata.
- Informarte que puedes acudir a la Fiscalía.
- Remitir de inmediato la queja a la autoridad competente si lo pides, respetando tu intimidad.
- No censurarte ni revictimizarte.

Las empresas que contratan por prestación de servicios tienen las mismas obligaciones (art. 12).

## Medidas que puedes pedir
Si denuncias, tú o los testigos pueden pedir al empleador estas medidas, que debe adoptar en un plazo de **5 días hábiles** (art. 13):
- El traslado de área de trabajo.
- Teletrabajo, si hay riesgo para ti.
- No tener que interactuar con la persona investigada.
- Terminar el contrato **sin tener que dar preaviso**.

También tienes derecho a atención emocional y psicológica de tu ARL, a la confidencialidad y a no ser confrontada o confrontado con la persona agresora.

## Protección contra el despido
- Si te despiden dentro de los **6 meses** siguientes a tu queja o denuncia, el despido no produce efecto (art. 14).
- Si te despiden después de ese plazo y alegas ante un juez que fue por tu queja, el empleador tiene que demostrar que no fue así.
- El despido durante el trámite de la queja o en esos 6 meses se presume una represalia y puede costarle al empleador una multa.
- La protección cubre también a los testigos.

## A dónde acudir
- La **ruta interna** de tu empresa o contratante. La queja puede presentarse por escrito, en forma verbal o por medios electrónicos, contando cuándo, cómo y dónde pasaron los hechos (art. 15).
- Si quien te acosa es la persona de más alto rango de la empresa, la queja va directamente a la **inspección de trabajo** del Ministerio del Trabajo (art. 11, parágrafo 3).
- La **Fiscalía General de la Nación**: el acoso sexual es un delito, castigado con prisión de 1 a 3 años (art. 210A del Código Penal). No necesitas quejarte primero ante la empresa para denunciar.
- La Defensoría del Pueblo o la personería de tu municipio, para orientación.
- La **línea 155**, de orientación a mujeres víctimas de violencia, de atención gratuita.

> No tienes que demostrarlo todo antes de pedir ayuda. Aun así, guarda mensajes, correos, fechas y nombres de testigos: facilitan cualquier reclamo.

## Diferencia con el acoso laboral
El acoso laboral de la Ley 1010 de 2006 es una conducta persistente que busca intimidarte o hacerte renunciar. El acoso sexual tiene connotación sexual y puede configurarse con un solo hecho. Lee la guía de [acoso laboral](/derechos/acoso-laboral-que-es-y-donde-acudir).$c$
 where slug = 'acoso-sexual-en-el-trabajo' and md5(replace(content, E'\r\n', E'\n')) = '96ebf0fb2839a624e61a1b57202ffe8d';

update public.legal_resources set content = $c$## Qué son las cesantías
Son un ahorro que el empleador te debe por tu trabajo: **un mes de salario por cada año trabajado**, o la parte proporcional si trabajaste menos tiempo (art. 249 del CST). Las reciben también las personas con contratos ocasionales o transitorios: la Corte Constitucional eliminó esa exclusión en la Sentencia C-823 de 2006.

## Cuándo deben consignarlas
- Al 31 de diciembre se liquida lo que ganaste en el año.
- El empleador debe consignar ese valor en el fondo de cesantías que elijas **antes del 15 de febrero** del año siguiente, es decir, a más tardar el 14 de febrero (art. 99 de la Ley 50 de 1990).
- Si no lo hace a tiempo, debe pagarte un día de salario por cada día de retraso (art. 99 de la Ley 50 de 1990).

## Los intereses sobre las cesantías
- El empleador te paga directamente unos intereses del **12 % anual** sobre las cesantías acumuladas a 31 de diciembre, o en proporción si trabajaste menos de un año (Ley 52 de 1975, reglamentada en el Decreto 1072 de 2015).
- Se pagan en **enero** del año siguiente. Si el empleador no los paga a tiempo, debe pagarte además una suma igual a esos intereses, cada vez que incumpla (art. 2.2.1.3.8 del Decreto 1072 de 2015).
- Con cada pago te deben entregar un comprobante con el valor de las cesantías tomado como base, el periodo y el valor de los intereses.

## Pagos mensuales
Desde la Ley 2466 de 2025, el empleador puede consignar cada mes en tu fondo el 8,33 % de tu salario como anticipo de las cesantías. Esa plata sigue en el fondo: no es un pago parcial que puedas retirar. Y si lo acuerdan por escrito, puede pagarte cada mes los intereses, a razón del 1 % del salario.

## Al terminar el contrato
Cuando termina el contrato, las cesantías del último periodo y sus intereses se pagan directamente al trabajador junto con la [liquidación](/derechos/liquidacion-al-terminar-el-contrato).

## Cuándo se pierden
La ley solo permite negarlas si el contrato termina por un delito contra el empleador o sus familiares, un daño grave e intencional a los bienes de la empresa o la revelación de secretos con perjuicio grave. Aun así, es un juez quien lo decide (art. 250 del CST).

## Para qué puedes retirarlas
Mientras trabajas, la ley permite retirar las cesantías del fondo para fines concretos, como comprar, construir o mejorar vivienda, o pagar educación. Consulta en tu fondo los requisitos.$c$
 where slug = 'cesantias-e-intereses' and md5(replace(content, E'\r\n', E'\n')) = '7173e4b4f4f938571e32264f97c391f5';

update public.legal_resources set content = $c$## Despido con justa causa
El artículo 62 del CST enumera las causas por las que el empleador puede terminar el contrato sin pagar indemnización, como el engaño con certificados falsos al ser contratado, los actos de violencia o la violación grave de las obligaciones del trabajador.

- Quien termina el contrato debe decir a la otra parte el **motivo en el momento de hacerlo**, y después no puede alegar otros distintos (art. 66 del CST).
- Para algunas causas, como el rendimiento deficiente, la ineptitud o una enfermedad que no se ha curado en 180 días, el empleador debe avisarte con al menos **15 días** de anticipación (art. 62, numerales 9 a 15, del CST).

## Si el despido es una sanción disciplinaria
Desde la Ley 2466 de 2025, el artículo 115 del CST exige un procedimiento con garantías mínimas:
1. Te deben comunicar formalmente que se abre el proceso.
2. Te deben indicar por escrito los hechos que lo motivan.
3. Te deben entregar todas las pruebas.
4. Debes tener **al menos 5 días** para dar tu versión, controvertir las pruebas y presentar las tuyas.
5. La decisión debe estar motivada y la sanción debe ser proporcional.
6. Debes poder impugnar la decisión.

Si estás en un sindicato, puedes ir acompañado por uno o dos representantes. En el trabajo doméstico y en las empresas de menos de 10 trabajadores, el empleador solo está obligado a escucharte antes de decidir, respetando tu derecho de defensa.

> Pide siempre la carta de despido con el motivo por escrito. Si la empresa te cita a «descargos», puedes presentar tu versión y tus pruebas. Si eres tú quien quiere terminar el contrato, lee la guía de [renuncia](/derechos/renuncia-y-preaviso).

## Despido sin justa causa: la indemnización
Si el empleador termina el contrato sin una justa causa, debe pagarte una indemnización (art. 64 del CST):

### Contrato a término fijo
El valor de los salarios del tiempo que faltaba para terminar el contrato.

### Contrato por obra o labor
El valor de los salarios del tiempo que faltaba para terminar la obra o labor, con un mínimo de 15 días.

### Contrato a término indefinido
- Si ganas menos de 10 salarios mínimos: 30 días de salario por el primer año y 20 días más por cada año siguiente, en proporción por fracción de año.
- Si ganas 10 salarios mínimos o más: 20 días por el primer año y 15 días más por cada año siguiente.

## Además de la indemnización
Al terminar el contrato, por cualquier causa, el empleador debe pagarte la liquidación: salarios pendientes, cesantías y sus intereses, prima y vacaciones no disfrutadas. Lee las guías de la [liquidación](/derechos/liquidacion-al-terminar-el-contrato), las [cesantías](/derechos/cesantias-e-intereses), la [prima](/derechos/prima-de-servicios) y las [vacaciones](/derechos/vacaciones).

## Protecciones especiales
Algunas personas no pueden ser despedidas sin autorización previa, por ejemplo durante el embarazo o la licencia de maternidad. Revisa las guías de [estabilidad laboral reforzada](/derechos/estabilidad-laboral-reforzada) y de [licencias de maternidad y paternidad](/derechos/licencias-de-maternidad-y-paternidad).$c$
 where slug = 'despido-con-y-sin-justa-causa' and md5(replace(content, E'\r\n', E'\n')) = 'c9688fbc93c47790ef9d591e138af458';

update public.legal_resources set content = $c$## Qué es
Es una protección especial que impide despedir a ciertas personas por su condición, salvo que exista una autorización previa. No significa que nunca puedan terminar tu contrato, sino que el empleador debe pedir permiso y demostrar una causa ajena a esa condición.

## Personas con discapacidad o con problemas de salud
- Según el artículo 26 de la Ley 361 de 1997, nadie puede ser despedido ni su contrato terminado por razón de su discapacidad sin autorización de la oficina del trabajo (el Ministerio del Trabajo).
- Si lo despiden sin esa autorización, tiene derecho a una **indemnización de 180 días de salario**, además de las demás prestaciones e indemnizaciones que correspondan.
- La Corte Constitucional ha extendido esta protección a quienes tienen un problema de salud que les dificulta trabajar en condiciones normales, aunque no tengan una calificación de discapacidad, y también a contratistas de prestación de servicios (Sentencia SU-049 de 2017).
- La Corte también ha señalado que la indemnización de 180 días no basta por sí sola: un juez puede ordenar el **reintegro**, si es posible, y el pago de los salarios y prestaciones dejados de recibir (Sentencia SU-348 de 2022).
- Desde la Ley 2466 de 2025, el Código prohíbe expresamente despedir o presionar la renuncia de una persona por razones de enfermedad o de salud mental (art. 59, numeral 15, del CST).

Para que la protección aplique, normalmente debe probarse que el empleador **conocía** tu condición de salud. Avisa por escrito y guarda tus incapacidades y recomendaciones médicas.

> La Corte Suprema de Justicia ha tenido criterios más exigentes que la Corte Constitucional sobre quiénes están protegidos. Por eso el resultado puede depender de si acudes a una tutela o a una demanda laboral.

## Embarazo, licencia de maternidad y pareja embarazada
- Ninguna trabajadora puede ser despedida por motivo de embarazo o lactancia sin autorización previa del Ministerio del Trabajo, que solo se da si existe una justa causa (arts. 239 y 240 del CST).
- Si la despiden durante el embarazo o dentro de las 18 semanas siguientes al parto, se presume que fue por el embarazo. Sin autorización, tiene derecho a una indemnización de 60 días de salario, además de lo demás que le deban.
- La misma protección cubre al trabajador cuya pareja esté embarazada, o en las 18 semanas siguientes al parto, y no tenga un empleo formal.

Lee la guía de [licencias de maternidad y paternidad](/derechos/licencias-de-maternidad-y-paternidad).

## Quienes denuncian acoso
- Si presentas una queja por **acoso laboral**, el despido dentro de los 6 meses siguientes no produce efecto, siempre que la autoridad compruebe los hechos (art. 11 de la Ley 1010 de 2006).
- Si presentas una queja por **acoso sexual**, el despido dentro de los 6 meses siguientes no produce efecto y se presume que es una represalia (art. 14 de la Ley 2365 de 2024).

Ambas protecciones cubren también a los testigos. Lee las guías de [acoso laboral](/derechos/acoso-laboral-que-es-y-donde-acudir) y de [acoso sexual](/derechos/acoso-sexual-en-el-trabajo).

## Fuero sindical
El fuero sindical protege a algunos trabajadores, como ciertos directivos de un sindicato. No pueden ser despedidos, desmejorados ni trasladados a otro establecimiento o municipio sin una justa causa calificada antes por un juez del trabajo (art. 405 del CST).

## Si te despiden sin autorización
1. Pide la carta de despido con el motivo por escrito.
2. Reúne las pruebas de tu condición y de que el empleador la conocía.
3. Busca orientación pronto. Muchas personas acuden a la acción de tutela, que debe presentarse en un tiempo razonable después del despido, o a una demanda laboral.

> La jurisprudencia sobre este tema cambia y depende mucho de cada caso. Conviene que un abogado o un consultorio jurídico revise tu situación.

Lee también la guía de [despido con y sin justa causa](/derechos/despido-con-y-sin-justa-causa).$c$
 where slug = 'estabilidad-laboral-reforzada' and md5(replace(content, E'\r\n', E'\n')) = 'ff17fb7a490b28ade59b808ebac2e9bc';

update public.legal_resources set content = $c$## Cuánto recibes
Según el artículo 227 del CST, durante una incapacidad por enfermedad común recibes un auxilio de hasta 180 días:
- Las **dos terceras partes** del salario durante los primeros 90 días.
- La **mitad** del salario por el tiempo restante.

La Corte Constitucional precisó que este auxilio no puede ser inferior al salario mínimo (Sentencia C-543 de 2007).

## Quién paga
- Los **dos primeros días** de incapacidad por enfermedad general están a cargo del empleador.
- **Desde el tercer día**, el pago corresponde a la EPS, que lo reconoce a través del empleador.

Así lo dice el parágrafo 1 del artículo 3.2.1.10 del Decreto 780 de 2016.

## Requisitos para que la EPS pague
Desde el Decreto 2126 de 2023, la EPS reconoce la incapacidad si al iniciarla:
- Estás afiliado como cotizante.
- Has cotizado al menos **4 semanas** seguidas antes del inicio de la incapacidad.
- Tienes el certificado expedido o validado por la EPS.

Mientras estás incapacitado, se siguen pagando los aportes a salud y pensión.

## Qué debes hacer
1. Pide al médico tratante el certificado de incapacidad.
2. Entrégalo a tu empleador en el plazo que fije el reglamento de la empresa.
3. Guarda copia de la incapacidad y de los desprendibles de pago.

> Si la enfermedad o el accidente se originaron en el trabajo, la incapacidad es de origen laboral y la paga la ARL, con reglas distintas. Lee la guía de [accidente de trabajo y enfermedad laboral](/derechos/accidente-de-trabajo-y-enfermedad-laboral).$c$
 where slug = 'incapacidad-por-enfermedad' and md5(replace(content, E'\r\n', E'\n')) = '2cb4240da0d5318ef0172e6cbbbf0b38';

update public.legal_resources set content = $c$## Licencia de maternidad
- La trabajadora tiene derecho a una licencia de **18 semanas** remuneradas con el salario que devengue al iniciarla (art. 236 del CST, modificado por la Ley 2114 de 2021).
- Por regla general, se toma **1 semana antes** de la fecha probable del parto y **17 después**. Por razones médicas pueden ser 2 antes y 16 después, o las 18 después del parto.
- Si el bebé es prematuro, se suma la diferencia entre la fecha del nacimiento y la del nacimiento a término. En caso de parto múltiple o de un hijo con discapacidad, la licencia se amplía 2 semanas.
- Para pedirla, presenta al empleador el certificado médico con el estado de embarazo, la fecha probable del parto y la fecha de inicio de la licencia.
- La licencia la paga la EPS, a través del empleador.

## Licencia parental compartida
Desde la Ley 2114 de 2021, los padres pueden repartirse, de común acuerdo, las **últimas 6 semanas** de la licencia de la madre. Las **12 semanas siguientes al parto** son solo para ella. Para hacerlo, deben firmar un documento con la distribución y presentarlo a sus empleadores dentro de los 30 días siguientes al nacimiento, con la autorización escrita del médico.

## Licencia de paternidad
- El padre tiene derecho a una licencia remunerada de **2 semanas**. También aplica en caso de adopción.
- Debe presentar el registro civil de nacimiento a la EPS dentro de los **30 días** siguientes al nacimiento.
- La ley prevé ampliarla 1 semana por cada punto que baje la tasa de desempleo estructural, hasta un máximo de 5 semanas.

## Lactancia
Durante los primeros 6 meses del bebé, la trabajadora tiene derecho a dos descansos de 30 minutos al día para amamantar, sin descuento del salario. Después, y hasta los 2 años, a un descanso de 30 minutos, mientras mantenga la lactancia (art. 238 del CST).

## Protección contra el despido
- Ninguna trabajadora puede ser despedida por motivo de embarazo o lactancia sin la autorización previa del Ministerio del Trabajo, que solo se da si existe una justa causa (arts. 239 y 240 del CST).
- Si la despiden durante el embarazo o dentro de las **18 semanas** siguientes al parto, **se presume** que fue por el embarazo.
- Si la despiden sin autorización, tiene derecho a una indemnización de **60 días de salario**, además de los demás pagos que correspondan.
- La misma protección cubre al trabajador cuya pareja esté embarazada o en las 18 semanas siguientes al parto y no tenga un empleo formal. Para activarla, debe informar al empleador y aportar la prueba del embarazo dentro del mes siguiente.

Lee también la guía de [estabilidad laboral reforzada](/derechos/estabilidad-laboral-reforzada).

> Informa a tu empleador del embarazo por escrito y guarda copia: facilita demostrar que conocía tu estado.$c$
 where slug = 'licencias-de-maternidad-y-paternidad' and md5(replace(content, E'\r\n', E'\n')) = 'baddf27f2a472b859628582d60133075';

update public.legal_resources set content = $c$## Los casos que fija la ley
Según el artículo 57, numeral 6, del CST, modificado por la Ley 2466 de 2025, el empleador debe concederte licencia remunerada:
- Para votar.
- Para desempeñar cargos oficiales transitorios de forzosa aceptación.
- Por grave calamidad doméstica debidamente comprobada: un suceso personal o de un familiar hasta el tercer grado de consanguinidad, segundo de afinidad o primero civil, caso fortuito o fuerza mayor, cuya gravedad afecte el normal desarrollo de tus actividades.
- Para comisiones sindicales o para asistir al entierro de compañeros, avisando con la debida oportunidad.
- Para citas médicas de urgencia o programadas con especialistas, informando al empleador con el certificado previo.
- Para obligaciones escolares como acudiente, cuando el centro educativo exija tu asistencia.
- Para atender citaciones judiciales, administrativas y legales.

Además, puedes acordar con el empleador un día de descanso remunerado por cada 6 meses en que certifiques que vas y vuelves del trabajo en bicicleta.

## Licencia por luto
Si muere tu cónyuge, compañero o compañera permanente, o un familiar hasta el segundo grado de consanguinidad, primero de afinidad o primero civil, tienes derecho a **5 días hábiles** de licencia remunerada, sin importar tu tipo de contrato. También aplica por el hijo, el padre o la madre de crianza. Debes demostrar el hecho con el documento de la autoridad dentro de los 30 días siguientes (art. 57, numeral 10, del CST).

## Licencia para el cuidado de la niñez
El padre, la madre o quien tenga la custodia de un menor de edad con una enfermedad terminal, un cuadro clínico severo por un accidente grave o que requiera cuidados paliativos tiene derecho a **10 días hábiles** de licencia (art. 57, numeral 12, del CST).

## Al terminar el contrato
Si lo solicitas al terminar el contrato, el empleador debe darte una certificación con el tiempo de servicio, la clase de labor y el salario que recibías (art. 57, numeral 7, del CST).

## Consejo práctico
Pide la licencia por escrito y guarda el soporte (certificado médico, citación o constancia del colegio). Si te la niegan, guarda también la respuesta.

Las licencias por nacimiento tienen su propia guía: [licencias de maternidad y paternidad](/derechos/licencias-de-maternidad-y-paternidad).$c$
 where slug = 'licencias-remuneradas' and md5(replace(content, E'\r\n', E'\n')) = 'c0b786eef26851c8c8982653f67db064';

update public.legal_resources set content = $c$## Qué incluye la liquidación
Cuando termina el contrato, sin importar quién lo termine ni por qué, el empleador debe pagarte:
- Los **salarios** y las horas extra o recargos que te deba.
- Las **cesantías** del último periodo y sus **intereses** del 12 % anual, que en este caso se pagan directamente a ti y no al fondo (art. 249 del CST y art. 99 de la Ley 50 de 1990).
- La **prima de servicios** proporcional al tiempo trabajado en el semestre (art. 306 del CST).
- Las **vacaciones** que no alcanzaste a disfrutar, pagadas en dinero por año cumplido y en proporción por la fracción (Ley 995 de 2005).

Si el empleador terminó el contrato **sin justa causa**, debe sumar la indemnización del artículo 64 del CST. Lee la guía de [despido con y sin justa causa](/derechos/despido-con-y-sin-justa-causa).

## Cómo se calcula cada parte
Estas son las fórmulas que se usan en la práctica, con el salario mensual y los días trabajados en el periodo:
- Cesantías: salario × días trabajados en el año ÷ 360.
- Intereses sobre las cesantías: cesantías × días trabajados en el año × 12 % ÷ 360.
- Prima: salario × días trabajados en el semestre ÷ 360.
- Vacaciones no disfrutadas: salario × días trabajados sin vacaciones ÷ 720.

Si recibes auxilio de transporte, se suma al salario para calcular las cesantías y la prima (art. 7 de la Ley 1 de 1963), pero no las vacaciones. Si tu salario es variable, se usa el promedio de lo recibido.

> Estas fórmulas sirven para revisar tu liquidación. Si las cuentas no te cuadran, pide al empleador el detalle por escrito.

## Otros documentos que te deben dar
- Una certificación con el tiempo de servicio, la clase de trabajo y el salario, si la pides (art. 57, numeral 7, del CST).
- La orden para el examen médico de retiro y su certificado, si lo solicitas y te hicieron examen al ingresar o durante el trabajo. Si no te presentas al examen dentro de los 5 días siguientes a recibir la orden, se entiende que lo eludiste por tu culpa (art. 57, numeral 7, del CST).
- La información del pago de tus aportes. Dentro de los 60 días siguientes a la terminación, el empleador debe informarte por escrito el estado de pago de las cotizaciones a seguridad social y parafiscales de los últimos 3 meses, con los comprobantes. Si no demuestra el pago, la terminación no produce efecto, aunque puede pagarlas con intereses dentro de esos 60 días (art. 65 del CST, parágrafo 1).

## Si no te pagan
El artículo 65 del CST prevé una **indemnización moratoria**: si al terminar el contrato el empleador no paga los salarios y las prestaciones que debe, tendrá que pagarte un día de salario por cada día de retraso, hasta por 24 meses. Si pasados esos 24 meses no has iniciado la reclamación ante un juez, o el juez aún no ha decidido, desde el mes 25 se deben intereses de mora a la tasa máxima certificada por la Superintendencia Financiera. Quien gana un salario mínimo o menos conserva el pago de un día de salario por cada día de retraso, sin ese límite.

Esta indemnización no es automática: un juez revisa si el empleador actuó de buena fe. Si no está de acuerdo con lo que debe, el empleador puede consignar ante un juez el valor que acepta deber.

## Qué hacer
1. Pide la liquidación por escrito y revisa cada concepto.
2. No firmes un «paz y salvo» si no estás de acuerdo con los valores: puedes firmar dejando constancia de tu desacuerdo.
3. Si no te pagan, reclama por escrito y guarda copia. Los derechos laborales prescriben a los tres años, y un reclamo escrito interrumpe ese plazo una vez (arts. 488 y 489 del CST).
4. Busca orientación en el Ministerio del Trabajo. Lee la guía [a dónde acudir](/derechos/a-donde-acudir-ministerio-y-derecho-de-peticion).

Más detalle en las guías de [cesantías](/derechos/cesantias-e-intereses), [prima](/derechos/prima-de-servicios) y [vacaciones](/derechos/vacaciones).$c$
 where slug = 'liquidacion-al-terminar-el-contrato' and md5(replace(content, E'\r\n', E'\n')) = '221c7b1b3daa4a4877c81e40d1cb6be3';

update public.legal_resources set content = $c$## Puedes renunciar cuando quieras
Nadie puede obligarte a seguir trabajando. La renuncia es una decisión tuya y debe ser libre: si te presionan para firmarla, guarda pruebas, porque un juez puede considerar que en realidad fue un despido.

## El preaviso
- En el **contrato a término indefinido**, quien renuncia debe avisar con **30 días calendario** de anticipación, para que el empleador consiga un reemplazo. Desde la Ley 2466 de 2025, **no puede pactarse ninguna sanción** por no dar ese aviso (art. 47 del CST).
- En el **contrato a término fijo** o por obra, renunciar antes de tiempo sin justa causa puede obligarte a responder por los perjuicios que causes al empleador (art. 64 del CST). Aun así, el empleador no puede descontar suma alguna de tu salario o tu liquidación sin tu autorización escrita o una orden de un juez (art. 59 del CST).

Si no conoces tu tipo de contrato, revisa la guía de [tipos de contrato y período de prueba](/derechos/tipos-de-contrato-y-periodo-de-prueba).

## Al renunciar te deben la liquidación
Renunciar no te hace perder las cesantías, sus intereses, la prima proporcional ni las vacaciones pendientes. Lo único que no recibes, si renuncias sin justa causa, es la indemnización por despido. Lee la guía de la [liquidación](/derechos/liquidacion-al-terminar-el-contrato).

## Renuncia por justa causa
El artículo 62, literal B, del CST enumera las justas causas para que **el trabajador** termine el contrato. Entre ellas están:
- El engaño del empleador sobre las condiciones de trabajo.
- La violencia, los malos tratos o las amenazas graves del empleador contra ti o tu familia, o de sus representantes con su tolerancia.
- Que te induzca a cometer un acto ilícito o contrario a tus convicciones políticas o religiosas.
- Que te exija, sin razones válidas, un trabajo distinto o en un lugar diferente del pactado.
- El incumplimiento sistemático de sus obligaciones, o una violación grave de ellas, como no pagarte el salario en las condiciones y fechas pactadas.

Si renuncias por una de estas causas:
- **No tienes que dar el preaviso** de 30 días (art. 47 del CST, parágrafo).
- Debes decir **por escrito, al renunciar, cuál es el motivo**, porque después no podrás alegar otro (art. 66 del CST).
- Puedes reclamar la indemnización como si te hubieran despedido sin justa causa (art. 64 del CST). Si el empleador no la paga, puedes acudir a una conciliación o a un juez, que decidirá si la causa se comprueba.

> Antes de renunciar por justa causa, reúne pruebas del incumplimiento: desprendibles, mensajes y correos. Conviene que un abogado o el Ministerio del Trabajo revisen tu caso.

Si renuncias por haber sufrido acoso sexual, tampoco debes preaviso. Lee la guía de [acoso sexual en el trabajo](/derechos/acoso-sexual-en-el-trabajo).

## Cómo presentar la renuncia
1. Escríbela con la fecha, tu nombre y la fecha en que dejarás de trabajar.
2. Entrégala con copia y pide que te firmen o sellen el recibido, o envíala por correo electrónico y guarda el mensaje.
3. Si renuncias por justa causa, explica los hechos concretos en la misma carta.$c$
 where slug = 'renuncia-y-preaviso' and md5(replace(content, E'\r\n', E'\n')) = 'bd8acf91a0cd9ea2ab2531670d0870e3';

update public.legal_resources set content = $c$## El salario mínimo
Es el salario que todo trabajador tiene derecho a recibir para cubrir sus necesidades normales y las de su familia (art. 145 del CST). Lo concertan cada año empleadores, trabajadores y Gobierno en la comisión de concertación; si no hay acuerdo, el Gobierno lo fija por decreto a más tardar el 30 de diciembre (art. 147 del CST).

- Para 2026, el Decreto 1469 de 2025 fijó el salario mínimo mensual en **$1.750.905**.
- Si trabajas menos horas que la jornada máxima y ganas el mínimo, se paga en proporción a las horas efectivamente trabajadas (art. 147, numeral 3, del CST).
- Ningún pacto puede fijar un salario menor: sería ineficaz.

> El Consejo de Estado suspendió por un tiempo el Decreto 1469 de 2025, y el Gobierno fijó el mismo valor de forma transitoria con el Decreto 0159 de 2026. La suspensión ya se levantó, y el valor de 2026 sigue siendo $1.750.905.

## El auxilio de transporte
- Lo reciben quienes ganan **hasta dos salarios mínimos**, en los lugares donde se presta el servicio público de transporte (Ley 15 de 1959 y Decreto 1470 de 2025).
- Para 2026, el Decreto 1470 de 2025 lo fijó en **$249.095** al mes.
- Se paga por los días trabajados. No es salario, pero se suma para calcular las cesantías y la prima (art. 7 de la Ley 1 de 1963). Lee la guía de la [liquidación](/derechos/liquidacion-al-terminar-el-contrato).

## La dotación
Si ganas hasta dos salarios mínimos, tienes derecho a recibir **un par de zapatos y un vestido de trabajo** cada cuatro meses, de forma gratuita. Te corresponde si en la fecha de entrega llevas más de tres meses con el empleador (art. 230 del CST). Las entregas se hacen en estas fechas (art. 232 del CST):
- **30 de abril**.
- **31 de agosto**.
- **20 de diciembre**.

La dotación no puede pagarse en dinero (art. 234 del CST). Tú debes usarla durante el trabajo; si no la usas, el empleador puede quedar libre de entregarla en el periodo siguiente (art. 233 del CST).

## Si no te pagan lo que corresponde
Pide la corrección por escrito y guarda tus desprendibles. Lee las guías [cuándo y cómo deben pagarte el salario](/derechos/pago-del-salario) y [a dónde acudir](/derechos/a-donde-acudir-ministerio-y-derecho-de-peticion).$c$
 where slug = 'salario-minimo-auxilio-de-transporte-y-dotacion' and md5(replace(content, E'\r\n', E'\n')) = '8d924047897a39910ac7400fdfa776a1';

update public.legal_resources set content = $c$## Las cuatro afiliaciones obligatorias
Con contrato de trabajo, el empleador debe afiliarte y pagar los aportes a:
- **Salud (EPS)**: atención médica para ti y tu familia, e incapacidades por enfermedad común.
- **Pensión**: el ahorro o los aportes para tu vejez, invalidez o para tu familia si falleces (Ley 100 de 1993).
- **Riesgos laborales (ARL)**: cubre accidentes de trabajo y enfermedades laborales (Ley 1562 de 2012).
- **Caja de compensación familiar**: subsidio familiar, recreación, capacitación y otros servicios.

La cobertura de la ARL empieza el día calendario siguiente a la afiliación (art. 4 del Decreto 1295 de 1994). Por eso el empleador debe afiliarte **al menos un día antes** de que empieces a trabajar: así, un accidente el primer día ya está cubierto.

## Quién paga cada aporte
Los aportes se calculan sobre tu salario mensual:
- Salud: 12,5 %. Tú pagas el 4 % y el empleador el 8,5 % (art. 204 de la Ley 100 de 1993). Las empresas que son sociedades o personas jurídicas declarantes de renta están exoneradas de su parte para los trabajadores que ganan menos de 10 salarios mínimos (art. 114-1 del Estatuto Tributario); tú sigues pagando tu 4 %.
- Pensión: 16 %. Tú pagas el 4 % y el empleador el 12 % (art. 20 de la Ley 100 de 1993). Si ganas 4 salarios mínimos o más, pagas además un 1 % al fondo de solidaridad pensional, y un poco más desde 16 salarios mínimos.
- ARL: la paga **toda el empleador** (art. 21 del Decreto 1295 de 1994). El porcentaje depende de la clase de riesgo de tu trabajo: el valor inicial va del 0,522 % en el riesgo I al 6,96 % en el riesgo V.
- Caja de compensación: 4 %, a cargo **del empleador** (art. 12 de la Ley 21 de 1982).

> Tu parte de salud y pensión se descuenta del salario. Revisa en tu desprendible que esos descuentos aparezcan y que correspondan a tu salario real.

## La reforma pensional
La Ley 2381 de 2024 cambia el sistema de pensiones. Según la Corte Constitucional (Sentencia C-264 de 2026), sus artículos declarados exequibles entran en vigencia el **1 de abril de 2027**. Hasta entonces se aplican las reglas de la Ley 100 de 1993.

## Cómo comprobar que estás afiliado
1. Consulta en la página de tu EPS, tu fondo de pensiones y tu ARL con tu número de documento.
2. Revisa el Registro Único de Afiliados (RUAF) del Ministerio de Salud, donde aparecen tus afiliaciones.
3. Pide a tu empleador las planillas de pago de aportes (PILA).

## Si no te afilian o no pagan
- Si el empleador te descuenta los aportes y no los paga, o no te afilia, puede responder por las prestaciones que el sistema habría cubierto, como una incapacidad o un accidente.
- Puedes presentar una queja ante el Ministerio del Trabajo. Lee la guía [a dónde acudir](/derechos/a-donde-acudir-ministerio-y-derecho-de-peticion).

Para lo que cubre cada sistema, lee las guías de [incapacidad por enfermedad](/derechos/incapacidad-por-enfermedad) y de [accidente de trabajo y enfermedad laboral](/derechos/accidente-de-trabajo-y-enfermedad-laboral).$c$
 where slug = 'seguridad-social-eps-pension-arl-y-caja' and md5(replace(content, E'\r\n', E'\n')) = 'dd5c814dfd79d80511422d18fa485d74';

update public.legal_resources set content = $c$## El contrato a término indefinido es la regla
Desde la Ley 2466 de 2025, el contrato de trabajo a término indefinido es la regla general en Colombia (art. 47 del CST). Las demás modalidades son excepciones y deben cumplir sus requisitos.

## Las modalidades
### A término indefinido
No tiene fecha de terminación. Termina por renuncia, por despido o por las demás causas de la ley.

### A término fijo
- Debe constar **por escrito**; si no, se entiende que es a término indefinido.
- Su duración máxima es de **4 años**, contando las prórrogas (art. 46 del CST, modificado por la Ley 2466 de 2025).
- Si ninguna de las partes manifiesta, con al menos **30 días** de anticipación al vencimiento, su intención de terminarlo, el contrato se renueva por un periodo igual al pactado.
- Si el contrato es de menos de un año, puede prorrogarse varias veces, pero después de la cuarta prórroga no puede renovarse por menos de un año.
- Tienes los mismos derechos que con un contrato indefinido: prestaciones, vacaciones y seguridad social, en proporción al tiempo trabajado.

### Por obra o labor
Dura lo que dure la obra o labor contratada. Debe constar **por escrito** e indicar de forma precisa y detallada cuál es la obra o labor (art. 46 del CST).

Si no cumple esos requisitos, o si la obra termina y sigues trabajando, se entiende que el contrato es a término indefinido desde el inicio. La excepción es una obra nueva y distinta, que debe quedar especificada por escrito.

### Ocasional o transitorio
Es para labores cortas, de no más de un mes, distintas de las actividades normales de la empresa (art. 6 del CST).

## El contrato de prestación de servicios no es contrato de trabajo
Si te contratan por prestación de servicios pero trabajas tú mismo, bajo órdenes y a cambio de un pago, puede existir un contrato de trabajo. Lee la guía sobre [cuándo existe un contrato de trabajo](/derechos/cuando-existe-contrato-de-trabajo).

## El período de prueba
- Debe pactarse **por escrito**; si no, no existe (art. 77 del CST).
- Dura como máximo **2 meses**. En los contratos a término fijo de menos de un año, no puede superar la quinta parte del plazo pactado (art. 78 del CST).
- Si firmas contratos sucesivos con el mismo empleador, solo vale el período de prueba del primero.
- Durante el período de prueba, cualquiera de las partes puede terminar el contrato sin previo aviso y sin indemnización (art. 80 del CST).

> Estar en período de prueba no te quita derechos: te deben el salario, la afiliación a la seguridad social desde el primer día y las prestaciones proporcionales.$c$
 where slug = 'tipos-de-contrato-y-periodo-de-prueba' and md5(replace(content, E'\r\n', E'\n')) = '73beab75ce847412d9f4cb0a52506d6b';

update public.legal_resources set content = $c$## Cuántos días te corresponden
Según el artículo 186 del Código Sustantivo del Trabajo (CST), quien trabaja un año tiene derecho a **15 días hábiles consecutivos** de vacaciones remuneradas. Si tu contrato termina antes de completar el año, las vacaciones se pagan en dinero en proporción al tiempo trabajado (Ley 995 de 2005).

## Quién decide la fecha
- El empleador señala la época de las vacaciones, a más tardar dentro del año siguiente a aquel en que las ganaste. Puede hacerlo por su cuenta o a petición tuya (art. 187 del CST).
- Debe avisarte la fecha con **15 días de anticipación**.
- La empresa debe llevar un registro de las vacaciones de cada trabajador.

## Cuánto te pagan
Durante las vacaciones recibes el salario ordinario que ganes el día en que empiezan. Para calcularlo no se cuentan el trabajo en días de descanso obligatorio ni las horas extra. Si tu salario es variable, se usa el promedio de lo que ganaste en el año anterior (art. 192 del CST).

## ¿Se pueden pagar en dinero o acumular?
- Puedes pedir que te paguen en dinero hasta la mitad de tus vacaciones. Debe acordarse por escrito con el empleador, y se paga con tu último salario (art. 189 del CST).
- Si el contrato termina sin que las hayas tomado, deben pagártelas en dinero en la [liquidación](/derechos/liquidacion-al-terminar-el-contrato), por año cumplido y en proporción por la fracción (Ley 995 de 2005).
- Cada año debes descansar al menos **6 días hábiles continuos**, que no se pueden acumular. Los días restantes pueden acumularse por acuerdo escrito hasta por dos años, o hasta por cuatro si se trata de trabajadores técnicos, especializados, de confianza o de manejo, o de extranjeros que trabajan lejos de su familia (art. 190 del CST). Si en un año solo disfrutas 6 días, se presume que acumulas el resto para después.

> Si llevas más de un año sin vacaciones y no te dan fecha, pídelas por escrito y guarda copia. Los derechos laborales prescriben a los tres años de ser exigibles (art. 488 del CST). Lee la guía [a dónde acudir](/derechos/a-donde-acudir-ministerio-y-derecho-de-peticion).$c$
 where slug = 'vacaciones' and md5(replace(content, E'\r\n', E'\n')) = 'e0a339d7d27b1d3c322710f7b9d3f212';

-- El resumen de cesantías tenía la misma fecha equivocada.
update public.legal_resources
   set summary = 'Cada año ganas un mes de salario de cesantías, que el empleador debe consignar en tu fondo a más tardar el 14 de febrero, y unos intereses del 12 % que te paga directamente en enero.'
 where slug = 'cesantias-e-intereses'
   and summary = 'Cada año ganas un mes de salario de cesantías, que el empleador debe consignar en tu fondo antes del 14 de febrero, y unos intereses del 12 % que te paga directamente en enero.';

-- Fuentes nuevas: el texto consolidado que se usó para la revisión.
insert into public.legal_resource_sources (resource_id, label, publisher, url, accessed_at)
select r.id, s.label, s.publisher, s.url, date '2026-10-27'
from (values
  ('vacaciones', 'Ley 995 de 2005, art. 1 (vacaciones al terminar el contrato)', 'Colpensiones (compilación normativa oficial)', 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/ley_0995_2005.htm'),
  ('cesantias-e-intereses', 'Decreto 1072 de 2015, arts. 2.2.1.3.4 a 2.2.1.3.9 (intereses sobre las cesantías)', 'Colpensiones (compilación normativa oficial)', 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/decreto_1072_2015.htm'),
  ('cesantias-e-intereses', 'Ley 50 de 1990, art. 99 (con los parágrafos de la Ley 2466 de 2025)', 'Colpensiones (compilación normativa oficial)', 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/ley_0050_1990.htm'),
  ('cesantias-e-intereses', 'Código Sustantivo del Trabajo, art. 250', 'Secretaría General del Senado de la República', 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo_pr008.html'),
  ('incapacidad-por-enfermedad', 'Decreto 780 de 2016, arts. 2.2.3.3.1 y 3.2.1.10 (modificado por el Decreto 2126 de 2023)', 'Colpensiones (compilación normativa oficial)', 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/decreto_0780_2016.htm'),
  ('licencias-de-maternidad-y-paternidad', 'Código Sustantivo del Trabajo, arts. 236 a 240 (Leyes 2114 de 2021, 2141 de 2021 y 2306 de 2023)', 'Colpensiones (compilación normativa oficial)', 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/codigo_sustantivo_trabajo.htm'),
  ('licencias-remuneradas', 'Código Sustantivo del Trabajo, art. 57, numerales 6, 10 y 12', 'Colpensiones (compilación normativa oficial)', 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/codigo_sustantivo_trabajo.htm'),
  ('acoso-laboral-que-es-y-donde-acudir', 'Ley 1010 de 2006, arts. 2, 9, 11 y 18', 'Colpensiones (compilación normativa oficial)', 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/ley_1010_2006.htm'),
  ('a-donde-acudir-ministerio-y-derecho-de-peticion', 'Ley 1755 de 2015, arts. 14, 32 y 33', 'Colpensiones (compilación normativa oficial)', 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/ley_1755_2015.htm'),
  ('liquidacion-al-terminar-el-contrato', 'Ley 995 de 2005, art. 1', 'Colpensiones (compilación normativa oficial)', 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/ley_0995_2005.htm'),
  ('liquidacion-al-terminar-el-contrato', 'Ley 1 de 1963, art. 7 (auxilio de transporte en las prestaciones)', 'Colpensiones (compilación normativa oficial)', 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/ley_0001_1963.htm'),
  ('liquidacion-al-terminar-el-contrato', 'Ley 50 de 1990, art. 99', 'Colpensiones (compilación normativa oficial)', 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/ley_0050_1990.htm'),
  ('renuncia-y-preaviso', 'Código Sustantivo del Trabajo, art. 47 (modificado por la Ley 2466 de 2025)', 'Colpensiones (compilación normativa oficial)', 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/codigo_sustantivo_trabajo.htm'),
  ('renuncia-y-preaviso', 'Ley 2365 de 2024, art. 13', 'Colpensiones (compilación normativa oficial)', 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/ley_2365_2024.htm'),
  ('tipos-de-contrato-y-periodo-de-prueba', 'Código Sustantivo del Trabajo, arts. 46 y 47 (modificados por la Ley 2466 de 2025)', 'Colpensiones (compilación normativa oficial)', 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/codigo_sustantivo_trabajo.htm'),
  ('seguridad-social-eps-pension-arl-y-caja', 'Decreto 1295 de 1994, arts. 4 y 21', 'Colpensiones (compilación normativa oficial)', 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/decreto_1295_1994.htm'),
  ('seguridad-social-eps-pension-arl-y-caja', 'Decreto 1072 de 2015, art. 2.2.4.3.5 (tabla de cotizaciones a la ARL)', 'Colpensiones (compilación normativa oficial)', 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/decreto_1072_2015.htm'),
  ('seguridad-social-eps-pension-arl-y-caja', 'Ley 2381 de 2024 (reforma pensional) y su nota de vigencia', 'Colpensiones (compilación normativa oficial)', 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/ley_2381_2024.htm'),
  ('seguridad-social-eps-pension-arl-y-caja', 'Ley 100 de 1993, arts. 20 y 204', 'Colpensiones (compilación normativa oficial)', 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/ley_0100_1993.htm'),
  ('accidente-de-trabajo-y-enfermedad-laboral', 'Ley 1562 de 2012, arts. 3, 4 y 30', 'Colpensiones (compilación normativa oficial)', 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/ley_1562_2012.htm'),
  ('accidente-de-trabajo-y-enfermedad-laboral', 'Decreto 1295 de 1994, art. 62', 'Colpensiones (compilación normativa oficial)', 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/decreto_1295_1994.htm'),
  ('estabilidad-laboral-reforzada', 'Código Sustantivo del Trabajo, art. 59, numeral 15, y arts. 239 y 240', 'Colpensiones (compilación normativa oficial)', 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/codigo_sustantivo_trabajo.htm'),
  ('estabilidad-laboral-reforzada', 'Ley 1010 de 2006, art. 11', 'Colpensiones (compilación normativa oficial)', 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/ley_1010_2006.htm'),
  ('estabilidad-laboral-reforzada', 'Ley 2365 de 2024, art. 14', 'Colpensiones (compilación normativa oficial)', 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/ley_2365_2024.htm'),
  ('acoso-sexual-en-el-trabajo', 'Código Penal, art. 210A', 'Colpensiones (compilación normativa oficial)', 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/ley_0599_2000.htm'),
  ('salario-minimo-auxilio-de-transporte-y-dotacion', 'Decreto 1469 de 2025 (salario mínimo 2026)', 'Colpensiones (compilación normativa oficial)', 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/decreto_1469_2025.htm'),
  ('salario-minimo-auxilio-de-transporte-y-dotacion', 'Decreto 1470 de 2025 (auxilio de transporte 2026)', 'Colpensiones (compilación normativa oficial)', 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/decreto_1470_2025.htm'),
  ('salario-minimo-auxilio-de-transporte-y-dotacion', 'Decreto 0159 de 2026 y su nota de vigencia', 'Colpensiones (compilación normativa oficial)', 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/decreto_0159_2026.htm'),
  ('salario-minimo-auxilio-de-transporte-y-dotacion', 'Ley 1 de 1963, art. 7', 'Colpensiones (compilación normativa oficial)', 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/ley_0001_1963.htm'),
  ('salario-minimo-auxilio-de-transporte-y-dotacion', 'Código Sustantivo del Trabajo, arts. 230, 232 y 234', 'Secretaría General del Senado de la República', 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo_pr007.html')
) as s(slug, label, publisher, url)
join public.legal_resources r on r.slug = s.slug
on conflict (resource_id, url) do nothing;

-- Fuente equivocada: el Decreto 1427 de 2022 no es el que regula quién paga la
-- incapacidad. Se borra después de añadir la fuente correcta.
delete from public.legal_resource_sources s
 using public.legal_resources r
 where r.id = s.resource_id
   and r.slug = 'incapacidad-por-enfermedad'
   and s.url = 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=191146';

-- La guía de cesantías citaba la Ley 52 de 1975 en la página del Senado: se
-- conserva, y se aclara la etiqueta del artículo 249.
update public.legal_resource_sources s
   set label = 'Código Sustantivo del Trabajo, arts. 249, 250 y 251'
  from public.legal_resources r
 where r.id = s.resource_id
   and r.slug = 'cesantias-e-intereses'
   and s.url = 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo_pr008.html';

commit;

-- Resultado: «corregida» si la guía ya tiene el texto nuevo; «revisar a mano»
-- si se editó después del 27 de octubre y no se tocó.
select c.slug,
       case when md5(replace(r.content, E'\r\n', E'\n')) = c.h then 'corregida' else 'revisar a mano' end as estado
  from (values
  ('a-donde-acudir-ministerio-y-derecho-de-peticion', '3290b4d1d7e961f3535b1363e24efd1f'),
  ('accidente-de-trabajo-y-enfermedad-laboral', 'dc4489617ad13502bd8d5fbf574ffc7e'),
  ('acoso-laboral-que-es-y-donde-acudir', '5b60713b2994e4adcf2cee011cbb7874'),
  ('acoso-sexual-en-el-trabajo', '01d2d076dc1db0c947d8a477334092b6'),
  ('cesantias-e-intereses', 'c048b45e33633fec3b50fe66441b3f7e'),
  ('despido-con-y-sin-justa-causa', 'e1c3c8f1441863b72d8c99642de37abb'),
  ('estabilidad-laboral-reforzada', '1a35bd3c7211716de7b1385806826438'),
  ('incapacidad-por-enfermedad', '8530350f62749c9c720bde33a44839f0'),
  ('licencias-de-maternidad-y-paternidad', 'f549a6dd8632d2be2f2f303a40134032'),
  ('licencias-remuneradas', 'c066ee7dc651694e441c4af8d58f142b'),
  ('liquidacion-al-terminar-el-contrato', 'fd581c041dd77fa672bd3261a9a7a329'),
  ('renuncia-y-preaviso', 'ecdb6553b3c41e17f7f978e5c2c8b8ce'),
  ('salario-minimo-auxilio-de-transporte-y-dotacion', '65a812438c31960a5d48fe9240594e05'),
  ('seguridad-social-eps-pension-arl-y-caja', '1d5bf0b632421cfcc736e484e31f4b63'),
  ('tipos-de-contrato-y-periodo-de-prueba', '93aa362fe9a8752df7d200a610e3507e'),
  ('vacaciones', 'd50c956760aeb73e5d874f7da1c9e0c4')
  ) as c(slug, h)
  join public.legal_resources r on r.slug = c.slug
 order by 2, 1;
