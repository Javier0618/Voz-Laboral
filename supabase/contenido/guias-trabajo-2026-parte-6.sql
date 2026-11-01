-- TuVozLaboral: guías, parte 6 — verificación contra el texto oficial.
--
-- 1 de noviembre de 2026. Las cinco guías de la parte 5 se contrastaron con
-- los textos oficiales compilados por Colpensiones (Ley 2466 de 2025, Leyes
-- 1221 de 2008, 2088 de 2021, 2121 de 2021 y 2191 de 2022, Decreto 0991 de
-- 2026, Constitución y Código Sustantivo del Trabajo). Se corrigen y se
-- quitan las marcas «pendiente de verificación». Cambios principales:
--   - Plataformas: las reglas rigen 12 meses después de la reglamentación
--     (art. 67 Ley 2466) y se resume lo que dice el Decreto 0991 de 2026.
--   - Reforma laboral: licencias del art. 57 num. 6 tal como quedaron (no hay
--     una «licencia menstrual» como tal), cuota de discapacidad, artículos de
--     la ley, debido proceso y prescripción.
--   - Teletrabajo: modalidades de la Ley 2466 y auxilio de conectividad.
--   - Aprendices y sindicatos: datos confirmados y precisados.
--
-- Solo se reescribe una guía si su texto sigue igual al de la parte 5. Si la
-- editaste desde Moderación, se deja intacta y se muestra un aviso (NOTICE).
--
-- 2. Nueva guía «Reforma pensional», en «pendiente_verificacion»: NO es
--    pública hasta que la revises y la publiques desde Moderación → Guías.
--
-- Es idempotente: se puede ejecutar varias veces.

begin;

-- reforma-laboral-ley-2466-que-cambio
update public.legal_resources
   set content = $c$## Qué dice la ley
La Ley 2466 de 2025, conocida como la reforma laboral, se publicó en el Diario Oficial el 25 de junio de 2025 y rige desde su promulgación (art. 70). Modificó decenas de artículos del Código Sustantivo del Trabajo (CST) y de otras leyes laborales. No todo entró en vigor el mismo día: algunos cambios llegan por etapas hasta julio de 2027 y otros dependen de que el Gobierno los reglamente.

Los cambios más importantes para quienes trabajan:
- **Contrato indefinido como regla general (art. 5).** Por regla general, los trabajadores se vinculan con contrato a término indefinido. Los contratos a término fijo, por obra o labor y ocasionales siguen existiendo como excepción (art. 47 del CST).
- **Término fijo con tope (art. 6).** El contrato a término fijo debe hacerse por escrito y no puede durar más de 4 años, contando las prórrogas. Si no cumple esas condiciones, se entiende celebrado a término indefinido desde el inicio. En los contratos que ya existían, los 4 años se cuentan desde que entró en vigor la ley (art. 46 del CST). El contrato por obra o labor también debe hacerse por escrito y describir la obra con precisión.
- **Debido proceso antes de sancionar (art. 7).** Antes de una sanción disciplinaria, el empleador debe comunicarte por escrito la apertura del proceso y los hechos, darte las pruebas, concederte al menos 5 días para defenderte, decidir de forma motivada y permitirte impugnar la decisión (art. 115 del CST). En el trabajo doméstico y en empresas de menos de 10 trabajadores basta con escucharte antes, respetando tu derecho de defensa.
- **Trabajo nocturno desde las 7:00 p. m. (art. 10).** El trabajo diurno va de 6:00 a. m. a 7:00 p. m. y el nocturno de 7:00 p. m. a 6:00 a. m. (art. 160 del CST). Este cambio empezó a regir 6 meses después de la sanción de la ley, el 25 de diciembre de 2025. El recargo nocturno sigue siendo del 35 %.
- **Jornada de 42 horas (art. 11).** La jornada máxima es de 8 horas diarias y 42 semanales, repartidas de común acuerdo entre 5 y 6 días, sin afectar el salario (art. 161 del CST). La reducción gradual viene de la Ley 2101 de 2021.
- **Límite a las horas extra (art. 13).** No pueden pasar de 2 al día ni de 12 a la semana, salvo en los sectores de seguridad y salud. Además, el empleador debe llevar un registro de las horas extra y entregarte una relación si la pides (art. 12).
- **Más recargo por domingos y festivos (art. 14).** El recargo llega al 100 % de forma gradual: 80 % desde el 1 de julio de 2025, 90 % desde el 1 de julio de 2026 y 100 % desde el 1 de julio de 2027 (art. 179 del CST).
- **Licencias remuneradas (art. 15).** Se amplían los permisos del art. 57 del CST: citas médicas de urgencia o con especialistas, incluido el diagnóstico y tratamiento de la endometriosis; obligaciones escolares como acudiente; citaciones judiciales, administrativas y legales. También se puede acordar 1 día de descanso remunerado por cada 6 meses si vas al trabajo en bicicleta.
- **Inclusión de personas con discapacidad (art. 15).** Las empresas deben contratar o mantener al menos 2 trabajadores con discapacidad por cada 100 trabajadores permanentes, y 1 más por cada tramo adicional de 100 si tienen más de 500. Fue optativo el primer año de vigencia de la ley y es obligatorio desde el segundo.
- **No discriminación y acoso (arts. 16 a 18).** Se prohíbe, entre otras cosas, despedir o presionar la renuncia por enfermedad o por afectaciones a la salud mental, y se protege frente a la violencia y el acoso en el mundo del trabajo, también en las comunicaciones digitales.
- **Aprendices con contrato laboral especial (art. 21).** El contrato de aprendizaje pasa a ser un contrato laboral especial a término fijo, de hasta 3 años, con apoyo de sostenimiento y seguridad social.
- **Repartidores de plataformas digitales (arts. 24 a 30).** La ley regula por primera vez el trabajo de reparto en aplicaciones. Ojo: estas reglas comienzan a regir 12 meses después de que el Gobierno cumpla con su reglamentación (art. 67).
- **Trabajo doméstico (art. 33).** Debe pactarse con contrato de trabajo escrito y registrarse en la planilla de aportes (PILA).
- **Trabajadores migrantes (art. 37).** Tu situación migratoria no impide exigir tus garantías laborales y de seguridad social.
- **Teletrabajo (arts. 52 a 54).** Se redefinen sus modalidades (autónomo, móvil, híbrido, transnacional y temporal) y se crea un auxilio de conectividad en lugar del auxilio de transporte para quienes ganan menos de 2 salarios mínimos.
- **Prescripción (art. 62).** Los derechos laborales prescriben en 3 años, contados desde que la obligación se hace exigible (art. 488 del CST).

## En la práctica
Calendario de los cambios que más se notan en el día a día:
- **25 de junio de 2025:** entra en vigor la ley. Aplican, entre otras, las reglas de contratos, el debido proceso y el contrato de aprendizaje.
- **1 de julio de 2025:** el recargo por trabajar en el día de descanso o en festivo sube al 80 %.
- **Julio de 2025:** la jornada máxima baja a 44 horas semanales (Ley 2101 de 2021).
- **25 de diciembre de 2025:** el trabajo nocturno empieza a las 7:00 p. m.
- **25 de junio de 2026:** la cuota de contratación de personas con discapacidad pasa a ser obligatoria.
- **1 de julio de 2026:** el recargo por día de descanso o festivo sube al 90 %.
- **Julio de 2026:** la jornada máxima llega a 42 horas semanales.
- **1 de julio de 2027:** el recargo por día de descanso o festivo llega al 100 %.

Ejemplo: si trabajas de 2:00 p. m. a 10:00 p. m., antes de la reforma solo la última hora era nocturna (de 9:00 a 10:00 p. m.). Desde el 25 de diciembre de 2025 son nocturnas tres horas (de 7:00 a 10:00 p. m.), y cada una lleva el recargo del 35 %.

## Errores comunes
- **«La reforma me sube el sueldo automáticamente.»** No cambia el salario básico. Cambia cómo se pagan ciertas horas (nocturnas, días de descanso y festivos) y las condiciones del contrato.
- **«Mi contrato a término fijo se puede renovar para siempre.»** Ya no: el total no puede superar 4 años.
- **«Si me reducen la jornada a 42 horas, me pueden bajar el sueldo.»** La reducción de la jornada no puede afectar tu salario.
- **«Me pueden sancionar sin escucharme.»** La ley exige un procedimiento previo, con hechos por escrito y plazo para defenderte.
- **«Las reglas de los repartidores ya se aplican.»** Dependen de la reglamentación del Gobierno y empiezan 12 meses después de que se complete.

## Qué puedes hacer
1. Revisa tu desprendible de pago: desde el 25 de diciembre de 2025, las horas entre las 7:00 p. m. y las 9:00 p. m. deben aparecer como nocturnas.
2. Si trabajas domingos o festivos, comprueba que el recargo corresponda a la fecha (90 % desde el 1 de julio de 2026).
3. Si haces horas extra, pide por escrito la relación de horas que el empleador debe llevar.
4. Si tienes contrato a término fijo, suma cuánto tiempo llevas con prórrogas: el límite es de 4 años.
5. Si te abren un proceso disciplinario, pide por escrito los hechos y las pruebas, y usa el plazo para presentar tus descargos.
6. Si tu empleador no aplica los cambios, envíale un derecho de petición o acude al Ministerio del Trabajo.

> Importante: esta guía es orientativa. No sustituye la asesoría de un abogado ni una decisión del Ministerio del Trabajo.

## Herramientas y lecturas relacionadas
- [Jornada máxima, horas extra y recargos](/derechos/jornada-horas-extra-y-recargos)
- [Tipos de contrato de trabajo y período de prueba](/derechos/tipos-de-contrato-y-periodo-de-prueba)
- [Licencias remuneradas que el empleador debe conceder](/derechos/licencias-remuneradas)
- [Despido con y sin justa causa](/derechos/despido-con-y-sin-justa-causa)
- [Calculadora de nómina para cargos operativos](/calculadoras/operativos)
- [A dónde acudir: Ministerio del Trabajo y derecho de petición](/derechos/a-donde-acudir-ministerio-y-derecho-de-peticion)$c$,
       last_verified_at = date '2026-11-01'
 where slug = 'reforma-laboral-ley-2466-que-cambio' and md5(replace(content, E'\r\n', E'\n')) = '71356a2cc928924b31f89055a9ffa0c2';

-- teletrabajo-trabajo-remoto-y-desconexion
update public.legal_resources
   set content = $c$## Qué dice la ley
Trabajar fuera de las instalaciones del empleador no es una sola figura. La ley colombiana distingue tres:
- **Teletrabajo (Ley 1221 de 2008, modificada por la Ley 2466 de 2025).** Es una modalidad laboral en la que trabajas con tecnologías de la información, sin estar en un sitio fijo de la empresa. La reforma laboral definió cinco formas: **autónomo** (trabajas de forma permanente desde tu casa u otro lugar y solo vas a la empresa en ocasiones), **móvil** (sin lugar de trabajo fijo), **híbrido** (mínimo dos o tres días a la semana en casa y el resto en la empresa), **transnacional** (con contrato celebrado en Colombia, trabajas desde otro país) y **temporal o emergente** (para emergencias sanitarias o desastres).
- **Trabajo en casa (Ley 2088 de 2021).** Es transitorio: se usa cuando circunstancias ocasionales, excepcionales o especiales impiden ir al lugar de trabajo. No cambia tu contrato ni puede desmejorar tus condiciones. Dura hasta 3 meses, prorrogables una vez por otros 3, o mientras persistan esas circunstancias (art. 7).
- **Trabajo remoto (Ley 2121 de 2021).** Toda la relación laboral, desde el inicio hasta la terminación, se hace a distancia, sin que empleador y trabajador interactúen físicamente. Está reglamentado por el Decreto 555 de 2022.

En las tres sigues siendo trabajador o trabajadora con todos los derechos: salario, prestaciones, seguridad social, jornada máxima y descansos.

**Auxilio de conectividad.**
- En **teletrabajo**, si ganas menos de 2 salarios mínimos, el empleador debe pagarte un auxilio de conectividad en lugar del auxilio de transporte, por el mismo valor. No se pagan los dos (art. 6A de la Ley 1221 de 2008, creado por el art. 53 de la Ley 2466 de 2025).
- En **trabajo en casa**, si ganas hasta 2 salarios mínimos y te corresponde auxilio de transporte, ese pago se reconoce como auxilio de conectividad digital mientras dure el trabajo en casa (art. 10 de la Ley 2088 de 2021).

**Desconexión laboral (Ley 2191 de 2022).** Tienes derecho a no tener contacto con el empleador, por ningún medio, para asuntos de trabajo fuera de tu jornada, en vacaciones ni en tus descansos (art. 3). Toda empresa debe tener una política de desconexión laboral con un procedimiento de quejas, incluso anónimas (art. 5). No aplica a cargos de dirección, confianza y manejo; a quienes por su función deben estar disponibles de forma permanente, como la fuerza pública y los organismos de socorro; ni a situaciones de fuerza mayor o caso fortuito que lo justifiquen (art. 6).

## En la práctica
- Si te mandan a trabajar desde casa, pregunta por escrito cuál de las tres figuras aplica: de eso dependen tus derechos y las obligaciones del empleador.
- La jornada máxima se aplica igual: 42 horas semanales. Si trabajas más, son horas extra.
- Sigues afiliado a riesgos laborales. En teletrabajo transnacional, la ARL debe cubrir los accidentes y enfermedades laborales en el país donde trabajes, y el empleador debe tener un seguro que cubra al menos la atención en salud.
- Los mensajes de trabajo a las 10:00 p. m. o en vacaciones no son una obligación: salvo las excepciones de la ley, no tienes que responderlos.

## Errores comunes
- **«Si trabajo desde casa, no tengo horario.»** La jornada máxima y las horas extra aplican igual.
- **«Como no voy a la oficina, no tengo ARL.»** Sigues afiliado. Un accidente durante el trabajo a distancia puede ser accidente de trabajo.
- **«Trabajo en casa y teletrabajo son lo mismo.»** El trabajo en casa es transitorio; el teletrabajo es una modalidad permanente de organizar el trabajo.
- **«Si no contesto fuera de horario, me pueden sancionar.»** No responder fuera de la jornada está protegido por la ley de desconexión, salvo sus excepciones.
- **«Si trabajo desde casa, pierdo el auxilio de transporte sin nada a cambio.»** Si ganas menos de 2 salarios mínimos, se reemplaza por el auxilio de conectividad.

## Qué puedes hacer
1. Pide por escrito las condiciones de tu trabajo a distancia: figura, horario, equipos y forma de comunicación.
2. Revisa en tu desprendible que aparezca el auxilio de transporte o el de conectividad, si te corresponde.
3. Pregunta por la política de desconexión laboral de tu empresa y usa su canal de quejas.
4. Guarda evidencia (capturas con fecha y hora) si te exigen trabajar o responder fuera de tu jornada de forma habitual.
5. Si no se respeta tu derecho a la desconexión, puedes informarlo al inspector de trabajo con una prueba sumaria de los hechos (art. 7 de la Ley 2191 de 2022).

> Importante: esta guía es orientativa. No sustituye la asesoría de un abogado ni una decisión del Ministerio del Trabajo.

## Herramientas y lecturas relacionadas
- [Jornada máxima, horas extra y recargos](/derechos/jornada-horas-extra-y-recargos)
- [Accidente de trabajo y enfermedad laboral](/derechos/accidente-de-trabajo-y-enfermedad-laboral)
- [Salario mínimo, auxilio de transporte y dotación](/derechos/salario-minimo-auxilio-de-transporte-y-dotacion)
- [Calculadora de nómina para administrativos](/calculadoras/administrativos)
- [A dónde acudir: Ministerio del Trabajo y derecho de petición](/derechos/a-donde-acudir-ministerio-y-derecho-de-peticion)$c$,
       summary = $s$Teletrabajo, trabajo en casa y trabajo remoto tienen reglas distintas. En todas tienes derecho a desconectarte fuera de tu horario y, si ganas menos de 2 salarios mínimos, a un auxilio de conectividad.$s$,
       last_verified_at = date '2026-11-01'
 where slug = 'teletrabajo-trabajo-remoto-y-desconexion' and md5(replace(content, E'\r\n', E'\n')) = '8abaacafffb501a4f8e81f66b5b7ec97';

-- plataformas-digitales-de-reparto
update public.legal_resources
   set content = $c$## Qué dice la ley
La reforma laboral (Ley 2466 de 2025, arts. 24 a 30) reguló por primera vez el trabajo de reparto en aplicaciones, como las de domicilios. **Estas reglas comienzan a regir 12 meses después de que el Gobierno cumpla con la reglamentación e implementación que la ley le ordena (art. 67).** Por eso, algunas pueden no estar aplicándose todavía.

La ley distingue dos modalidades (art. 25):
- **Repartidor dependiente y subordinado.** Se aplican las reglas generales del Código Sustantivo del Trabajo: la plataforma es empleadora y paga la seguridad social en las proporciones normales. Se permiten cotizaciones a tiempo parcial (art. 27).
- **Repartidor independiente y autónomo.** Sigues siendo independiente, pero con protecciones especiales:
  - La plataforma paga el 60 % de los aportes a salud y pensión, y tú el 40 %.
  - Los riesgos laborales están a cargo exclusivo de la plataforma.
  - La base de cotización es el 40 % de lo que recibes por la plataforma (art. 27).
  - No se pueden pactar cláusulas de exclusividad, y la plataforma debe garantizar tu derecho al descanso (art. 25, parágrafo).

En cualquier caso se aplica la **primacía de la realidad**: si en la práctica hay subordinación, hay contrato de trabajo, diga lo que diga la aplicación (art. 25).

La plataforma también debe:
- Explicarte en lenguaje sencillo qué modalidad tienes.
- Avisarte antes de cualquier cambio importante en tus condiciones, con sus motivos (art. 25).
- Entregarte cada mes el reporte de tus horas de servicio efectivo (art. 27).
- Informarte sobre los sistemas automatizados que supervisan tu trabajo y someter a supervisión humana las decisiones que esos sistemas toman o apoyan (arts. 29 y 30).

## En la práctica
El Decreto 0991 del 4 de agosto de 2026 reglamentó la afiliación y los aportes de los repartidores independientes y autónomos. Según su texto:
- **Si tus ingresos en la plataforma son menores a un salario mínimo:**
  - no se cotiza a salud en el régimen contributivo; conservas el régimen subsidiado o tu calidad de beneficiario, si cumples los requisitos;
  - la pensión se cotiza por tramos proporcionales a tus ingresos (de una a cuatro semanas al mes);
  - la plataforma paga el 100 % de los riesgos laborales.
- **Si trabajas en varias plataformas,** cada una liquida y paga los aportes de los ingresos que recibes a través de ella.
- **Si tienes un accidente,** la plataforma debe reportarlo a la ARL, y tú también puedes informarlo por los canales de la aplicación.

El decreto prevé un periodo de alistamiento tecnológico, y su aplicación ha generado debate público. Antes de tomar decisiones, consulta su estado actual en el Ministerio del Trabajo.

## Errores comunes
- **«Como uso una app, nunca soy trabajador.»** La ley mira la realidad de la relación. Si hay subordinación, hay contrato de trabajo.
- **«Si tengo un accidente repartiendo, no tengo cobertura.»** Con la reforma, los riesgos laborales de los repartidores independientes están a cargo de la plataforma. Confirma tu afiliación a la ARL.
- **«Pago toda la seguridad social por mi cuenta.»** Si eres independiente, la ley pone el 60 % de salud y pensión a cargo de la plataforma.
- **«La app me puede exigir exclusividad.»** En la modalidad independiente están prohibidas las cláusulas de exclusividad.

## Qué puedes hacer
1. Revisa en la aplicación qué modalidad te asignaron y guarda los términos y condiciones.
2. Consulta en tu ARL y en tu fondo de pensiones que aparezcan los aportes de la plataforma.
3. Guarda capturas de tus pedidos, pagos, horarios, bloqueos o sanciones de la aplicación.
4. Si crees que en realidad eres dependiente, o si la plataforma no paga lo que le corresponde, presenta un derecho de petición a la empresa o una queja ante el Ministerio del Trabajo.

> Importante: esta guía es orientativa. No sustituye la asesoría de un abogado ni una decisión del Ministerio del Trabajo.

## Herramientas y lecturas relacionadas
- [Cuándo existe un contrato de trabajo](/derechos/cuando-existe-contrato-de-trabajo)
- [Seguridad social: EPS, pensión, ARL y caja de compensación](/derechos/seguridad-social-eps-pension-arl-y-caja)
- [Accidente de trabajo y enfermedad laboral](/derechos/accidente-de-trabajo-y-enfermedad-laboral)
- [Calculadora para contratos de prestación de servicios](/calculadoras/prestacion-servicios)
- [A dónde acudir: Ministerio del Trabajo y derecho de petición](/derechos/a-donde-acudir-ministerio-y-derecho-de-peticion)$c$,
       summary = $s$La reforma laboral reguló el trabajo de reparto en aplicaciones: cuándo eres dependiente o independiente, quién paga la seguridad social y desde cuándo se aplica.$s$,
       last_verified_at = date '2026-11-01'
 where slug = 'plataformas-digitales-de-reparto' and md5(replace(content, E'\r\n', E'\n')) = '96186e86ed5a83607dc049b8e0b32b66';

-- contrato-de-aprendizaje-sena
update public.legal_resources
   set content = $c$## Qué dice la ley
La Ley 2466 de 2025 (art. 21) modificó el art. 81 del CST. El contrato de aprendizaje es ahora un **contrato laboral especial y a término fijo**, que se rige por el Código Sustantivo del Trabajo, con una duración máxima de 3 años. El aprendiz se forma en una entidad autorizada (el SENA u otra institución reconocida) y la empresa patrocinadora le paga un apoyo de sostenimiento mensual.

El apoyo de sostenimiento mínimo es:
- **Formación tradicional:** el 75 % de un salario mínimo en la fase lectiva y el 100 % en la fase práctica.
- **Formación dual:** el 75 % de un salario mínimo el primer año y el 100 % el segundo.
- **Estudiantes universitarios:** nunca menos de un salario mínimo, sea o no formación dual.

El apoyo no se puede negociar a la baja en convenciones colectivas ni en fallos arbitrales.

**Seguridad social y prestaciones:**
- En la **fase lectiva**, la empresa paga en su totalidad la salud y los riesgos laborales.
- En la **fase práctica**, o durante toda la formación dual, estás afiliado a salud, pensión y riesgos laborales como trabajador dependiente, y tienes derecho a todas las prestaciones, auxilios y demás derechos del contrato laboral.

La empresa debe certificarte el tiempo de la fase práctica o dual, que cuenta como **experiencia laboral**.

## En la práctica
- Como aprendiz tienes los derechos de un trabajador: jornada máxima, descansos, seguridad social y trato digno. La subordinación se limita a las actividades propias del aprendizaje.
- Los estudiantes universitarios pueden tener contrato de aprendizaje cuando trabajan 24 horas semanales en la empresa mientras cursan su carrera, o en su semestre de práctica. La actividad debe tener relación con lo que estudian.
- Las empresas obligadas a tener aprendices que no los contraten deben pagar al SENA 1,5 salarios mínimos al mes por cada aprendiz que les falte (art. 34 de la Ley 789 de 2002, modificado por el art. 23 de la Ley 2466).

## Errores comunes
- **«El aprendiz no es trabajador.»** Con la reforma, el contrato de aprendizaje es un contrato laboral especial.
- **«En la etapa práctica me pueden pagar menos del mínimo.»** En la fase práctica el apoyo es, como mínimo, un salario mínimo.
- **«No tengo ARL porque estoy estudiando.»** La empresa paga tu afiliación a riesgos laborales desde la fase lectiva.
- **«La práctica no cuenta como experiencia.»** La fase práctica o dual se certifica y se reconoce como experiencia laboral.

## Qué puedes hacer
1. Pide copia de tu contrato de aprendizaje y revisa la modalidad (tradicional o dual), la fase en la que estás y el valor del apoyo.
2. Comprueba tu afiliación a salud y riesgos laborales, y también a pensión en la fase práctica.
3. Al terminar, pide la certificación del tiempo de práctica como experiencia laboral.
4. Si algo no cuadra, habla con tu empresa y con tu centro de formación. Si no se resuelve, acude al Ministerio del Trabajo.

> Importante: esta guía es orientativa. No sustituye la asesoría de un abogado ni una decisión del Ministerio del Trabajo.

## Herramientas y lecturas relacionadas
- [Tipos de contrato de trabajo y período de prueba](/derechos/tipos-de-contrato-y-periodo-de-prueba)
- [Seguridad social: EPS, pensión, ARL y caja de compensación](/derechos/seguridad-social-eps-pension-arl-y-caja)
- [Calculadora de salario neto](/calculadoras/salario-neto)$c$,
       last_verified_at = date '2026-11-01'
 where slug = 'contrato-de-aprendizaje-sena' and md5(replace(content, E'\r\n', E'\n')) = '634b840e5317f7d34f536e878e08b0b1';

-- sindicatos-asociacion-y-huelga
update public.legal_resources
   set content = $c$## Qué dice la ley
La Constitución reconoce tres derechos colectivos del trabajo:
- **Asociación sindical (art. 39).** Trabajadores y empleadores pueden formar sindicatos o asociaciones sin intervención del Estado. El sindicato obtiene su reconocimiento jurídico con la simple inscripción del acta de constitución.
- **Negociación colectiva (art. 55).** Se garantiza el derecho de negociar las condiciones de trabajo, con las excepciones que señale la ley.
- **Huelga (art. 56).** Se garantiza el derecho de huelga, salvo en los servicios públicos esenciales definidos por el legislador.

El Código Sustantivo del Trabajo desarrolla estos derechos:
- **Mínimo de afiliados (art. 359).** Un sindicato de trabajadores necesita al menos 25 afiliados para constituirse o subsistir.
- **Clases de sindicatos (art. 356).** Pueden ser de empresa, de industria o rama de actividad económica, gremiales (de una misma profesión u oficio) o de oficios varios.
- **Protección del derecho de asociación (art. 354).** Quien atente contra este derecho puede recibir multas de 5 a 100 salarios mínimos, cada vez. Para el empleador, son actos prohibidos:
  - obstruir la afiliación con dádivas o promesas, o condicionar a ella el empleo o los beneficios;
  - despedir, suspender o cambiar las condiciones de quienes fundan un sindicato o de quienes están sindicalizados para impedir el ejercicio de este derecho;
  - negarse a negociar con el sindicato que presentó sus peticiones según la ley;
  - tomar represalias contra quien denunció o declaró en una investigación por estas conductas.
- **Fuero sindical (art. 405).** Algunos trabajadores (como fundadores y directivos) no pueden ser despedidos, desmejorados ni trasladados sin justa causa calificada antes por un juez del trabajo.
- **Huelga (art. 429).** Es la suspensión colectiva, temporal y pacífica del trabajo, con fines económicos y profesionales, después de los trámites que fija la ley. Si la etapa de arreglo directo termina sin acuerdo, los trabajadores pueden votar la huelga o pedir un tribunal de arbitramento (art. 444).

La reforma laboral (Ley 2466 de 2025) añadió que, en un proceso disciplinario, la persona sindicalizada puede estar acompañada por uno o dos representantes del sindicato (art. 115 del CST). También prohíbe que las facultades del empleador se usen para discriminar a alguien por sindicalizarse (art. 23 del CST).

## En la práctica
- Afiliarte a un sindicato es una decisión libre: no necesitas permiso del empleador y nadie puede obligarte a afiliarte ni a desafiliarte.
- Las convenciones colectivas que logra un sindicato pueden mejorar salarios, horarios y beneficios por encima del mínimo legal.
- Si en tu empresa no hay un sindicato, puedes afiliarte a uno de industria o de rama de actividad que agrupe a trabajadores de varias empresas de tu sector.

## Errores comunes
- **«Si me afilio, me pueden despedir.»** Despedir o desmejorar a alguien para impedir la asociación sindical está prohibido y se sanciona con multas.
- **«El sindicato solo sirve en empresas grandes.»** Los sindicatos de industria agrupan a trabajadores de varias empresas del mismo sector.
- **«Cualquier paro es una huelga legal.»** La huelga exige un procedimiento previo y no se permite en servicios públicos esenciales.

## Qué puedes hacer
1. Infórmate sobre los sindicatos de tu empresa o de tu sector y lee sus estatutos.
2. Si te presionan o sancionan por afiliarte, guarda evidencia (mensajes, correos, cambios de funciones o de horario) y denúncialo ante el Ministerio del Trabajo.
3. Si tienes fuero sindical y te despiden o te trasladan sin autorización judicial, busca asesoría de inmediato: los plazos para reclamar son cortos.

> Importante: esta guía es orientativa. No sustituye la asesoría de un abogado ni una decisión del Ministerio del Trabajo.

## Herramientas y lecturas relacionadas
- [Estabilidad laboral reforzada: cuándo no pueden despedirte](/derechos/estabilidad-laboral-reforzada)
- [Igualdad y no discriminación en el trabajo](/derechos/igualdad-y-no-discriminacion)
- [A dónde acudir: Ministerio del Trabajo y derecho de petición](/derechos/a-donde-acudir-ministerio-y-derecho-de-peticion)$c$,
       last_verified_at = date '2026-11-01'
 where slug = 'sindicatos-asociacion-y-huelga' and md5(replace(content, E'\r\n', E'\n')) = '4cb2995cbf85525e010e3445389db05a';

-- Aviso de guías que no se actualizaron porque ya se habían editado.
do $$
declare r record;
begin
  for r in select l.slug from public.legal_resources l
             join (values
      ('reforma-laboral-ley-2466-que-cambio', 'e4be645642f257322fa79a9c643dfb32'),
      ('teletrabajo-trabajo-remoto-y-desconexion', '9511f35541ae2357d267684621156d42'),
      ('plataformas-digitales-de-reparto', '4bff14a954d97ca07a2096a6f1d669d6'),
      ('contrato-de-aprendizaje-sena', '0471fa493ce081ef0236b06404fc6ab1'),
      ('sindicatos-asociacion-y-huelga', 'd8ee1d0a52b456f37f9a175635c5d52a')
             ) as n(slug, hash) on n.slug = l.slug
            where md5(replace(l.content, E'\r\n', E'\n')) <> n.hash
  loop
    raise notice 'La guía % no se actualizó: su texto cambió desde la parte 5. Aplica las correcciones a mano.', r.slug;
  end loop;
end $$;

-- Nueva guía: reforma pensional.
insert into public.legal_resources (slug, title, summary, content, category_slug, status) values
(
  'reforma-pensional-que-cambia',
  'Reforma pensional: qué cambia y desde cuándo',
  'La reforma pensional (Ley 2381 de 2024) empieza a regir el 1 de abril de 2027. Te explicamos los pilares, los requisitos y qué sigue igual mientras tanto.',
  $g$## Qué dice la ley
La Ley 2381 de 2024, conocida como la reforma pensional, crea el **Sistema de Protección Social Integral para la Vejez, Invalidez y Muerte de origen común**. Su entrada en vigor estuvo suspendida mientras la Corte Constitucional revisaba su trámite en el Congreso. En la **sentencia C-264 de 2026**, la Corte declaró exequible la mayor parte de la ley y fijó que **los artículos declarados exequibles entran en vigencia el 1 de abril de 2027**. Mientras tanto, siguen aplicándose las reglas actuales de la Ley 100 de 1993.

El nuevo sistema se organiza en pilares (art. 3):
- **Pilar solidario.** Es una renta básica solidaria para personas mayores en pobreza extrema, pobreza o vulnerabilidad que no tienen pensión: hombres de 65 años o más y mujeres de 60 años o más, o personas con pérdida de capacidad laboral del 50 % o más (hombres mayores de 55 y mujeres mayores de 50). Exige 10 años de residencia en Colombia y no es una pensión (art. 17).
- **Pilar semicontributivo.** Es un beneficio económico para quienes cotizaron entre 300 y menos de 1.000 semanas y, a los 65 años los hombres y a los 60 las mujeres, no alcanzaron la pensión (art. 18).
- **Pilar contributivo.** Es la pensión para quienes cotizan. Tiene dos componentes (art. 19):
  - **Prima media**, administrado por Colpensiones. Recibe las cotizaciones por los ingresos de 1 hasta 2,3 salarios mínimos.
  - **Complementario de ahorro individual**, administrado por fondos privados u otras entidades autorizadas. Recibe la parte de los ingresos que pasa de 2,3 y llega hasta 25 salarios mínimos.
  
  La pensión integral de vejez suma lo que te corresponde en cada componente.
- **Pilar de ahorro voluntario.** Ahorro adicional que decides hacer por tu cuenta.

**Requisitos de la pensión en el componente de prima media (art. 32):**
- **Edad:** 57 años las mujeres y 62 los hombres.
- **Semanas:** 1.300 los hombres. Para las mujeres, el mínimo baja 25 semanas cada año desde 2025: 1.250 en 2026, 1.225 en 2027, y así hasta llegar a 1.000 semanas en 2036.

## En la práctica
- Hasta el 31 de marzo de 2027 se aplican las reglas actuales: régimen de prima media en Colpensiones o régimen de ahorro individual en un fondo privado.
- Desde el 1 de abril de 2027, si ganas hasta 2,3 salarios mínimos, toda tu cotización irá al componente de prima media (Colpensiones). Si ganas más, la parte que pase de 2,3 salarios mínimos irá al componente de ahorro individual.
- La Corte devolvió algunas disposiciones a la Cámara de Representantes para repetir su debate. Entre ellas está el beneficio que reduce 50 semanas por cada hijo a las mujeres, hasta un mínimo de 850 semanas y por un máximo de 3 hijos (art. 36). Su aplicación depende de ese trámite: confirma su estado antes de contar con él.
- Contra el contenido de varios artículos siguen pendientes demandas ante la Corte. Algunas reglas todavía pueden cambiar.

## Errores comunes
- **«La reforma pensional ya está vigente.»** El nuevo sistema empieza el 1 de abril de 2027. Hasta entonces rigen las reglas actuales.
- **«La reforma sube la edad de pensión.»** En el componente de prima media se mantienen 57 años para las mujeres y 62 para los hombres.
- **«Pierdo mis semanas cotizadas.»** Las semanas cotizadas en el sistema actual siguen contando.
- **«La renta básica solidaria es una pensión.»** La ley dice expresamente que no lo es.

## Qué puedes hacer
1. Revisa tu historia laboral en Colpensiones o en tu fondo de pensiones y corrige a tiempo las semanas que falten.
2. Si te faltan pocos años para pensionarte, pide asesoría a tu administradora antes de tomar decisiones: algunas reglas de transición dependen de tu caso.
3. Comprueba que tu empleador cotice sobre tu salario real: es la base de tu futura pensión.
4. Si encuentras errores en tu historia laboral, presenta un derecho de petición a la administradora.

> Importante: esta guía es orientativa. No sustituye la asesoría de un abogado ni la de tu administradora de pensiones.

## Herramientas y lecturas relacionadas
- [Seguridad social: EPS, pensión, ARL y caja de compensación](/derechos/seguridad-social-eps-pension-arl-y-caja)
- [Reforma laboral de 2025: qué cambió para quienes trabajan](/derechos/reforma-laboral-ley-2466-que-cambio)
- [A dónde acudir: Ministerio del Trabajo y derecho de petición](/derechos/a-donde-acudir-ministerio-y-derecho-de-peticion)
- [Calculadora de salario neto](/calculadoras/salario-neto)$g$,
  'otras',
  'pendiente_verificacion'
)
on conflict (slug) do nothing;

-- Fuentes comprobadas el 1 de noviembre de 2026.
insert into public.legal_resource_sources (resource_id, label, publisher, url, accessed_at)
select r.id, s.label, 'Colpensiones, compilación normativa', s.url, date '2026-11-01'
from (values
  ('reforma-laboral-ley-2466-que-cambio', 'Ley 2101 de 2021 (reducción gradual de la jornada), texto compilado', 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/ley_2101_2021.htm'),
  ('teletrabajo-trabajo-remoto-y-desconexion', 'Ley 2466 de 2025, arts. 52 a 54 (teletrabajo y auxilio de conectividad)', 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/ley_2466_2025.htm'),
  ('teletrabajo-trabajo-remoto-y-desconexion', 'Ley 1221 de 2008 (teletrabajo), texto compilado', 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/ley_1221_2008.htm'),
  ('teletrabajo-trabajo-remoto-y-desconexion', 'Ley 2088 de 2021 (trabajo en casa), texto compilado', 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/ley_2088_2021.htm'),
  ('teletrabajo-trabajo-remoto-y-desconexion', 'Ley 2121 de 2021 (trabajo remoto), texto compilado', 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/ley_2121_2021.htm'),
  ('teletrabajo-trabajo-remoto-y-desconexion', 'Ley 2191 de 2022 (desconexión laboral), texto compilado', 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/ley_2191_2022.htm'),
  ('plataformas-digitales-de-reparto', 'Ley 2466 de 2025, arts. 24 a 30 y 67, texto compilado', 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/ley_2466_2025.htm'),
  ('contrato-de-aprendizaje-sena', 'Ley 2466 de 2025, arts. 21 y 23, texto compilado', 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/ley_2466_2025.htm'),
  ('sindicatos-asociacion-y-huelga', 'Constitución Política, arts. 39, 55 y 56, texto compilado', 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/constitucion_politica_1991.htm'),
  ('sindicatos-asociacion-y-huelga', 'Código Sustantivo del Trabajo, arts. 354, 356, 359, 405, 429 y 444, texto compilado', 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/codigo_sustantivo_trabajo.htm'),
  ('sindicatos-asociacion-y-huelga', 'Ley 2466 de 2025, arts. 7 y 16, texto compilado', 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/ley_2466_2025.htm'),
  ('reforma-pensional-que-cambia', 'Ley 2381 de 2024 (reforma pensional), texto compilado con notas de vigencia', 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/ley_2381_2024.htm'),
  ('reforma-pensional-que-cambia', 'Sentencia C-264 de 2026 (control de constitucionalidad)', 'https://normativa.colpensiones.gov.co/colpensiones/compilacion/jj_occc-ays_corte_constitucional_control_constitucionalidad.html')
) as s(slug, label, url)
join public.legal_resources r on r.slug = s.slug
on conflict (resource_id, url) do nothing;

commit;
