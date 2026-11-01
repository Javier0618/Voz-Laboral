-- TuVozLaboral: guías, parte 5 — reformas y mundo del trabajo.
--
-- Redactada el 1 de noviembre de 2026. Amplía el foco más allá de pagos y
-- liquidaciones: reforma laboral, nuevas formas de trabajar y derechos
-- colectivos. Sigue la plantilla editorial de docs/editorial.md.
--
-- IMPORTANTE (flujo editorial, Fase 2.4):
-- 1. Todas las guías entran en «pendiente_verificacion»: NO son públicas
--    hasta que las revises y las publiques desde Moderación → Guías.
-- 2. Se redactaron sin acceso directo a los textos oficiales (el entorno de
--    trabajo no alcanza los portales del Senado, Función Pública ni
--    Colpensiones). Los datos se contrastaron con varias fuentes
--    secundarias. Antes de publicar, compara cada cifra, fecha y artículo con
--    el texto oficial y abre cada enlace de fuentes. Los puntos dudosos están
--    marcados con «(pendiente de verificación)» dentro del texto.
-- 3. Las guías nuevas solo enlazan a guías que ya existen en las partes 1 a 4,
--    para no dejar enlaces rotos mientras estén pendientes.
--
-- Es idempotente: se puede ejecutar varias veces sin duplicar nada.

begin;

insert into public.legal_resources (slug, title, summary, content, category_slug, status) values
(
  'reforma-laboral-ley-2466-que-cambio',
  'Reforma laboral de 2025: qué cambió para quienes trabajan',
  'La Ley 2466 de 2025 cambió el horario nocturno, los recargos de domingo, los contratos, los aprendices, el trabajo en plataformas y las licencias. Te contamos qué cambió y desde cuándo aplica.',
  $g$## Qué dice la ley
La Ley 2466 de 2025, conocida como la reforma laboral, se expidió el 25 de junio de 2025 y modificó decenas de artículos del Código Sustantivo del Trabajo (CST). No todo entró en vigor el mismo día: algunos cambios aplican desde su publicación y otros llegan por etapas hasta julio de 2027.

Los cambios más importantes para quienes trabajan:
- **Contrato indefinido como regla general.** Los trabajadores se vinculan, por regla general, con contrato a término indefinido. Los contratos a término fijo, por obra o labor y ocasionales siguen existiendo como excepción (art. 47 del CST).
- **Término fijo con tope.** El contrato a término fijo debe constar por escrito y no puede durar más de 4 años. Si no cumple esas condiciones, se entiende indefinido desde el inicio (art. 46 del CST). En los contratos que ya existían, los 4 años se cuentan desde que entró en vigor la ley.
- **Trabajo nocturno desde las 7:00 p. m.** Desde el 25 de diciembre de 2025, el trabajo diurno va de 6:00 a. m. a 7:00 p. m. y el nocturno de 7:00 p. m. a 6:00 a. m. (art. 160 del CST). El recargo nocturno sigue siendo del 35 %.
- **Más recargo por domingos y festivos.** Sube de forma gradual: 80 % desde el 1 de julio de 2025, 90 % desde el 1 de julio de 2026 y 100 % desde el 1 de julio de 2027 (art. 179 del CST).
- **Límite a las horas extra.** No pueden pasar de 2 al día ni de 12 a la semana, con excepciones para los sectores de seguridad y salud (art. 167A del CST).
- **Debido proceso antes de sancionar o despedir con justa causa.** El empleador debe informarte los hechos, dejarte presentar tus descargos y pruebas, y decidir de forma motivada (art. 115 del CST).
- **Aprendices con contrato laboral especial.** El contrato de aprendizaje pasa a ser un contrato laboral especial a término fijo, con apoyo de sostenimiento y seguridad social.
- **Repartidores de plataformas digitales.** Por primera vez la ley regula el trabajo de reparto en aplicaciones: quién es dependiente, quién es independiente y quién paga la seguridad social.
- **Nuevas licencias y permisos.** El art. 57 del CST amplía las licencias remuneradas, entre ellas el permiso para citas médicas y licencias relacionadas con la salud menstrual (pendiente de verificación: alcance exacto de cada licencia).
- **Cuota de empleo para personas con discapacidad.** Las empresas obligadas deben contratar o mantener al menos 2 trabajadores con discapacidad por cada 100 (pendiente de verificación: qué empresas están obligadas y desde cuándo se exige).

La jornada de 42 horas semanales no viene de esta reforma: es la última etapa de la Ley 2101 de 2021, que redujo la jornada de forma gradual. La reforma la incorporó al art. 161 del CST.

## En la práctica
Calendario de los cambios que más se notan en el día a día:
- **25 de junio de 2025:** entra en vigor la ley. Aplican, entre otros, las reglas de contratos, el debido proceso y el contrato de aprendizaje para los contratos nuevos.
- **1 de julio de 2025:** el recargo dominical y festivo sube al 80 %.
- **Julio de 2025:** la jornada máxima baja a 44 horas semanales (Ley 2101 de 2021).
- **25 de diciembre de 2025:** el trabajo nocturno empieza a las 7:00 p. m.
- **1 de julio de 2026:** el recargo dominical y festivo sube al 90 %.
- **Julio de 2026:** la jornada máxima llega a 42 horas semanales.
- **1 de julio de 2027:** el recargo dominical y festivo llega al 100 %.

Ejemplo: si trabajas de 2:00 p. m. a 10:00 p. m., antes de la reforma solo la última hora era nocturna (de 9:00 a 10:00 p. m.). Desde el 25 de diciembre de 2025, son nocturnas tres horas (de 7:00 a 10:00 p. m.), y cada una lleva el recargo del 35 %.

## Errores comunes
- **«La reforma me sube el sueldo automáticamente.»** No cambia el salario básico. Cambia cómo se pagan ciertas horas (nocturnas, domingos y festivos) y las condiciones del contrato.
- **«Mi contrato a término fijo se renueva para siempre.»** Ya no: superados los 4 años, el contrato se entiende a término indefinido.
- **«Si trabajo menos horas por la jornada de 42 horas, me pueden bajar el sueldo.»** La reducción de la jornada no puede afectar tu salario.
- **«Los cambios aplican desde el día que se aprobó la ley.»** Varios llegan por etapas: revisa la fecha de cada uno en el calendario de arriba.
- **«Todo lo que dicen las redes sobre la reforma es cierto.»** Hubo muchos proyectos y versiones antes de la ley final. Confía en el texto oficial o en guías que lo citen.

## Qué puedes hacer
1. Revisa tu desprendible de pago: desde el 25 de diciembre de 2025, las horas entre las 7:00 p. m. y las 9:00 p. m. deben aparecer como nocturnas.
2. Si trabajas domingos o festivos, comprueba que el recargo corresponde a la fecha (90 % desde el 1 de julio de 2026).
3. Si tienes contrato a término fijo, cuenta cuánto tiempo llevas: si superas los 4 años, pregunta por escrito a tu empleador cómo queda tu contrato.
4. Si te van a sancionar o despedir por una falta, pide por escrito los hechos y tu derecho a presentar descargos.
5. Si tu empleador no aplica los cambios, envíale un derecho de petición o acude al Ministerio del Trabajo.

> Importante: esta guía es orientativa. No sustituye la asesoría de un abogado ni una decisión del Ministerio del Trabajo.

## Herramientas y lecturas relacionadas
- [Jornada máxima, horas extra y recargos](/derechos/jornada-horas-extra-y-recargos)
- [Tipos de contrato de trabajo y período de prueba](/derechos/tipos-de-contrato-y-periodo-de-prueba)
- [Despido con y sin justa causa](/derechos/despido-con-y-sin-justa-causa)
- [Calculadora de nómina para cargos operativos](/calculadoras/operativos)
- [A dónde acudir: Ministerio del Trabajo y derecho de petición](/derechos/a-donde-acudir-ministerio-y-derecho-de-peticion)$g$,
  'contrato-condiciones',
  'pendiente_verificacion'
),
(
  'teletrabajo-trabajo-remoto-y-desconexion',
  'Teletrabajo, trabajo remoto, trabajo en casa y derecho a desconectarte',
  'En Colombia hay tres formas legales de trabajar fuera de la empresa, con reglas distintas. Y en todas tienes derecho a desconectarte fuera de tu horario.',
  $g$## Qué dice la ley
Trabajar fuera de las instalaciones del empleador no es una sola figura. La ley colombiana distingue tres:
- **Teletrabajo (Ley 1221 de 2008).** Trabajo a distancia usando tecnologías de la información, de forma habitual. Puede ser autónomo (siempre fuera de la empresa), suplementario (algunos días en casa y otros en la oficina) o móvil.
- **Trabajo en casa (Ley 2088 de 2021).** Es temporal y excepcional: se usa cuando hay circunstancias especiales que impiden ir al lugar de trabajo. No cambia tu contrato y debe acordarse por un tiempo determinado.
- **Trabajo remoto (Ley 2121 de 2021).** Toda la relación, desde la firma del contrato hasta su terminación, se hace a distancia. Está reglamentado por el Decreto 555 de 2022.

En las tres sigues siendo trabajador o trabajadora con todos los derechos: salario, prestaciones, seguridad social, jornada máxima y descansos.

**Desconexión laboral (Ley 2191 de 2022).** Tienes derecho a no tener contacto con el empleador por ningún medio —llamadas, correos, mensajes de chat— fuera de tu jornada, en vacaciones y en tus descansos. El empleador debe tener una política de desconexión laboral. La ley prevé excepciones, por ejemplo para cargos de dirección y confianza y para situaciones de fuerza mayor.

## En la práctica
- Si te mandan a trabajar desde casa, pregunta por escrito cuál de las tres figuras aplica: de eso dependen tus derechos y las obligaciones del empleador.
- En trabajo en casa, la Ley 2088 de 2021 prevé un auxilio de conectividad digital en lugar del auxilio de transporte para quienes ganan hasta 2 salarios mínimos (pendiente de verificación: condiciones vigentes).
- En teletrabajo, el empleador debe tener en cuenta los equipos y los costos del trabajo a distancia, y debe afiliarte a riesgos laborales también para el trabajo que haces desde casa.
- Los mensajes de trabajo a las 10:00 p. m. o en tus vacaciones no son una obligación: no tienes que responderlos, salvo las excepciones de la ley.

## Errores comunes
- **«Si trabajo desde casa, no tengo horario.»** La jornada máxima se aplica igual: 42 horas semanales. Si trabajas más, son horas extra.
- **«Como no voy a la oficina, no tengo ARL.»** Sigues afiliado a riesgos laborales. Un accidente durante el trabajo en casa puede ser accidente de trabajo.
- **«Trabajo en casa y teletrabajo son lo mismo.»** El trabajo en casa es temporal y excepcional; el teletrabajo es una forma permanente de organizar el trabajo.
- **«Si no contesto fuera de horario, me pueden sancionar.»** No responder fuera de la jornada está protegido por la ley de desconexión, salvo las excepciones que ella misma prevé.

## Qué puedes hacer
1. Pide por escrito las condiciones de tu trabajo a distancia: figura, horario, equipos y forma de comunicación.
2. Pregunta por la política de desconexión laboral de tu empresa.
3. Guarda evidencia (capturas con fecha y hora) si te exigen trabajar o responder de forma habitual fuera de tu jornada.
4. Si no se respetan tus derechos, presenta un derecho de petición a tu empleador o una queja ante el Ministerio del Trabajo.

> Importante: esta guía es orientativa. No sustituye la asesoría de un abogado ni una decisión del Ministerio del Trabajo.

## Herramientas y lecturas relacionadas
- [Jornada máxima, horas extra y recargos](/derechos/jornada-horas-extra-y-recargos)
- [Accidente de trabajo y enfermedad laboral](/derechos/accidente-de-trabajo-y-enfermedad-laboral)
- [Calculadora de nómina para administrativos](/calculadoras/administrativos)
- [A dónde acudir: Ministerio del Trabajo y derecho de petición](/derechos/a-donde-acudir-ministerio-y-derecho-de-peticion)$g$,
  'jornadas-descansos',
  'pendiente_verificacion'
),
(
  'plataformas-digitales-de-reparto',
  'Repartidores de plataformas digitales: qué dice la reforma laboral',
  'La Ley 2466 de 2025 reguló por primera vez el trabajo de reparto en aplicaciones: cuándo eres dependiente o independiente y quién paga la seguridad social.',
  $g$## Qué dice la ley
La reforma laboral (Ley 2466 de 2025) incluyó un capítulo sobre el trabajo en plataformas digitales de reparto, como las aplicaciones de domicilios. Distingue dos situaciones:
- **Repartidor dependiente.** Si la relación cumple los elementos de un contrato de trabajo (prestación personal, subordinación y pago), la plataforma es empleadora y te aplica el régimen laboral ordinario: salario, prestaciones y seguridad social completa.
- **Repartidor independiente o autónomo.** Si trabajas con autonomía, sigues siendo independiente, pero la ley reparte el costo de la seguridad social: la base de cotización es el 40 % de tus ingresos; la plataforma paga el 60 % de los aportes a salud y pensión, y tú el 40 % restante. Los aportes a riesgos laborales los paga la plataforma.

La ley también exige transparencia sobre cómo los algoritmos asignan pedidos y evalúan tu trabajo, y que puedas pedir la revisión humana de decisiones automatizadas que te afecten (pendiente de verificación: alcance exacto de estas obligaciones).

## En la práctica
- El Gobierno expidió el Decreto 0991 del 4 de agosto de 2026 para reglamentar la afiliación y los aportes de los repartidores independientes. Hay discusión pública sobre si el decreto se ajusta a la ley, en especial sobre la base mínima de cotización. Revisa si sigue vigente o si cambió antes de tomar decisiones (pendiente de verificación).
- Cuál es tu caso (dependiente o independiente) depende de cómo trabajas en realidad, no de lo que diga la aplicación. Si te imponen horarios, zonas y sanciones como a un empleado, podría existir un contrato de trabajo.
- La plataforma debe reportar tus aportes. Puedes consultar tu historial en tu EPS, tu fondo de pensiones y tu ARL.

## Errores comunes
- **«Como uso una app, nunca soy trabajador.»** La ley mira la realidad de la relación. Si hay subordinación, hay contrato de trabajo.
- **«Si tengo un accidente repartiendo, no tengo cobertura.»** La plataforma debe pagar tu afiliación a riesgos laborales. Confirma que estás afiliado.
- **«Pago la seguridad social completa por mi cuenta.»** Si eres independiente, la ley pone parte de los aportes a cargo de la plataforma.

## Qué puedes hacer
1. Revisa en tu EPS, fondo de pensiones y ARL que aparezcan los aportes de la plataforma.
2. Guarda capturas de tus pedidos, pagos, horarios y bloqueos o sanciones de la aplicación.
3. Si crees que eres dependiente, o si la plataforma no paga lo que le toca, presenta un derecho de petición a la empresa o una queja ante el Ministerio del Trabajo.

> Importante: esta guía es orientativa. No sustituye la asesoría de un abogado ni una decisión del Ministerio del Trabajo.

## Herramientas y lecturas relacionadas
- [Cuándo existe un contrato de trabajo](/derechos/cuando-existe-contrato-de-trabajo)
- [Seguridad social: EPS, pensión, ARL y caja de compensación](/derechos/seguridad-social-eps-pension-arl-y-caja)
- [Calculadora para contratos de prestación de servicios](/calculadoras/prestacion-servicios)
- [A dónde acudir: Ministerio del Trabajo y derecho de petición](/derechos/a-donde-acudir-ministerio-y-derecho-de-peticion)$g$,
  'contrato-condiciones',
  'pendiente_verificacion'
),
(
  'contrato-de-aprendizaje-sena',
  'Aprendices SENA y contrato de aprendizaje después de la reforma',
  'Con la reforma laboral, el contrato de aprendizaje es un contrato laboral especial: tienes apoyo de sostenimiento, seguridad social y los derechos de cualquier trabajador.',
  $g$## Qué dice la ley
La Ley 2466 de 2025 modificó el contrato de aprendizaje (art. 81 del CST). Ahora es un **contrato laboral especial a término fijo**, con una duración máxima de 3 años, en el que el aprendiz se forma y la empresa le paga un apoyo de sostenimiento.

El apoyo de sostenimiento, según las fuentes consultadas y la Circular 0083 de 2025 del Ministerio del Trabajo (pendiente de verificación con el texto oficial):
- **Etapa lectiva:** como mínimo el 75 % de un salario mínimo.
- **Etapa práctica:** como mínimo el 100 % de un salario mínimo.
- **Formación dual:** 75 % el primer año y 100 % el segundo.
- **Estudiantes universitarios:** nunca menos de un salario mínimo.

En la etapa lectiva, el empleador paga la afiliación a salud y a riesgos laborales. En la etapa práctica se suma la pensión, como para cualquier trabajador.

## En la práctica
- Los contratos de aprendizaje firmados desde el 25 de junio de 2025 se rigen por las reglas nuevas.
- Como aprendiz tienes los derechos de un trabajador: jornada máxima, descansos, seguridad social y trato digno.
- Las empresas obligadas a tener una cuota de aprendices pueden cumplirla contratándolos o, en algunos casos, pagando una cuota al SENA.

## Errores comunes
- **«El aprendiz no es trabajador.»** Con la reforma, el contrato de aprendizaje es un contrato laboral especial.
- **«En la etapa práctica me pueden pagar menos del mínimo.»** En la etapa práctica el apoyo es, como mínimo, un salario mínimo.
- **«No tengo ARL porque estoy en formación.»** El empleador debe afiliarte a riesgos laborales desde la etapa lectiva.

## Qué puedes hacer
1. Pide copia de tu contrato de aprendizaje y revisa la etapa, la duración y el valor del apoyo.
2. Revisa que estés afiliado a salud y a riesgos laborales (y a pensión en la etapa práctica).
3. Si algo no cuadra, habla primero con tu empresa y con tu centro de formación. Si no se resuelve, acude al Ministerio del Trabajo.

> Importante: esta guía es orientativa. No sustituye la asesoría de un abogado ni una decisión del Ministerio del Trabajo.

## Herramientas y lecturas relacionadas
- [Tipos de contrato de trabajo y período de prueba](/derechos/tipos-de-contrato-y-periodo-de-prueba)
- [Seguridad social: EPS, pensión, ARL y caja de compensación](/derechos/seguridad-social-eps-pension-arl-y-caja)
- [Calculadora de salario neto](/calculadoras/salario-neto)$g$,
  'contrato-condiciones',
  'pendiente_verificacion'
),
(
  'sindicatos-asociacion-y-huelga',
  'Sindicatos, negociación colectiva y huelga: tus derechos',
  'Puedes crear un sindicato o afiliarte a uno sin pedir permiso, negociar colectivamente y, salvo en servicios públicos esenciales, ir a huelga. Te contamos cómo te protege la ley.',
  $g$## Qué dice la ley
La Constitución reconoce tres derechos colectivos del trabajo:
- **Asociación sindical (art. 39).** Trabajadores y empleadores pueden formar sindicatos o asociaciones sin intervención del Estado.
- **Negociación colectiva (art. 55).** Se garantiza el derecho a negociar las condiciones de trabajo, con las excepciones que señale la ley.
- **Huelga (art. 56).** Se garantiza el derecho de huelga, salvo en los servicios públicos esenciales definidos por el legislador.

El Código Sustantivo del Trabajo desarrolla estos derechos:
- Para fundar un sindicato de trabajadores se necesitan al menos 25 afiliados (art. 359 del CST).
- Está prohibido que el empleador impida o perturbe el ejercicio del derecho de asociación, por ejemplo despidiendo o desmejorando a alguien por afiliarse o por crear un sindicato. Hacerlo puede acarrear multas (art. 354 del CST).
- El **fuero sindical** protege a fundadores y directivos: no pueden ser despedidos, desmejorados ni trasladados sin justa causa calificada antes por un juez (art. 405 del CST).
- La huelga es la suspensión colectiva, temporal y pacífica del trabajo para defender intereses económicos y profesionales. Debe seguir el procedimiento de la ley (art. 429 del CST).

## En la práctica
- Afiliarte a un sindicato es una decisión libre: no necesitas permiso del empleador y no te pueden obligar a afiliarte ni a desafiliarte.
- Los acuerdos que logra un sindicato (convenciones colectivas) pueden mejorar salarios, horarios y beneficios por encima del mínimo legal.
- Si no hay sindicato, los trabajadores no sindicalizados también pueden presentar pliegos de peticiones en algunos casos (pendiente de verificación: requisitos actuales).

## Errores comunes
- **«Si me afilio, me pueden despedir.»** Despedir a alguien por afiliarse es una violación del derecho de asociación.
- **«El sindicato solo sirve en empresas grandes.»** Existen sindicatos de empresa, de industria y de oficio; puedes afiliarte a uno de industria aunque tu empresa sea pequeña.
- **«Cualquier paro es una huelga legal.»** La huelga tiene un procedimiento y no se permite en servicios públicos esenciales.

## Qué puedes hacer
1. Infórmate sobre los sindicatos de tu sector o de tu empresa y sus estatutos.
2. Si te presionan o sancionan por afiliarte, guarda evidencia (mensajes, correos, cambios de funciones) y denúncialo ante el Ministerio del Trabajo.
3. Si eres fundador o directivo sindical y te despiden sin autorización judicial, busca asesoría de inmediato: los plazos para reclamar son cortos.

> Importante: esta guía es orientativa. No sustituye la asesoría de un abogado ni una decisión del Ministerio del Trabajo.

## Herramientas y lecturas relacionadas
- [Estabilidad laboral reforzada: cuándo no pueden despedirte](/derechos/estabilidad-laboral-reforzada)
- [Igualdad y no discriminación en el trabajo](/derechos/igualdad-y-no-discriminacion)
- [A dónde acudir: Ministerio del Trabajo y derecho de petición](/derechos/a-donde-acudir-ministerio-y-derecho-de-peticion)$g$,
  'otras',
  'pendiente_verificacion'
)
on conflict (slug) do nothing;

-- Fuentes oficiales. Abre cada enlace antes de publicar: el entorno de
-- redacción no pudo comprobarlos.
insert into public.legal_resource_sources (resource_id, label, publisher, url, accessed_at)
select r.id, s.label, s.publisher, s.url, date '2026-11-01'
from (values
  ('reforma-laboral-ley-2466-que-cambio', 'Ley 2466 de 2025 (reforma laboral)', 'Departamento Administrativo de la Función Pública',
    'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=260676'),
  ('reforma-laboral-ley-2466-que-cambio', 'Ley 2466 de 2025, texto compilado', 'Colpensiones, compilación normativa',
    'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/ley_2466_2025.htm'),
  ('reforma-laboral-ley-2466-que-cambio', 'Ley 2101 de 2021 (reducción de la jornada)', 'Secretaría General del Senado de la República',
    'http://www.secretariasenado.gov.co/senado/basedoc/ley_2101_2021.html'),

  ('teletrabajo-trabajo-remoto-y-desconexion', 'Ley 1221 de 2008 (teletrabajo)', 'Secretaría General del Senado de la República',
    'http://www.secretariasenado.gov.co/senado/basedoc/ley_1221_2008.html'),
  ('teletrabajo-trabajo-remoto-y-desconexion', 'Ley 2088 de 2021 (trabajo en casa)', 'Secretaría General del Senado de la República',
    'http://www.secretariasenado.gov.co/senado/basedoc/ley_2088_2021.html'),
  ('teletrabajo-trabajo-remoto-y-desconexion', 'Ley 2121 de 2021 (trabajo remoto)', 'Secretaría General del Senado de la República',
    'http://www.secretariasenado.gov.co/senado/basedoc/ley_2121_2021.html'),
  ('teletrabajo-trabajo-remoto-y-desconexion', 'Ley 2191 de 2022 (desconexión laboral)', 'Secretaría General del Senado de la República',
    'http://www.secretariasenado.gov.co/senado/basedoc/ley_2191_2022.html'),

  ('plataformas-digitales-de-reparto', 'Ley 2466 de 2025 (trabajo en plataformas digitales de reparto)', 'Departamento Administrativo de la Función Pública',
    'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=260676'),
  ('plataformas-digitales-de-reparto', 'Decreto 0991 de 2026 (aportes de repartidores independientes)', 'Colpensiones, compilación normativa',
    'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/decreto_0991_2026.htm'),

  ('contrato-de-aprendizaje-sena', 'Ley 2466 de 2025 (modifica el art. 81 del CST)', 'Departamento Administrativo de la Función Pública',
    'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=260676'),

  ('sindicatos-asociacion-y-huelga', 'Constitución Política de Colombia, arts. 39, 55 y 56', 'Secretaría General del Senado de la República',
    'http://www.secretariasenado.gov.co/senado/basedoc/constitucion_politica_1991.html'),
  ('sindicatos-asociacion-y-huelga', 'Código Sustantivo del Trabajo, segunda parte (derecho colectivo)', 'Secretaría General del Senado de la República',
    'http://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo.html')
) as s(slug, label, publisher, url)
join public.legal_resources r on r.slug = s.slug
on conflict (resource_id, url) do nothing;

commit;
