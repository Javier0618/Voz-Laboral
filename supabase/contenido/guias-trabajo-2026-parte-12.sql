-- TuVozLaboral: guías, parte 12 — reescritura de «Reforma pensional: qué
-- cambia y desde cuándo» con el estilo editorial (docs/estilo-editorial.md).
--
-- 2 de noviembre de 2026. Verificada contra la Ley 2381 de 2024 (texto
-- compilado por Colpensiones, con notas de vigencia), la sentencia C-264 de
-- 2026 de la Corte Constitucional y el comunicado de la Cámara del 28 de
-- octubre de 2026. Novedades frente a la versión anterior:
--   - entradilla con el trámite del 28 de octubre en la Cámara;
--   - ejemplo en pesos del límite de 2,3 salarios mínimos (mínimo de 2026);
--   - régimen de transición (art. 75) y fin de la oportunidad de traslado
--     (art. 76, venció el 16 de julio de 2026);
--   - artículos devueltos a la Cámara y demandas de fondo suspendidas;
--   - preguntas frecuentes.
--
-- Cómo usarlo: pégalo completo en el SQL Editor de Supabase y ejecútalo.
-- La guía sigue publicada; el texto nuevo se ve de inmediato. El título, el
-- resumen y el slug no cambian. Es idempotente: se puede ejecutar varias veces.

begin;

update public.legal_resources
   set content = $g$El 28 de octubre de 2026, la Cámara de Representantes votó otra vez los artículos de la reforma pensional que la Corte Constitucional le había devuelto, y no les cambió una coma. Con eso, la pregunta que se hacen millones de trabajadores tiene una respuesta más firme: **el nuevo sistema de pensiones empieza el 1 de abril de 2027**.

Hasta ese día, tu pensión se sigue rigiendo por la Ley 100 de 1993. Más abajo verás qué cambia desde abril, cuánto de tu cotización irá a Colpensiones con un ejemplo en pesos y qué conviene revisar desde ya.

## Qué dice la ley: un sistema nuevo que arranca en abril de 2027

La Ley 2381 de 2024, conocida como la reforma pensional, crea el **Sistema de Protección Social Integral para la Vejez, Invalidez y Muerte de origen común**. Su artículo 94 decía que entraría en vigor el 1 de julio de 2025, pero la Corte Constitucional suspendió esa fecha mientras revisaba cómo se votó la ley en el Congreso.

En la **sentencia C-264 del 25 de agosto de 2026**, la Corte declaró exequible (es decir, ajustada a la Constitución) la mayor parte de la ley y fijó que esos artículos rigen **desde el 1 de abril de 2027**. Otros puntos los devolvió a la Cámara para que los debatiera de nuevo, y suspendió hasta esa misma fecha los términos de las demandas que discuten el contenido de la reforma.

### Los cuatro pilares del nuevo sistema

El artículo 3 organiza el sistema en pilares, según lo que cada persona haya podido aportar:

- **Pilar solidario (art. 17).** Una renta básica para personas mayores en pobreza extrema, pobreza o vulnerabilidad que no tienen pensión: hombres desde los 65 años y mujeres desde los 60, o personas con pérdida de capacidad laboral del 50 % o más (hombres mayores de 55 y mujeres mayores de 50). Exige ser colombiano y 10 años de residencia en el país. No es una pensión.
- **Pilar semicontributivo (art. 18).** Un beneficio económico para quienes llegan a los 65 años (hombres) o a los 60 (mujeres) con entre 300 y menos de 1.000 semanas cotizadas, sin alcanzar la pensión. Desde 2036, para los hombres el rango será de 300 a menos de 1.300 semanas.
- **Pilar contributivo (art. 19).** La pensión de quienes cotizan. Tiene dos componentes, explicados en la siguiente sección.
- **Pilar de ahorro voluntario.** Lo que decidas ahorrar por tu cuenta, además de lo obligatorio.

### Requisitos para pensionarte: edad y semanas

El artículo 32 fija los requisitos de la pensión de vejez en el componente de prima media:

- **Edad:** 57 años las mujeres y 62 los hombres. La reforma no sube la edad.
- **Semanas de los hombres:** 1.300.
- **Semanas de las mujeres:** bajan 25 por año desde 2025, cuando eran 1.275. Son **1.250 en 2026 y 1.225 en 2027**, y llegan a 1.000 en 2036.

## En la práctica: a dónde irá tu cotización desde abril

El cambio que más vas a notar es el reparto de tu cotización. Hoy eliges entre Colpensiones y un fondo privado. Desde el 1 de abril de 2027, según el artículo 19, ya no se elige: tu cotización se reparte entre los dos componentes del pilar contributivo según cuánto ganes.

- **Componente de prima media (Colpensiones):** recibe la cotización por tus ingresos de 1 hasta **2,3 salarios mínimos**.
- **Componente complementario de ahorro individual (fondos privados u otras entidades autorizadas):** recibe la cotización por la parte que pase de 2,3 salarios mínimos, hasta 25.

Tu pensión será la suma de lo que te corresponda en cada componente.

### Ejemplo con el salario mínimo de 2026

El salario mínimo de 2026 es de **$1.750.905** (Decreto 1469 de 2025). El límite de 2,3 salarios mínimos equivale a **$4.027.082** al mes.

- Si ganas **$3.000.000**, estás por debajo del límite: toda tu cotización irá a Colpensiones.
- Si ganas **$5.000.000**, la cotización sobre los primeros $4.027.082 irá a Colpensiones y la cotización sobre los $972.918 restantes, a un fondo de ahorro individual.

El límite se mueve cada año con el salario mínimo. Cuando arranque el sistema, en abril de 2027, se calculará con el mínimo de 2027, que todavía no se ha fijado. Puedes seguir esa discusión en la guía del [salario mínimo 2027](/derechos/salario-minimo-2027).

### Si tienes muchas semanas: el régimen de transición

El artículo 75 protege a quienes ya llevan un buen trecho. Si a la entrada en vigencia del nuevo sistema tienes **750 semanas cotizadas (mujeres) o 900 (hombres)**, te sigues pensionando con las reglas anteriores. Con la sentencia C-264, esa entrada en vigencia es el 1 de abril de 2027. Confirma tu caso con tu administradora antes de tomar cualquier decisión.

### Lo que todavía está en el aire

La Corte devolvió a la Cámara apartes de los artículos 11, 14, 19, 23, 36, 63, 84, 92 y 93, y una propuesta de artículo nuevo. Uno de ellos es el que más esperan muchas mujeres. El artículo 36 rebaja **50 semanas por cada hijo** nacido vivo o adoptivo, hasta un mínimo de 850 semanas y por un máximo de 3 hijos.

Según la Cámara, el 28 de octubre la plenaria negó las 10 propuestas de cambio y ratificó el texto que venía del Senado. La sentencia ordena informar a la Corte cuando termine ese trámite, y la validez de esos artículos depende de que la Corte lo dé por cumplido. Mientras no lo haga, no cuentes con ellos.

> Las demandas contra el contenido de la reforma siguen pendientes. La Corte las suspendió hasta el 1 de abril de 2027, así que después de esa fecha algunas reglas todavía podrían cambiar.

## Errores comunes

- **«La reforma pensional ya está vigente.»** No. El nuevo sistema empieza el 1 de abril de 2027. Hasta entonces rige la Ley 100.
- **«La reforma sube la edad de pensión.»** No. Siguen siendo 57 años para las mujeres y 62 para los hombres.
- **«Voy a perder mis semanas o lo que tengo en el fondo.»** Las semanas que cotizaste siguen contando para tu pensión.
- **«Todavía me puedo cambiar de fondo con la oportunidad de traslado.»** Esa oportunidad, del artículo 76, duró dos años desde que se promulgó la ley, el 16 de julio de 2024. Venció el **16 de julio de 2026**.
- **«Ya tengo garantizada la rebaja de semanas por hijos.»** Ese artículo fue uno de los devueltos a la Cámara y todavía espera el visto bueno de la Corte.
- **«La renta básica solidaria es una pensión.»** El artículo 17 dice expresamente que no lo es.

## Qué puedes hacer antes de abril de 2027

1. **Descarga tu historia laboral.** Pídela en Colpensiones o en tu fondo privado con tu número de documento. Revisa que estén todas las semanas, sobre todo las de empleos viejos.
2. **Corrige los vacíos ahora.** Si faltan semanas, presenta un derecho de petición a la administradora con tus certificados laborales o desprendibles. La guía [a dónde acudir y cómo escribir un derecho de petición](/derechos/a-donde-acudir-ministerio-y-derecho-de-peticion) te muestra el paso a paso.
3. **Comprueba que coticen sobre tu salario real.** Tu desprendible debe mostrar el descuento del 4 % para pensión. Si la base es menor de lo que ganas, tu pensión futura también lo será. Repasa cómo funcionan los aportes en la guía de [seguridad social: EPS, pensión, ARL y caja](/derechos/seguridad-social-eps-pension-arl-y-caja).
4. **Cuenta tus semanas si estás cerca del régimen de transición.** Si eres mujer con cerca de 750 semanas, u hombre con cerca de 900, pregunta a tu administradora cómo te afecta la fecha del 1 de abril de 2027.
5. **Si te faltan pocos años para pensionarte, pide asesoría** a tu administradora antes de tomar decisiones. Si no te responden, puedes reclamar por las vías de la guía [cómo reclamar tus derechos laborales](/derechos/como-reclamar-conciliacion-demanda-tutela).

> Importante: esta guía es orientativa. No sustituye la asesoría de un abogado ni la de tu administradora de pensiones.

## Preguntas frecuentes

### ¿Desde cuándo rige la reforma pensional?
Desde el 1 de abril de 2027, según la sentencia C-264 de 2026 de la Corte Constitucional. Hasta esa fecha se aplica la Ley 100 de 1993.

### ¿La reforma pensional cambia la edad para pensionarse?
No. En el componente de prima media siguen siendo 57 años para las mujeres y 62 para los hombres (art. 32 de la Ley 2381 de 2024).

### ¿Cuántas semanas necesita una mujer para pensionarse en 2027?
1.225 semanas. El requisito baja 25 semanas por año hasta llegar a 1.000 en 2036.

### ¿Si gano más de 2,3 salarios mínimos, a dónde va mi cotización?
La parte de tu ingreso hasta 2,3 salarios mínimos cotiza en Colpensiones, y la que pasa de ese límite, hasta 25 salarios mínimos, en el componente de ahorro individual.

### ¿Todavía puedo trasladarme de fondo privado a Colpensiones?
La oportunidad especial de traslado del artículo 76 venció el 16 de julio de 2026. Desde abril de 2027 ya no se elige régimen: la cotización se reparte entre Colpensiones y el ahorro individual según tu ingreso.

### ¿Ya rige la rebaja de 50 semanas por hijo para las mujeres?
Todavía no. La Cámara volvió a votar ese artículo el 28 de octubre de 2026 y ahora la Corte debe verificar el trámite.

## Herramientas y lecturas relacionadas

- [Seguridad social: EPS, pensión, ARL y caja de compensación](/derechos/seguridad-social-eps-pension-arl-y-caja)
- [Reforma laboral de 2025: qué cambió para quienes trabajan](/derechos/reforma-laboral-ley-2466-que-cambio)
- [Salario mínimo 2027: cuándo se define y de cuánto sería el aumento](/derechos/salario-minimo-2027)
- [Calculadora de salario neto](/calculadoras/salario-neto): mira cuánto te descuentan para pensión cada mes.$g$,
       last_verified_at = date '2026-11-02'
 where slug = 'reforma-pensional-que-cambia';

insert into public.legal_resource_sources (resource_id, label, publisher, url, accessed_at)
select r.id, s.label, s.publisher, s.url, date '2026-11-02'
from (values
  ('Sentencia C-264 de 2026 (vigencia de la reforma pensional)', 'Corte Constitucional', 'https://www.corteconstitucional.gov.co/relatoria/2026/C-264-26.htm'),
  ('Plenaria de la Cámara subsanó los vicios de trámite en la reforma pensional (28 de octubre de 2026)', 'Cámara de Representantes', 'https://www.camara.gov.co/plenaria-de-la-camara-subsano-los-vicios-de-tramite-en-la-reforma-pensional')
) as s(label, publisher, url)
join public.legal_resources r on r.slug = 'reforma-pensional-que-cambia'
on conflict (resource_id, url) do nothing;

commit;
