-- VozLaboral: guías de «Tus derechos» (10 temas), redactadas a partir del texto
-- oficial consolidado de la Secretaría del Senado, consultado el 26 de octubre
-- de 2026 (CST actualizado al 15 de octubre de 2026).
--
-- Se cargan en estado «pendiente_verificacion»: NO son públicas. Un abogado debe
-- revisarlas y la administración las publica desde Moderación → Guías.
-- Ejecutar una vez en el SQL Editor. Es idempotente (no duplica si se repite).

insert into public.legal_resources (slug, title, summary, content, category_slug, status) values
(
  'pago-del-salario',
  'Cuándo y cómo deben pagarte el salario',
  'El salario se paga por periodos iguales y vencidos: como máximo cada semana si te pagan por días y cada mes si tienes sueldo.',
  $g$## Qué cuenta como salario
Según el artículo 127 del Código Sustantivo del Trabajo (CST), es salario todo lo que recibes como pago directo por tu trabajo, se llame como se llame: la remuneración fija o variable, las horas extra, el trabajo en días de descanso, los porcentajes sobre ventas, las comisiones y las bonificaciones habituales.

## Cada cuánto deben pagarte
- El salario en dinero se paga por periodos iguales y vencidos, en moneda legal (art. 134 del CST).
- Si te pagan por días (jornal), el periodo no puede ser mayor de una semana. Si tienes sueldo, no puede ser mayor de un mes.
- Las horas extra y el recargo nocturno se pagan junto con el salario del periodo en que los trabajaste o, a más tardar, con el del periodo siguiente.

## Descuentos sobre tu salario
El empleador no puede descontar, retener ni compensar dinero de tu salario o de tus prestaciones sin tu autorización previa por escrito para cada caso, o sin una orden judicial. La ley fija algunas excepciones concretas (art. 59, numeral 1, del CST).

## Si al terminar el contrato no te pagan
El artículo 65 del CST prevé una indemnización por cada día de retraso cuando, al terminar el contrato, el empleador no paga los salarios y prestaciones que debe. Las reglas cambian según tu salario y el tiempo transcurrido, así que conviene que el Ministerio del Trabajo o un abogado revisen tu caso.

## La base en la Constitución
El artículo 53 de la Constitución incluye, entre los principios mínimos del trabajo, una remuneración mínima vital y móvil, proporcional a la cantidad y calidad del trabajo.$g$,
  'pago-salarios',
  'pendiente_verificacion'
),
(
  'cuando-existe-contrato-de-trabajo',
  'Cuándo existe un contrato de trabajo',
  'Si trabajas tú mismo, bajo las órdenes de otra persona y a cambio de un pago, hay contrato de trabajo aunque el documento que firmaste lo llame de otra forma.',
  $g$## Los tres elementos
Según el artículo 23 del CST, hay contrato de trabajo cuando se reúnen tres elementos:
- La actividad personal: el trabajo lo haces tú mismo.
- La subordinación continuada: el empleador puede darte órdenes sobre el modo, el tiempo o la cantidad de trabajo e imponerte reglamentos, siempre sin afectar tu honor, tu dignidad ni tus derechos mínimos.
- Un salario como pago por el servicio.

## El nombre no cambia la realidad
Cuando se reúnen esos tres elementos, existe contrato de trabajo «y no deja de serlo por razón del nombre que se le dé» (art. 23, numeral 2, del CST). Además, la ley presume que toda relación de trabajo personal está regida por un contrato de trabajo (art. 24 del CST).

La Constitución recoge la misma idea: entre los principios mínimos del trabajo están la primacía de la realidad sobre las formalidades y la irrenunciabilidad a los beneficios mínimos que establecen las normas laborales (art. 53).

## Las órdenes no pueden usarse para discriminar
Desde la Ley 2466 de 2025, el artículo 23 del CST precisa que la facultad de dar órdenes no puede ser un factor de discriminación por sexo, identidad de género, orientación sexual, raza, origen, discapacidad, condición familiar, edad, condiciones económicas o de salud, preferencias políticas o religiosas, ni por pertenecer a un sindicato.

## Qué puedes hacer
Si crees que tu contrato encubre una relación laboral, guarda pruebas de cómo trabajas en la práctica: horarios, órdenes recibidas, pagos y comunicaciones. Un inspector del Ministerio del Trabajo puede orientarte, pero quien decide si existe contrato de trabajo es un juez.$g$,
  'contrato-condiciones',
  'pendiente_verificacion'
),
(
  'igual-trabajo-igual-salario',
  'Igual trabajo, igual salario',
  'La ley exige pagar lo mismo por trabajo igual en el mismo puesto, jornada y condiciones de eficiencia. Las diferencias se presumen injustificadas hasta que el empleador demuestre lo contrario.',
  $g$## La regla
El artículo 143 del CST establece que:
- A trabajo igual desempeñado en puesto, jornada y condiciones de eficiencia también iguales, debe corresponder salario igual, incluidos todos los elementos que forman el salario.
- No pueden establecerse diferencias de salario por edad, género, sexo, nacionalidad, raza, religión, opinión política o actividades sindicales.
- Todo trato diferente en el salario se presume injustificado hasta que el empleador demuestre factores objetivos de diferenciación.

## Y los ascensos
La ley no obliga, por sí sola, a subir el salario en cada ascenso. Pero dos situaciones sí pueden darte un derecho:
- Si el aumento quedó pactado en tu contrato, en un acuerdo escrito, en el reglamento o en una convención colectiva, el empleador debe cumplirlo.
- Si haces el mismo trabajo que otra persona mejor pagada, en las condiciones del artículo 143, puedes reclamar igualdad salarial.

Guarda por escrito cualquier compromiso de aumento: correos, mensajes o actas.

## La base en la Constitución
El artículo 53 de la Constitución incluye la igualdad de oportunidades para los trabajadores entre los principios mínimos del trabajo.$g$,
  'ascensos-ajustes',
  'pendiente_verificacion'
),
(
  'limites-de-las-ordenes-del-empleador',
  'Lo que tu empleador puede y no puede exigirte',
  'El empleador puede dar órdenes sobre tu trabajo, pero siempre con respeto absoluto a tu dignidad, tus creencias y tus derechos.',
  $g$## El poder de dar órdenes tiene límites
El empleador puede exigirte cumplir órdenes sobre el modo, el tiempo o la cantidad de trabajo, pero sin afectar tu honor, tu dignidad ni tus derechos mínimos (art. 23 del CST).

## Lo que el empleador está obligado a hacer
Entre las obligaciones especiales del artículo 57 del CST están:
- Darte los instrumentos y materiales necesarios para tu trabajo.
- Pagarte la remuneración pactada en las condiciones, periodos y lugares acordados.
- Guardar absoluto respeto a tu dignidad personal, tus creencias y tus sentimientos.

## Lo que el empleador tiene prohibido
El artículo 59 del CST prohíbe, entre otras cosas:
- Exigirte o aceptar dinero para darte el trabajo o por cualquier condición de este.
- Limitarte o presionarte para que no ejerzas tu derecho de asociación.
- Imponerte obligaciones religiosas o políticas, o impedirte votar.
- Usar «listas negras» para que no te contraten en otras empresas.
- Hacer o permitir cualquier acto que vulnere tus derechos u ofenda tu dignidad.

## Si la situación se repite
Cuando el trato abusivo es persistente y busca intimidarte, desmotivarte o hacerte renunciar, puede tratarse de acoso laboral. Consulta la guía sobre acoso laboral para saber a dónde acudir.$g$,
  'abuso-autoridad',
  'pendiente_verificacion'
),
(
  'acoso-laboral-que-es-y-donde-acudir',
  'Qué es el acoso laboral y a dónde acudir',
  'La Ley 1010 de 2006 define el acoso laboral como una conducta persistente y demostrable. Puedes acudir a un inspector de trabajo, a la personería o a la Defensoría del Pueblo.',
  $g$## Qué dice la ley
Según el artículo 2 de la Ley 1010 de 2006, el acoso laboral es toda conducta persistente y demostrable, ejercida por un empleador, un jefe, un compañero o un subalterno, que busca infundir miedo, intimidación, terror y angustia, causar perjuicio laboral, desmotivar o inducir la renuncia.

## Algunas formas que puede tomar
- Maltrato laboral: violencia física o moral, expresiones injuriosas o comportamientos que buscan menoscabar tu autoestima y tu dignidad.
- Persecución laboral: conductas reiteradas o arbitrarias para inducir tu renuncia, como descalificaciones, carga excesiva de trabajo o cambios permanentes de horario.
- Discriminación laboral: trato diferente por raza, género, edad, origen, religión, preferencia política o situación social sin ninguna razón laboral.

La ley describe otras modalidades. Que un hecho aislado te moleste no basta: la ley habla de conductas persistentes y demostrables.

## A dónde acudir
El artículo 9 de la Ley 1010 de 2006 prevé estas vías:
- El procedimiento interno, confidencial y conciliatorio que debe incluir el reglamento de trabajo de tu empresa.
- Una denuncia por escrito, con el detalle de los hechos y alguna prueba, ante el inspector de trabajo del lugar, los inspectores municipales de policía, los personeros municipales o la Defensoría del Pueblo.
- Una institución de conciliación autorizada, para intentar superar la situación de forma amigable.

## Antes de denunciar
Anota fechas, horas y lugares; guarda mensajes y correos, e identifica a posibles testigos. Esas pruebas son las que pide la ley.$g$,
  'posible-acoso-laboral',
  'pendiente_verificacion'
),
(
  'jornada-horas-extra-y-recargos',
  'Jornada máxima, horas extra y recargos',
  'La jornada ordinaria máxima es de 42 horas a la semana. El trabajo nocturno va de 7:00 p. m. a 6:00 a. m. y tiene un recargo del 35 %.',
  $g$## Jornada máxima
Según el artículo 161 del CST, modificado por la Ley 2466 de 2025, la jornada ordinaria máxima es de 8 horas al día y 42 horas a la semana. Puede repartirse entre 5 y 6 días, de común acuerdo, garantizando siempre el día de descanso y sin afectar el salario.

La reducción a 42 horas se aplicó de forma gradual según el artículo 3 de la Ley 2101 de 2021: el último tramo terminó en julio de 2026.

El empleador y el trabajador también pueden acordar jornadas diarias flexibles, de 4 a 9 horas, en máximo seis días a la semana. En ese caso no hay recargo por trabajo suplementario mientras el promedio no supere las 42 horas semanales.

## Trabajo diurno y nocturno
Desde que entró en vigor la Ley 2466 de 2025, a finales de diciembre de 2025, el trabajo diurno va de 6:00 a. m. a 7:00 p. m., y el nocturno, de 7:00 p. m. a 6:00 a. m. (art. 160 del CST).

## Recargos y horas extra
Según el artículo 168 del CST:
- El trabajo nocturno tiene un recargo del 35 % sobre el valor del trabajo diurno.
- La hora extra diurna, del 25 % sobre el valor del trabajo ordinario diurno.
- La hora extra nocturna, del 75 % sobre el valor del trabajo ordinario diurno.
- Estos recargos no se acumulan entre sí.

## Domingos y festivos
El trabajo en día de descanso obligatorio o festivo tiene un recargo que la ley lleva al 100 % de forma gradual (art. 179 del CST):
- 80 % desde el 1 de julio de 2025.
- 90 % desde el 1 de julio de 2026.
- 100 % desde el 1 de julio de 2027.

Las partes pueden acordar por escrito un día de descanso distinto al domingo. Si no lo acuerdan, el descanso obligatorio es el domingo.

## Vacaciones
Por cada año de servicio tienes derecho a 15 días hábiles consecutivos de vacaciones remuneradas (art. 186 del CST).$g$,
  'jornadas-descansos',
  'pendiente_verificacion'
),
(
  'seguridad-y-salud-en-el-trabajo',
  'Seguridad y salud en el trabajo: obligaciones del empleador',
  'El empleador debe darte un lugar de trabajo apropiado y elementos de protección, prestar primeros auxilios de inmediato y darte permiso para citas médicas.',
  $g$## Lo que dice el Código
Entre las obligaciones especiales del empleador, el artículo 57 del CST incluye:
- Procurar locales apropiados y elementos adecuados de protección contra accidentes y enfermedades, de forma que se garanticen razonablemente la seguridad y la salud.
- Prestar inmediatamente los primeros auxilios en caso de accidente o enfermedad.
- Conceder licencia remunerada para citas médicas de urgencia o programadas con especialistas, informando al empleador con el certificado previo.

## La base en la Constitución
La Constitución reconoce el derecho a un trabajo en condiciones dignas y justas (art. 25) y la garantía a la seguridad social entre los principios mínimos del trabajo (art. 53).

## Ten en cuenta
La seguridad y la salud en el trabajo tienen además una reglamentación técnica extensa que esta guía no resume. Si tu trabajo tiene riesgos concretos, consulta a la administradora de riesgos laborales a la que estás afiliado o al Ministerio del Trabajo.$g$,
  'seguridad-salud',
  'pendiente_verificacion'
),
(
  'igualdad-y-no-discriminacion',
  'Igualdad y no discriminación en el trabajo',
  'La Constitución y el Código Sustantivo del Trabajo prohíben discriminar en el trabajo por sexo, raza, origen, religión, opinión política, identidad de género y otras razones.',
  $g$## La base en la Constitución
El artículo 13 de la Constitución establece que todas las personas reciben la misma protección y gozan de los mismos derechos y oportunidades, sin discriminación por razones de sexo, raza, origen nacional o familiar, lengua, religión, opinión política o filosófica.

## Lo que dice el Código Sustantivo del Trabajo
- La facultad del empleador de dar órdenes no puede ser un factor de discriminación (art. 23, modificado por la Ley 2466 de 2025).
- No pueden establecerse diferencias de salario por edad, género, sexo, nacionalidad, raza, religión, opinión política o actividades sindicales, y toda diferencia salarial se presume injustificada hasta que el empleador demuestre lo contrario (art. 143).
- La Ley 2466 de 2025 añadió al artículo 59 la prohibición de discriminar a las mujeres y a las personas con identidades de género diversas, y prohibió el racismo, la xenofobia y la discriminación por ideología política, origen étnico o credo religioso en el trabajo.

## Cuando es acoso
La Ley 1010 de 2006 considera discriminación laboral, como modalidad de acoso, todo trato diferente por raza, género, edad, origen, credo, preferencia política o situación social que carezca de toda razonabilidad laboral (art. 2). Consulta la guía sobre acoso laboral para saber a dónde acudir.$g$,
  'discriminacion',
  'pendiente_verificacion'
),
(
  'licencias-remuneradas',
  'Licencias remuneradas que el empleador debe conceder',
  'La ley obliga al empleador a darte permiso pagado para votar, por calamidad doméstica, para citas médicas, por obligaciones escolares de tus hijos y para citaciones judiciales, entre otros casos.',
  $g$## Los casos que fija la ley
Según el artículo 57, numeral 6, del CST, modificado por la Ley 2466 de 2025, el empleador debe concederte licencia remunerada:
- Para votar.
- Para desempeñar cargos oficiales transitorios de forzosa aceptación.
- Por grave calamidad doméstica debidamente comprobada: un suceso personal o familiar, caso fortuito o fuerza mayor cuya gravedad afecte el normal desarrollo de tus actividades.
- Para comisiones sindicales o para asistir al entierro de compañeros, avisando con la debida oportunidad.
- Para citas médicas de urgencia o programadas con especialistas, informando al empleador con el certificado previo.
- Para obligaciones escolares como acudiente, cuando el centro educativo exija tu asistencia.
- Para atender citaciones judiciales, administrativas y legales.

## Al terminar el contrato
Si lo solicitas al terminar el contrato, el empleador debe darte una certificación con el tiempo de servicio, la clase de labor y el salario que recibías (art. 57, numeral 7, del CST).

## Consejo práctico
Pide la licencia por escrito y guarda el soporte (certificado médico, citación o constancia del colegio). Si te la niegan, guarda también la respuesta.$g$,
  'organizacion-administracion',
  'pendiente_verificacion'
),
(
  'a-donde-acudir-ministerio-y-derecho-de-peticion',
  'A dónde acudir: Ministerio del Trabajo y derecho de petición',
  'El Ministerio del Trabajo vigila el cumplimiento de las normas laborales y puede sancionar, pero las controversias sobre derechos individuales las decide un juez.',
  $g$## El Ministerio del Trabajo
La vigilancia y el control del cumplimiento de las normas laborales corresponden al Ministerio del Trabajo (art. 485 del CST). Según el artículo 486, sus funcionarios pueden:
- Citar a los empleadores y exigirles información, libros, registros y planillas.
- Entrar sin previo aviso en las empresas y ordenar medidas preventivas.
- Imponer multas de 1 a 5.000 salarios mínimos mensuales según la gravedad de la infracción.
- Actuar como conciliadores.

Lo que no pueden hacer es declarar derechos individuales ni resolver controversias que corresponden a los jueces. Si lo que reclamas es, por ejemplo, el pago de una suma concreta, la decisión final es de la justicia laboral.

## El derecho de petición
Toda persona puede presentar peticiones respetuosas a las autoridades y obtener pronta respuesta (art. 23 de la Constitución). La ley también regula su uso ante organizaciones privadas.

## Antes de acudir
Reúne lo que tengas por escrito: contrato, desprendibles de pago, mensajes, correos y nombres de testigos. Describe los hechos en orden y con fechas.$g$,
  'otras',
  'pendiente_verificacion'
)
on conflict (slug) do nothing;

-- Fuentes oficiales: texto consolidado de la Secretaría del Senado.
insert into public.legal_resource_sources (resource_id, label, publisher, url, accessed_at)
select r.id, s.label, 'Secretaría General del Senado de la República', s.url, date '2026-10-26'
from (values
  ('pago-del-salario', 'Código Sustantivo del Trabajo, arts. 127 y 134', 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo_pr004.html'),
  ('pago-del-salario', 'Código Sustantivo del Trabajo, arts. 59 y 65', 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo_pr001.html'),
  ('pago-del-salario', 'Constitución Política de Colombia, art. 53', 'http://www.secretariasenado.gov.co/senado/basedoc/constitucion_politica_1991_pr001.html'),
  ('cuando-existe-contrato-de-trabajo', 'Código Sustantivo del Trabajo, arts. 22, 23 y 24', 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo.html'),
  ('cuando-existe-contrato-de-trabajo', 'Constitución Política de Colombia, art. 53', 'http://www.secretariasenado.gov.co/senado/basedoc/constitucion_politica_1991_pr001.html'),
  ('igual-trabajo-igual-salario', 'Código Sustantivo del Trabajo, art. 143', 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo_pr004.html'),
  ('igual-trabajo-igual-salario', 'Constitución Política de Colombia, art. 53', 'http://www.secretariasenado.gov.co/senado/basedoc/constitucion_politica_1991_pr001.html'),
  ('limites-de-las-ordenes-del-empleador', 'Código Sustantivo del Trabajo, art. 23', 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo.html'),
  ('limites-de-las-ordenes-del-empleador', 'Código Sustantivo del Trabajo, arts. 57 y 59', 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo_pr001.html'),
  ('acoso-laboral-que-es-y-donde-acudir', 'Ley 1010 de 2006, arts. 2 y 9', 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1010_2006.html'),
  ('jornada-horas-extra-y-recargos', 'Código Sustantivo del Trabajo, arts. 160, 161 y 168', 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo_pr005.html'),
  ('jornada-horas-extra-y-recargos', 'Código Sustantivo del Trabajo, arts. 179 y 186', 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo_pr006.html'),
  ('jornada-horas-extra-y-recargos', 'Ley 2101 de 2021, art. 3', 'http://www.secretariasenado.gov.co/senado/basedoc/ley_2101_2021.html'),
  ('seguridad-y-salud-en-el-trabajo', 'Código Sustantivo del Trabajo, art. 57', 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo_pr001.html'),
  ('seguridad-y-salud-en-el-trabajo', 'Constitución Política de Colombia, art. 25', 'http://www.secretariasenado.gov.co/senado/basedoc/constitucion_politica_1991.html'),
  ('seguridad-y-salud-en-el-trabajo', 'Constitución Política de Colombia, art. 53', 'http://www.secretariasenado.gov.co/senado/basedoc/constitucion_politica_1991_pr001.html'),
  ('igualdad-y-no-discriminacion', 'Constitución Política de Colombia, art. 13', 'http://www.secretariasenado.gov.co/senado/basedoc/constitucion_politica_1991.html'),
  ('igualdad-y-no-discriminacion', 'Código Sustantivo del Trabajo, art. 23', 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo.html'),
  ('igualdad-y-no-discriminacion', 'Código Sustantivo del Trabajo, art. 59', 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo_pr001.html'),
  ('igualdad-y-no-discriminacion', 'Código Sustantivo del Trabajo, art. 143', 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo_pr004.html'),
  ('igualdad-y-no-discriminacion', 'Ley 1010 de 2006, art. 2', 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1010_2006.html'),
  ('licencias-remuneradas', 'Código Sustantivo del Trabajo, art. 57', 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo_pr001.html'),
  ('a-donde-acudir-ministerio-y-derecho-de-peticion', 'Código Sustantivo del Trabajo, arts. 485 y 486', 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo_pr016.html'),
  ('a-donde-acudir-ministerio-y-derecho-de-peticion', 'Constitución Política de Colombia, art. 23', 'http://www.secretariasenado.gov.co/senado/basedoc/constitucion_politica_1991.html')
) as s(slug, label, url)
join public.legal_resources r on r.slug = s.slug
on conflict (resource_id, url) do nothing;
