-- VozLaboral: guías, parte 9 — inclusión laboral de personas con discapacidad.
--
-- 1 de noviembre de 2026. Redactada y verificada contra los textos oficiales
-- compilados por Colpensiones: Ley 2466 de 2025 (arts. 15, 16, 7 y 47), Ley
-- 361 de 1997 (art. 26), Ley 1618 de 2013 (art. 13) y Código Sustantivo del
-- Trabajo (arts. 23, 57 y 115). Sigue la plantilla editorial.
--
-- Entra en «pendiente_verificacion»: NO es pública hasta que la revises y la
-- publiques desde Moderación → Guías. Solo enlaza a guías que ya existen.
-- Es idempotente: se puede ejecutar varias veces.

begin;

insert into public.legal_resources (slug, title, summary, content, category_slug, status) values
(
  'inclusion-laboral-y-discapacidad',
  'Inclusión laboral de personas con discapacidad: cuota de empleo, ajustes y protección',
  'Desde junio de 2026 las empresas deben contratar o mantener a personas con discapacidad según su tamaño. Te explicamos la cuota, los ajustes razonables, la protección contra el despido y los derechos de quienes cuidan.',
  $g$## Qué dice la ley
Todas las personas con discapacidad tienen **derecho al trabajo** en igualdad de oportunidades (art. 13 de la Ley 1618 de 2013). La ley lo protege de varias formas:

- **Al contratar:** la discapacidad no puede ser motivo para impedir que te contraten, salvo que se demuestre claramente que es incompatible e insuperable con el cargo (art. 26 de la Ley 361 de 1997).
- **Durante el trabajo:** el empleador debe hacer los **ajustes razonables** que necesite cada trabajador con discapacidad para acceder a su trabajo, desarrollarlo y mantenerlo, quitando barreras físicas, de comunicación y de actitud (art. 57, numeral 13, del CST, añadido por la Ley 2466 de 2025). Sus facultades de mando tampoco pueden usarse para discriminar por discapacidad (art. 23 del CST, literal b).
- **En un proceso disciplinario:** si tienes discapacidad, el empleador debe darte las medidas y ajustes razonables necesarios para que la comunicación y la comprensión sean mutuas (art. 115 del CST, parágrafo 3).
- **Frente al despido:** nadie puede ser despedido por razón de su discapacidad sin **autorización del Ministerio del Trabajo**. Si te despiden sin esa autorización, tienes derecho a una **indemnización de 180 días de salario**, además de los demás pagos que correspondan (art. 26 de la Ley 361 de 1997).

**La cuota de empleo (art. 57, numeral 17, del CST, añadido por la Ley 2466 de 2025):**
- Las empresas con **hasta 500 trabajadores** deben contratar o mantener al menos **2 trabajadores con discapacidad por cada 100**.
- Desde **501 trabajadores**, deben sumar **1 trabajador con discapacidad más por cada tramo adicional de 100**.
- La cuota se calcula sobre los **trabajadores permanentes**.
- Las personas deben contar con la **certificación de discapacidad** que expide el sistema de salud.
- El empleador debe reportar cada contrato al Ministerio del Trabajo dentro de los **15 días** siguientes, y esa información es reservada.
- Si en algún cargo o sector no es posible contratar personas con discapacidad, la empresa debe informarlo al Ministerio (parágrafo 2).
- El incumplimiento se sanciona según la Ley 1610 de 2013.

## En la práctica
- La cuota fue **voluntaria el primer año** de vigencia de la reforma. Es **obligatoria desde el segundo año**, es decir, desde el **25 de junio de 2026** (parágrafo 3).
- Ejemplo: una empresa con 300 trabajadores permanentes debe tener al menos 6 trabajadores con discapacidad.
- Un ajuste razonable puede ser, por ejemplo, adaptar el puesto o las herramientas, cambiar la forma de comunicar las instrucciones o ajustar el horario.
- **Si cuidas a un familiar con discapacidad** (en primer o segundo grado de consanguinidad, o primero de afinidad) y tienes un horario de trabajo, puedes acordar con tu empleador **horario flexible, trabajo en casa o remoto**, si tu trabajo lo permite y certificas tu condición de cuidador (art. 7 de la Ley 2297 de 2023, modificado por el art. 47 de la Ley 2466 de 2025).

## Errores comunes
- **«Si tengo una discapacidad, no me pueden contratar para ese cargo.»** Solo se puede negar si la discapacidad es claramente incompatible e insuperable con el cargo.
- **«La empresa no tiene que adaptar nada.»** Los ajustes razonables son una obligación del empleador.
- **«Me pueden despedir si mi discapacidad me hace más lento.»** No te pueden despedir por razón de tu discapacidad sin autorización del Ministerio del Trabajo.
- **«La cuota es solo para empresas grandes.»** La regla de 2 por cada 100 se aplica a las empresas de hasta 500 trabajadores, y la de las más grandes se suma por tramos.

## Qué puedes hacer
1. Si necesitas un ajuste para trabajar, pídelo por escrito a tu empleador y explica qué necesitas.
2. Ten a mano tu certificación de discapacidad.
3. Si te niegan el trabajo, los ajustes o te despiden por tu discapacidad, guarda las pruebas: correos, mensajes y nombres de testigos.
4. Si te despiden sin autorización del Ministerio, busca asesoría pronto. Según la Corte Constitucional, además de la indemnización, un juez puede ordenar tu reintegro y el pago de lo que dejaste de recibir (Sentencia SU-348 de 2022).
5. Si cuidas a un familiar con discapacidad, pide por escrito el acuerdo de flexibilidad horaria o de trabajo remoto.
6. Puedes presentar una queja ante el Ministerio del Trabajo si la empresa no cumple sus obligaciones.

> Importante: esta guía es orientativa. No sustituye la asesoría de un abogado ni una decisión del Ministerio del Trabajo.

## Herramientas y lecturas relacionadas
- [Estabilidad laboral reforzada: cuándo no pueden despedirte](/derechos/estabilidad-laboral-reforzada)
- [Igualdad y no discriminación en el trabajo](/derechos/igualdad-y-no-discriminacion)
- [Reforma laboral de 2025: qué cambió para quienes trabajan](/derechos/reforma-laboral-ley-2466-que-cambio)
- [Teletrabajo, trabajo remoto y derecho a desconectarte](/derechos/teletrabajo-trabajo-remoto-y-desconexion)
- [A dónde acudir: Ministerio del Trabajo y derecho de petición](/derechos/a-donde-acudir-ministerio-y-derecho-de-peticion)$g$,
  'discriminacion',
  'pendiente_verificacion'
)
on conflict (slug) do nothing;

-- Fuentes comprobadas el 1 de noviembre de 2026.
insert into public.legal_resource_sources (resource_id, label, publisher, url, accessed_at)
select r.id, s.label, 'Colpensiones, compilación normativa', s.url, date '2026-11-01'
from (values
  ('Ley 2466 de 2025, arts. 7, 15, 16 y 47, texto compilado', 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/ley_2466_2025.htm'),
  ('Ley 361 de 1997, art. 26 (no discriminación a personas con discapacidad)', 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/ley_0361_1997.htm'),
  ('Ley 1618 de 2013, art. 13 (derecho al trabajo)', 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/ley_1618_2013.htm'),
  ('Código Sustantivo del Trabajo, arts. 23, 57 y 115, texto compilado', 'https://normativa.colpensiones.gov.co/colpens/compilacion/docs/codigo_sustantivo_trabajo.htm')
) as s(label, url)
join public.legal_resources r on r.slug = 'inclusion-laboral-y-discapacidad'
on conflict (resource_id, url) do nothing;

commit;
