-- TuVozLaboral: guías, parte 10 — subsidio de desempleo (Mecanismo de
-- Protección al Cesante).
--
-- 1 de noviembre de 2026. Redactada y verificada contra el texto oficial
-- compilado por Colpensiones de la Ley 1636 de 2013 (arts. 3, 10, 11, 12, 13,
-- 14 y 15), con las modificaciones de la Ley 2225 de 2022. Sigue la plantilla
-- editorial.
--
-- Entra en «pendiente_verificacion»: NO es pública hasta que la revises y la
-- publiques desde Moderación → Guías. Solo enlaza a guías que ya existen.
-- Es idempotente: se puede ejecutar varias veces.

begin;

insert into public.legal_resources (slug, title, summary, content, category_slug, status) values
(
  'subsidio-de-desempleo-proteccion-al-cesante',
  'Si te quedas sin empleo: subsidio de desempleo y cómo pedirlo',
  'Si aportaste a una caja de compensación, al quedarte sin trabajo puedes recibir hasta 6 meses de salud y pensión pagadas y, según tu categoría, un apoyo económico. Te explicamos requisitos, beneficios y el paso a paso.',
  $g$## Qué dice la ley
El **Mecanismo de Protección al Cesante** (Ley 1636 de 2013, modificada por la Ley 2225 de 2022) ayuda a quienes se quedan sin trabajo mientras buscan uno nuevo. Lo administran las **cajas de compensación familiar** con un fondo llamado FOSFEC.

**Quiénes pueden acceder (arts. 3 y 13):**
- Quienes hayan aportado a una caja de compensación durante **al menos 1 año, continuo o no, en los últimos 3 años**, si eran trabajadores dependientes.
- Quienes hayan aportado **al menos 2 años, continuos o no, en los últimos 3 años**, si eran independientes.
- Su relación laboral debe haber terminado **por cualquier causa**: renuncia, despido o fin del contrato. Un independiente debe haber terminado su contrato sin tener otro ni otra fuente de ingresos.
- Deben inscribirse en un servicio de empleo autorizado, seguir la ruta de búsqueda de empleo e inscribirse en los programas de capacitación que se indiquen.

**Qué recibes (arts. 3, 11 y 12):**
- **Salud y pensión pagadas**, calculadas sobre un salario mínimo, por un máximo de **6 meses**. Si quieres, puedes cotizar sobre más con tu propio dinero.
- Si estás en la **categoría A o B** del subsidio familiar, una **transferencia económica de 1,5 salarios mínimos en total**, repartida en **4 meses** con pagos que van bajando.
- Si ahorraste voluntariamente parte de tus cesantías en el mecanismo, un **incentivo** proporcional a ese ahorro.
- Acceso a los servicios de búsqueda de empleo y capacitación de la caja.

## En la práctica
1. **Pide la carta de terminación.** Tu empleador debe dártela dentro de los **3 días** siguientes al fin del contrato, con la fecha de terminación (art. 10).
2. **Haz la solicitud en la última caja de compensación** a la que estuviste afiliado (art. 11, parágrafo 2). Puedes preguntar allí también cuál es tu categoría.
3. **La caja tiene 15 días hábiles** para verificar si cumples los requisitos (art. 11). Si te dice que no, puedes controvertir la decisión ante la misma caja.
4. **Inscríbete en el servicio de empleo** de la caja y cumple la ruta: entrevistas, orientación y cursos.

**Cuándo no puedes recibirlo (art. 15):**
- Si tienes otro trabajo vigente o cualquier actividad remunerada.
- Si recibes una pensión.
- Si ya recibiste estos beneficios durante 6 meses, continuos o no, en los últimos 3 años.

**Cuándo lo pierdes (art. 14):**
- Si no acudes a los servicios de colocación de empleo, o no cumples sus trámites sin una causa justificada.
- Si rechazas sin causa justificada una oferta de empleo del Servicio Público de Empleo que pague al menos el 80 % de tu último salario, sin empeorar tus condiciones. Esa oferta nunca puede pagar menos del salario mínimo.
- Si abandonas, sin causa de fuerza mayor, la capacitación en la que te inscribiste.

## Errores comunes
- **«Si renuncié, no tengo derecho.»** El beneficio aplica sin importar por qué terminó tu trabajo.
- **«Es un sueldo mensual mientras esté desempleado.»** Lo principal es el pago de salud y pensión. El apoyo en dinero es de 1,5 salarios mínimos en total, repartidos en 4 meses, y solo para las categorías A y B.
- **«Puedo trabajar por mi cuenta y seguir recibiéndolo.»** El beneficio es incompatible con cualquier actividad remunerada. Si lo recibes mientras trabajas, deberás devolverlo.
- **«Lo pido en cualquier caja.»** La solicitud se hace en la última caja a la que estuviste afiliado.

## Qué puedes hacer
1. Pide por escrito la carta de terminación si tu empleador no te la entrega en 3 días.
2. Revisa tu liquidación y tus cesantías: al terminar el contrato también puedes retirarlas.
3. Haz la solicitud en tu última caja de compensación lo antes posible.
4. Guarda copia de tu solicitud y de las respuestas de la caja.
5. Si la caja niega tu solicitud y crees que cumples los requisitos, pide que revise la decisión. Si no responde, puedes presentar un derecho de petición.

> Importante: esta guía es orientativa. Las condiciones exactas dependen de la reglamentación vigente y de tu caja de compensación.

## Herramientas y lecturas relacionadas
- [La liquidación: qué te deben pagar al terminar el contrato](/derechos/liquidacion-al-terminar-el-contrato)
- [Cesantías e intereses sobre las cesantías](/derechos/cesantias-e-intereses)
- [Seguridad social: EPS, pensión, ARL y caja de compensación](/derechos/seguridad-social-eps-pension-arl-y-caja)
- [Calculadora de liquidación](/liquidacion)
- [A dónde acudir: Ministerio del Trabajo y derecho de petición](/derechos/a-donde-acudir-ministerio-y-derecho-de-peticion)$g$,
  'contrato-condiciones',
  'pendiente_verificacion'
)
on conflict (slug) do nothing;

-- Fuente comprobada el 1 de noviembre de 2026.
insert into public.legal_resource_sources (resource_id, label, publisher, url, accessed_at)
select r.id, 'Ley 1636 de 2013 (Mecanismo de Protección al Cesante), con las modificaciones de la Ley 2225 de 2022', 'Colpensiones, compilación normativa',
  'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/ley_1636_2013.htm', date '2026-11-01'
from public.legal_resources r where r.slug = 'subsidio-de-desempleo-proteccion-al-cesante'
on conflict (resource_id, url) do nothing;

commit;
