-- TuVozLaboral: guías, parte 7 — prestación de servicios vs. contrato laboral.
--
-- 1 de noviembre de 2026. Redactada y verificada contra los textos oficiales
-- compilados por Colpensiones: Código Sustantivo del Trabajo (arts. 23, 24 y
-- 488), Ley 2466 de 2025 (arts. 4 y 16), Ley 2277 de 2022 (art. 89), Ley 1562
-- de 2012 (art. 2) y Decreto 1072 de 2015 (arts. 2.2.4.2.2.5, 2.2.4.2.2.6 y
-- 2.2.4.2.2.13). Sigue la plantilla editorial.
--
-- Entra en «pendiente_verificacion»: NO es pública hasta que la revises y la
-- publiques desde Moderación → Guías. Solo enlaza a guías que ya existen.
-- Es idempotente: se puede ejecutar varias veces.

begin;

insert into public.legal_resources (slug, title, summary, content, category_slug, status) values
(
  'prestacion-de-servicios-vs-contrato-laboral',
  'Prestación de servicios o contrato laboral: cómo saber cuál tienes',
  'Si trabajas por prestación de servicios pero cumples horario y recibes órdenes como un empleado, podrías tener un contrato de trabajo. Te explicamos las diferencias, qué pagas como contratista y qué hacer.',
  $g$## Qué dice la ley
En el **contrato de prestación de servicios** te comprometes a hacer un trabajo o entregar un resultado con **autonomía**: decides cómo, cuándo y dónde lo haces, y recibes honorarios. No es un contrato de trabajo: no te pagan prestaciones sociales (prima, cesantías, vacaciones) y tú pagas tu seguridad social.

Hay **contrato de trabajo** cuando se reúnen tres elementos (art. 23 del CST):
- **Actividad personal:** el trabajo lo haces tú mismo.
- **Subordinación continuada:** el empleador puede darte órdenes sobre el modo, el tiempo o la cantidad de trabajo e imponerte reglamentos (literal b, modificado por el art. 16 de la Ley 2466 de 2025).
- **Salario** como pago por el servicio.

Cuando se dan los tres, **hay contrato de trabajo aunque el papel diga otra cosa**, «y no deja de serlo por razón del nombre que se le dé» (art. 23, numeral 2, del CST). Además, la ley presume que toda relación de trabajo personal se rige por un contrato de trabajo (art. 24 del CST). La reforma laboral reafirmó la **primacía de la realidad sobre las formalidades** como principio del derecho laboral (art. 4 de la Ley 2466 de 2025).

## En la práctica
**Señales de que podría ser un contrato de trabajo disfrazado:**
- Te imponen un horario fijo y te controlan la entrada y la salida.
- Recibes órdenes diarias de un jefe sobre cómo hacer tu trabajo.
- Te sancionan, te piden permiso para ausentarte o te exigen cumplir el reglamento interno como al resto del personal.
- Haces las mismas funciones que empleados con contrato laboral, de forma continua.
- Te pagan una suma fija cada mes, aunque se llame «honorarios».

**Lo que te corresponde pagar como contratista:**
- **Salud y pensión:** cotizas mes vencido sobre una base mínima del **40 % del valor mensual del contrato**, sin IVA, si tus ingresos son de al menos un salario mínimo (art. 89 de la Ley 2277 de 2022). Si tienes varios contratos, cotizas por cada uno.
- **Riesgos laborales (ARL):** si el contrato dura más de un mes, la afiliación es obligatoria (art. 2 de la Ley 1562 de 2012). **El contratante debe afiliarte**; si no lo hace, responde por las prestaciones que te correspondan (art. 2.2.4.2.2.5 del Decreto 1072 de 2015). La cobertura empieza el día siguiente a la afiliación, que debe hacerse al menos un día antes de empezar (art. 2.2.4.2.2.6).
- **Quién paga la ARL:** tú, si el riesgo es I, II o III; el contratante, si el riesgo es IV o V (art. 2.2.4.2.2.13 del Decreto 1072 de 2015).

Ejemplo: con honorarios de $5.000.000 al mes, la base de cotización es $2.000.000. Sobre ella pagas salud y pensión, y la ARL según tu riesgo. Calcula tu caso con la calculadora de prestación de servicios.

## Errores comunes
- **«Firmé un contrato de prestación de servicios, así que no puedo reclamar nada.»** Lo que cuenta es cómo trabajas en realidad, no el nombre del contrato.
- **«Como contratista, la ARL es asunto mío.»** El contratante debe afiliarte, y si no lo hace responde por las prestaciones.
- **«Cotizo sobre todo lo que me pagan.»** La base mínima es el 40 % del valor mensual del contrato.
- **«Tengo todo el tiempo del mundo para reclamar.»** Los derechos laborales prescriben en 3 años desde que son exigibles (art. 488 del CST).

## Qué puedes hacer
1. Guarda pruebas de cómo trabajas: correos con órdenes, horarios, registros de entrada, chats con tu jefe, memorandos y nombres de testigos.
2. Revisa tus pagos de seguridad social y confirma que el contratante te afilió a la ARL antes de empezar.
3. Si crees que hay un contrato de trabajo, escribe a tu contratante pidiendo que se reconozca. Un reclamo escrito sobre un derecho concreto interrumpe la prescripción una vez.
4. Acude al Ministerio del Trabajo para orientación o conciliación. Ten en cuenta que declarar que existió un contrato de trabajo, y ordenar el pago de prestaciones, le corresponde a un juez laboral.
5. Busca asesoría jurídica pronto: muchos consultorios jurídicos de universidades atienden gratis.

> Importante: esta guía es orientativa. No sustituye la asesoría de un abogado ni una decisión del Ministerio del Trabajo o de un juez.

## Herramientas y lecturas relacionadas
- [Calculadora para contratos de prestación de servicios](/calculadoras/prestacion-servicios)
- [Cuándo existe un contrato de trabajo](/derechos/cuando-existe-contrato-de-trabajo)
- [Seguridad social: EPS, pensión, ARL y caja de compensación](/derechos/seguridad-social-eps-pension-arl-y-caja)
- [Repartidores de plataformas digitales: qué dice la reforma laboral](/derechos/plataformas-digitales-de-reparto)
- [A dónde acudir: Ministerio del Trabajo y derecho de petición](/derechos/a-donde-acudir-ministerio-y-derecho-de-peticion)$g$,
  'contrato-condiciones',
  'pendiente_verificacion'
)
on conflict (slug) do nothing;

-- Fuentes comprobadas el 1 de noviembre de 2026.
insert into public.legal_resource_sources (resource_id, label, publisher, url, accessed_at)
select r.id, s.label, 'Colpensiones, compilación normativa', s.url, date '2026-11-01'
from (values
  ('Código Sustantivo del Trabajo, arts. 23, 24 y 488, texto compilado', 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/codigo_sustantivo_trabajo.htm'),
  ('Ley 2466 de 2025, arts. 4 y 16, texto compilado', 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/ley_2466_2025.htm'),
  ('Ley 2277 de 2022, art. 89 (ingreso base de cotización de los independientes)', 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/ley_2277_2022.htm'),
  ('Ley 1562 de 2012, art. 2 (afiliados al sistema de riesgos laborales)', 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/ley_1562_2012.htm'),
  ('Decreto 1072 de 2015, arts. 2.2.4.2.2.5, 2.2.4.2.2.6 y 2.2.4.2.2.13', 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/decreto_1072_2015.htm')
) as s(label, url)
join public.legal_resources r on r.slug = 'prestacion-de-servicios-vs-contrato-laboral'
on conflict (resource_id, url) do nothing;

commit;
