# Auditoría SEO de tuvozlaboral.com — noviembre de 2026

Diagnóstico hecho el 10 de noviembre de 2026, **antes de cambiar el código**. Se basa en tres tipos de evidencia, que se indican en cada hallazgo:

- **[GSC]** el Excel de Search Console del 10 de noviembre (consultas, páginas, países, dispositivos), con datos del 1 al 8 de noviembre;
- **[sitio]** pruebas al sitio publicado: respuestas HTTP con `curl`, HTML inicial sin JavaScript, página renderizada con Chromium simulando Googlebot móvil y Lighthouse 12.2.1 (laboratorio);
- **[código]** lectura del repositorio (`main`, commit 3c218c7).

No hubo acceso a Search Console en vivo (cobertura del índice, inspección de URL), a Analytics ni al servidor. Lo que depende de eso está en «Hipótesis por confirmar».

## Estado de la implementación

**Fases 1 y 2, en código** (10 de noviembre de 2026, autorizadas por la administración):

- **B1. Enlaces internos sin redirecciones.**
  - `src/lib/publicPath.mjs` es la regla única de URL canónica y la usan React, el texto de las guías y el prerender.
  - En el HTML generado con las 41 guías reales, los enlaces internos que redirigen pasaron de 181 de 342 a 0.
- **B2.** «Guía no encontrada» lleva `noindex, follow` y su propio título (`src/pages/Rights.tsx`).
- **B3.** El formulario de reclamación de empresas lleva `noindex, follow` y un título propio (`src/pages/Claim.tsx`).
- **B5. Una sola fuente de títulos.**
  - `src/lib/seoPages.mjs` (antes `scripts/seo-pages.mjs`) da el título y la descripción de las páginas fijas, tanto al HTML inicial como a React (`setPageMeta`).
  - Comprobado en el navegador: el título es igual antes y después de JavaScript en `/liquidacion/`, `/calculadoras/prima/`, `/calculadoras/administrativos/` y `/herramientas/cartas/carta-de-renuncia/`.
- **B7, parcial.**
  - El HTML inicial de cada guía muestra «Verificada contra la fuente oficial» y «Última actualización» con `<time>`.
  - `datePublished` sigue sin ponerse: el código ya lo omitía a propósito hasta tener una fecha editorial fiable, y aquí no se inventa.
- **B9.** La portada tiene `og:url` y datos `WebSite` y `Organization` en el HTML inicial. El `BreadcrumbList` de las guías apunta a `/derechos/`.

**Pendiente:**

- **En el servidor**, lo hace la administración en el VPS:
  - comprobar `curl -I http://tuvozlaboral.com/`, que debe responder 301 a https;
  - dejar una sola cabecera `Cache-Control` en `/assets/`;
  - opcionalmente, redirigir `www` directo a la URL final.
- **B8.** El texto «Cómo se calcula» de las calculadoras en el HTML inicial. Prioridad baja: Googlebot ya lo ve al renderizar.
- **Fases 3 y 4, editoriales.** Van como sugerencias en Moderación → Sugerencias, para revisarlas antes de aplicarlas.

---

## A. Resumen ejecutivo

**El sitio está técnicamente sano y es indexable.** Las 73 URLs del sitemap responden 200, cada una tiene su canónica correcta, un solo H1 y metadatos propios. Las guías llegan prerenderizadas con su texto completo antes de ejecutar JavaScript, `www` y las URLs sin barra final redirigen con 301 a una sola versión, y los recursos van comprimidos y con caché. No hay señales de penalización.

**Los datos de Search Console son los de un sitio que empieza.** Tiene 338 impresiones y 13 clics en 8 días, con las primeras impresiones el 1 de noviembre. De los 13 clics, 11 son de la portada (búsquedas de marca). Las guías aparecen sobre todo entre las posiciones 40 y 95, y por eso casi no reciben clics. Es una situación de crecimiento, no de error.

**Debilidades principales, en orden de impacto:**

1. **Enlaces internos que pasan por una redirección.** 181 de los 342 enlaces internos del HTML inicial apuntan a la versión sin barra (`/derechos/vacaciones`) y obligan a un 301. Por eso Search Console muestra las dos variantes de casi cada guía y reparte las señales entre ellas.
2. **Guías de alta demanda demasiado cortas.** Vacaciones, cesantías, despido, jornada, incapacidad, licencias, salario mínimo y tipos de contrato tienen entre 220 y 410 palabras. Justo esos temas aparecen en Search Console en las posiciones 50 a 95, frente a guías extensas de medios y empresas de nómina.
3. **Páginas que no deberían indexarse.** Las URLs inexistentes responden 200 (posibles «soft 404»), una guía inexistente no lleva `noindex`, y los formularios de reclamación de empresas se indexan con el título genérico de la portada.
4. **Títulos y descripciones largos.** 11 de 41 guías superan los 60 caracteres de título y 31 de 41 superan los 160 de descripción, así que Google los recorta o los reescribe.
5. **Confianza (E-E-A-T) poco visible.** No hay autoría ni revisión con nombre, los datos estructurados no tienen fecha de publicación, y la fecha de verificación solo aparece después de ejecutar JavaScript.

**Oportunidades más claras:**

- el grupo «cesantías 2027» (posición alrededor de 10);
- el calendario laboral (posición 9);
- descanso dominical (posiciones 4,5 a 13,7);
- salud mental (posición 8);
- seguridad social (posiciones 7,5 a 15);
- las guías y calculadoras de los temas laborales con más búsquedas, si se amplían.

---

## B. Hallazgos comprobados

### B1. Enlaces internos a URLs que redirigen (301)

| | |
|---|---|
| **Problema** | El sitio sirve las páginas con barra final (`/derechos/vacaciones/`), que es su URL canónica, pero la mayoría de los enlaces internos apuntan a la versión sin barra. Cada clic y cada rastreo pasa por una redirección 301. |
| **Evidencia** | [sitio] En el HTML inicial de las 73 URLs del sitemap hay 181 enlaces de 342 que redirigen. `curl https://tuvozlaboral.com/derechos/vacaciones` responde `301 → /derechos/vacaciones/`.<br>[código] Los enlaces dentro del texto de las guías (`[texto](/derechos/slug)`), `src/components/ArticulosCst.tsx:31`, `src/pages/Search.tsx:130`, `src/pages/CompanyProfile.tsx:164-174` y el `BreadcrumbList` del JSON-LD (`"item":"https://tuvozlaboral.com/derechos"`) usan la versión sin barra.<br>[GSC] 20 guías aparecen con y sin barra, por ejemplo `renuncia-y-preaviso` (14 y 12 impresiones) y `descanso-dominical-y-festivos` (10 y 8). |
| **Impacto** | Medio. No es duplicado: la canónica y el 301 apuntan a una sola versión. Pero gasta rastreo, retrasa la consolidación de señales y explica las variantes en Search Console. |
| **Prioridad** | Alta (el arreglo es de bajo riesgo). |
| **Solución** | Una sola función que normalice los enlaces internos a la URL canónica. `src/lib/meta.ts` ya tiene `canonicalPublicPath`, así que basta exportarla y aplicarla en `GuideBody` (enlaces internos del Markdown), en los componentes citados y en `scripts/prerender.mjs`. Además, cambiar el `BreadcrumbList` para que apunte a `/derechos/`. No cambia ningún slug. |
| **Riesgo** | Bajo. Hay que cuidar que las rutas que no son directorios (por ejemplo `/derechos?tema=…`) no reciban barra; `canonicalPublicPath` ya las excluye. |
| **Validación** | Volver a rastrear el HTML inicial: 0 enlaces internos con 301. En Search Console, las variantes sin barra deberían desaparecer de «Páginas» en 4 a 8 semanas. |

### B2. URLs inexistentes con respuesta 200 («soft 404»)

| | |
|---|---|
| **Problema** | El servidor responde 200 a cualquier ruta, con el HTML de la portada (canónica `/`). React muestra después «Página no encontrada» con `noindex`. Pero una guía inexistente (`/derechos/no-existe/`) se muestra **sin `noindex`** y con el título de la portada. |
| **Evidencia** | [sitio] `curl /no-existe-xyz` → 200. Renderizado: `/derechos/no-existe-guia/` → título «TuVozLaboral: guías laborales…», canónica a sí misma, sin `robots`.<br>[código] `src/pages/Rights.tsx:342` (el estado «No encontramos esta guía» no llama a `setPageMeta` con `noindex`). |
| **Impacto** | Medio. Google puede marcarlas como «soft 404» o como duplicados de la portada. Hoy no se ven en Search Console porque nada enlaza a ellas, pero aparecerían si se archiva una guía o si alguien enlaza un slug mal escrito. |
| **Prioridad** | Alta. |
| **Solución** | 1) En `Rights.tsx`, cuando la guía no existe: `setPageMeta({ title: 'Guía no encontrada…', robots: 'noindex, follow' })`.<br>2) Opcional, en Nginx: responder 404 real en `/derechos/*` cuando no exista el `index.html` prerenderizado. Antes hay que asegurarse de desplegar justo después de publicar cada guía, porque si no, una guía nueva daría 404 hasta el siguiente despliegue. |
| **Riesgo** | Bajo para el punto 1. Medio para el 2, por la dependencia del despliegue. |
| **Validación** | Abrir `/derechos/slug-inventado/` con JavaScript: debe tener `noindex`. Revisar el informe «Páginas → Soft 404» de Search Console. |

### B3. Formularios de reclamación indexados con el título de la portada

| | |
|---|---|
| **Problema** | `/empresas/<empresa>/reclamacion` es un formulario sin contenido propio. Se indexa con el título genérico de la portada y sin `noindex`. |
| **Evidencia** | [GSC] Aparecen 3 URLs (`/empresas/247-intouch-col-sas-bogota-d-c/reclamacion`, `/empresas/24-7-colombia-s-a-s-pereira/reclamacion` y `/empresas/a-d-alvarado-during-s-a-s-en-reorganizacion-bogota-d-c/reclamacion`), en posiciones 72 a 74.<br>[sitio] Renderizado: título «TuVozLaboral: guías laborales para trabajadores en Colombia», sin `robots`.<br>[código] `src/pages/Claim.tsx` no define metadatos. |
| **Impacto** | Bajo a medio. Hay miles de empresas en el catálogo, así que pueden acumularse miles de páginas casi vacías y con el mismo título. |
| **Prioridad** | Media. |
| **Solución** | En `Claim.tsx`: `setPageMeta({ title: 'Solicitar una corrección sobre <empresa> · TuVozLaboral', robots: 'noindex, follow' })`. No usar `Disallow` en robots.txt: Google necesita rastrearlas para ver el `noindex`. |
| **Riesgo** | Ninguno. Son formularios. |
| **Validación** | Inspección de URL en Search Console: «Excluida por la etiqueta noindex». |

### B4. Títulos y descripciones que Google recorta

| | |
|---|---|
| **Problema** | El título de la guía se usa como `<title>` y como H1. En muchas guías pasa de 60 caracteres, y la página le añade « · TuVozLaboral» (15 caracteres). Las descripciones superan los 160. |
| **Evidencia** | [sitio] 11 de 41 guías superan los 60 caracteres sin la marca. Por ejemplo, `descanso-dominical-y-festivos` (104 con la marca), `inclusion-laboral-y-discapacidad` (100), `salario-minimo-2027` (93), `salud-mental-y-riesgo-psicosocial` (92) y `descuentos-y-embargos-del-salario` (88). 31 de 41 descripciones pasan de 160 caracteres (hasta 245 en `como-reclamar-conciliacion-demanda-tutela`). |
| **Impacto** | Medio sobre el CTR. Google suele reescribirlos, y la búsqueda principal puede quedar fuera del fragmento visible. |
| **Prioridad** | Media. |
| **Solución** | Dos opciones: <br>a) Acortar el título y el resumen desde el editor, sin tocar el slug.<br>b) Añadir campos opcionales `seo_title` y `seo_description` en `legal_resources`, para que el H1 pueda seguir siendo largo y descriptivo. Esto requiere una migración.<br>Recomiendo empezar por **a** en las guías con impresiones, porque no cambia el código. El estándar de `CLAUDE.md` ya pide 40–60 caracteres de título y 120–160 de resumen para las guías nuevas. |
| **Riesgo** | Bajo. No cambian las URLs. Cada título nuevo debe conservar la búsqueda principal. |
| **Validación** | Volver a rastrear: títulos ≤ 60 caracteres sin la marca y descripciones ≤ 160. En Search Console, comparar el CTR de esas páginas a los 30 días. |

### B5. Dos fuentes distintas de metadatos en calculadoras y herramientas

| | |
|---|---|
| **Problema** | El HTML inicial toma el título de `scripts/seo-pages.mjs` y de `scripts/generar-sitemap.mjs`. Después React lo reemplaza con el de `src/lib/calculadoras.ts` o el de cada página. Los dos textos no coinciden. |
| **Evidencia** | [sitio] `/liquidacion/`: el HTML inicial dice «Calculadora de liquidación laboral en Colombia» y, ya renderizado, «Liquidación al terminar el contrato». Este segundo título es casi el mismo de la guía `/derechos/liquidacion-al-terminar-el-contrato/` («La liquidación: qué te deben pagar al terminar el contrato»), lo que hace competir a la calculadora y la guía por la misma búsqueda. `/herramientas/cartas/carta-de-renuncia/` pasa de «Modelo de carta de renuncia laboral en Colombia» a «Carta de renuncia: modelo gratis para llenar».<br>[código] `src/lib/calculadoras.ts:71-74` y `scripts/seo-pages.mjs`. |
| **Impacto** | Medio. Google indexa sobre todo la versión renderizada, así que el título bueno (el del prerender) se pierde. |
| **Prioridad** | Media. |
| **Solución** | Que el título y la descripción vivan en un solo lugar: que `seo-pages.mjs` importe la lista de `src/lib/calculadoras.ts` (o al revés), y alinear los títulos con la intención de herramienta («Calculadora de liquidación laboral en Colombia»). |
| **Riesgo** | Bajo. No afecta los cálculos. |
| **Validación** | Que el título del HTML inicial y el renderizado sean iguales en las 20 rutas de herramientas. |

### B6. Guías de alta demanda con poco contenido

| | |
|---|---|
| **Problema** | 17 de 41 guías tienen menos de 500 palabras en el HTML inicial, y entre ellas están los temas laborales con más búsquedas. |
| **Evidencia** | [sitio] Palabras en el HTML inicial (incluye unas 60 del menú y el pie):<br>- `vacaciones` 312;<br>- `cesantias-e-intereses` 267;<br>- `despido-con-y-sin-justa-causa` 358;<br>- `jornada-horas-extra-y-recargos` 366;<br>- `incapacidad-por-enfermedad` 223;<br>- `licencias-de-maternidad-y-paternidad` 250;<br>- `salario-minimo-auxilio-de-transporte-y-dotacion` 329;<br>- `tipos-de-contrato-y-periodo-de-prueba` 411;<br>- `pago-del-salario` 316;<br>- `licencias-remuneradas` 225;<br>- `a-donde-acudir-ministerio-y-derecho-de-peticion` 263.<br>[GSC] Esas páginas aparecen en posiciones bajas para sus búsquedas: «pago vacaciones» 76, «cuantos días de vacaciones tiene un trabajador» 94, «despedido sin causa» 46, «cuantos dias de incapacidad paga la empresa» 73, «licencia de maternidad 2021» 47,5.<br>[web] Para «calcular prima» y «cuándo pagan las cesantías», los primeros resultados son medios (Portafolio, El Colombiano) y empresas de nómina (Buk, Gerencie, Siempre al día) con guías largas, ejemplos y calculadora. |
| **Impacto** | Alto para el crecimiento orgánico. Es la principal razón de las posiciones bajas en los temas de más búsqueda. |
| **Prioridad** | Alta. Es trabajo editorial, no técnico. |
| **Solución** | Ampliarlas con el flujo editorial que ya existe (sugerencias de tipo `actualizar` y propuestas revisadas en Moderación). Hacerlo con el estándar de `CLAUDE.md`: entradilla con la respuesta directa, ejemplo con cifras de 2026, errores comunes, pasos y preguntas frecuentes reales. Los datos salen de la norma oficial, sin relleno. |
| **Riesgo** | Exactitud jurídica. Toda ampliación pasa por revisión humana antes de publicarse. No se cambian slugs. |
| **Validación** | Más de 1.000 palabras útiles y revisión editorial aprobada. En Search Console, la posición media de las consultas del grupo a los 60 y 90 días. |

### B7. Señales de confianza poco visibles para un tema legal y de dinero

| | |
|---|---|
| **Problema** | Google pide más experiencia y confianza (E-E-A-T) en temas legales y de dinero. Hoy las guías no muestran quién las escribe ni quién las revisa. El JSON-LD tiene `author: Organization` y no tiene `datePublished`. La fecha «Verificada contra la fuente oficial» solo aparece después de ejecutar JavaScript. |
| **Evidencia** | [sitio] Las 41 guías tienen `dateModified` y ninguna tiene `datePublished`. El texto «Verificada…» no está en el HTML inicial de `/derechos/vacaciones/` y sí en el renderizado.<br>[código] `src/pages/About.tsx:50`: «El equipo de TuVozLaboral…». No hay nombres ni una página de metodología editorial propia. |
| **Impacto** | Medio. No impide indexar, pero pesa al competir con medios y empresas reconocidas. |
| **Prioridad** | Media. |
| **Solución** | Sin inventar credenciales:<br>1) Llevar la fecha de verificación y la de actualización al HTML prerenderizado (`scripts/prerender.mjs`) y añadir `datePublished` (la fecha de creación de la guía).<br>2) Crear una página de método editorial: cómo se investiga, qué fuentes se usan, quién revisa y cómo se corrige. Si las guías se redactan con ayuda de IA y una persona las revisa, decirlo.<br>3) Si hay una persona real que revisa (por ejemplo, un abogado laboralista), mostrar su nombre y su perfil con su consentimiento. Si no la hay, no simularla. |
| **Riesgo** | Bajo en lo técnico. Lo editorial lo decide la administración. |
| **Validación** | Prueba de resultados enriquecidos de Google sin advertencias en `Article`. La fecha de verificación visible en el HTML inicial. |

### B8. Calculadoras y cartas casi vacías sin JavaScript

| | |
|---|---|
| **Problema** | El HTML inicial de las 20 herramientas tiene entre 23 y 49 palabras: solo el título, la descripción y uno o dos enlaces. |
| **Evidencia** | [sitio] HTML inicial: `/calculadoras/prima/` 49 palabras y `/liquidacion/` 28. Ya renderizadas con Chromium, `/calculadoras/prima/` tiene 405 palabras, `/liquidacion/` 595 y `/herramientas/cartas/carta-de-renuncia/` 357, con su H1, sus instrucciones y su explicación del cálculo. |
| **Impacto** | Bajo a medio. **Googlebot sí ejecuta JavaScript** y ve el contenido completo, así que esto no bloquea la indexación. Afecta a otros rastreadores (Bing, redes sociales, herramientas SEO) y retrasa el procesamiento. |
| **Prioridad** | Media-baja. |
| **Solución** | Incluir en el prerender el bloque estático «Cómo se calcula» y la norma de cada calculadora, que ya existe en los componentes. No hace falta SSR ni cambiar de framework. |
| **Riesgo** | Bajo. El texto del prerender debe ser el mismo que el renderizado, para no mostrarle al rastreador algo distinto de lo que ve la persona. |
| **Validación** | Más de 250 palabras en el HTML inicial de cada calculadora. |

### B9. Detalles menores

| Problema | Evidencia | Solución |
|---|---|---|
| La portada no tiene `og:url` ni datos estructurados `WebSite` y `Organization` | [sitio] HTML inicial de `/` | Añadirlos en `htmlDeInicio` (`scripts/prerender.mjs`) |
| `www` + ruta sin barra encadena 2 redirecciones | [sitio] `https://www.tuvozlaboral.com/derechos/vacaciones` → `/derechos/vacaciones` → `/derechos/vacaciones/` | En Nginx, redirigir `www` directamente a la URL final (o aceptarlo: es poco frecuente) |
| `Cache-Control` duplicado en `/assets/` | [sitio] `max-age=31536000` y `public, immutable` en dos cabeceras | Dejar una sola: `public, max-age=31536000, immutable` |
| Fuentes Roboto «math» y «symbols» descargadas en la portada | [sitio] Lighthouse | Se cargan por caracteres como «→» o «≈». Se pueden limitar los subconjuntos importando solo `latin` |
| Accesibilidad: `<dl>` mal estructurada en la ficha de la guía y la etiqueta del logo distinta de su texto | [sitio] Lighthouse, accesibilidad 97 en guías | Corregir el marcado en `Rights.tsx` y en `Layout.tsx` |

### Rendimiento (laboratorio, no son datos de usuarios reales)

Lighthouse 12.2.1, 10 de noviembre de 2026. «Móvil» es la simulación por defecto de Lighthouse (4G lenta y CPU limitada).

| Página | Móvil: rendimiento / LCP / CLS / TBT | Escritorio: rendimiento / LCP | SEO | Accesibilidad |
|---|---|---|---|---|
| `/` | 82 / 3,1 s / 0 / 400 ms | 100 / 0,7 s | 100 | 100 |
| `/derechos/vacaciones/` | 92 / 3,3 s / 0 / 60 ms | 89 / 1,5 s | 100 | 97 |
| `/calculadoras/prima/` | 93 / 3,0 s / 0 / 20 ms | 100 / 0,7 s | 100 | 100 |

- El tiempo hasta el primer byte de la portada fue de 0,35 s, y hay compresión gzip y caché de un año en `/assets/`.
- El LCP móvil queda un poco por encima del umbral «bueno» de 2,5 s. Hay unos 96 KB de JavaScript sin usar en la primera carga (49 KB del paquete principal y 47 KB del cliente de Supabase).
- **No hay datos de campo (CrUX)** con este tráfico. Search Console no mostrará el informe de Core Web Vitals hasta tener visitas suficientes.

---

## Hipótesis por confirmar (requieren el servidor, Search Console o Analytics)

| Hipótesis | Evidencia | Cómo confirmarla |
|---|---|---|
| **La portada en `http://` recibe 8 de los 13 clics.** Puede ser una indexación antigua de antes de activar HTTPS, o que el puerto 80 no redirija. | [GSC] `http://tuvozlaboral.com/` aparece con 8 clics y 16 impresiones. No se pudo probar desde aquí: el entorno solo permite HTTPS. | En el VPS: `curl -I http://tuvozlaboral.com/` debe responder `301 → https://tuvozlaboral.com/`. En Search Console, inspeccionar la URL `http://` y verificar que la canónica elegida por Google sea la `https`. |
| Cuántas de las 73 URLs del sitemap están indexadas. | No está en el Excel. | Search Console → Páginas (indexación) y Sitemaps: «Descubiertas», «Indexadas» y «Rastreada, sin indexar». |
| El 23 % de las impresiones viene de España (77 de 338). | [GSC] Son consultas genéricas como «acoso sexual laboral». | No es un error. Poner «Colombia» en títulos y descripciones filtra mejor la intención y mejora el CTR en Colombia. Confirmar en Search Console filtrando por país. |
| El tráfico móvil será mayoritario. | [GSC] El móvil tiene mejor posición media (18,8 frente a 41 del escritorio) y mejor CTR (7,6 % frente a 2,7 %). | Analytics: reparto de visitas por dispositivo a 30 días. |
| La hoja «Aparición en búsquedas» está vacía. | [GSC] | Normal: no hay resultados enriquecidos todavía. Revisar «Mejoras» en Search Console tras corregir los datos estructurados. |

---

## C. Páginas con mayor oportunidad SEO

Datos de Search Console, del 1 al 8 de noviembre de 2026. Las consultas por página se infieren por tema, porque el Excel no trae el cruce de consulta y página. La posición es la media de Search Console.

| URL | Consultas relevantes | Impresiones / clics | CTR / posición | Problema | Optimización | Prioridad y resultado esperado |
|---|---|---|---|---|---|---|
| `/derechos/calendario-laboral-del-ano/` | «cuando pagan las cesantias 2027», «cuando consignan las cesantias 2027» (9 impresiones en el grupo, posición 8,5–10,7) | 22+2 / 0 | 0 % / 9,05 | Está en la primera página pero sin clics: el título «Calendario laboral 2027: fechas de pago y cambios» no menciona las cesantías | Título y resumen con la fecha concreta (consignación de cesantías a más tardar el 14 de febrero, Ley 50 de 1990, art. 99) y un enlace visible a la guía de cesantías | **Alta.** Primeros clics de consultas sin la marca |
| `/derechos/cesantias-e-intereses/` | «intereses de las cesantias» (29), grupo «cesantías 2027» | 3 / 0 | 0 % / 24 | 267 palabras. Sin ejemplo ni fechas destacadas | Ampliarla (ver B6) con plazos, un ejemplo con el salario mínimo de 2026 y enlace a la calculadora | **Alta.** Temporada de enero y febrero: publicarla antes de diciembre |
| `/derechos/descanso-dominical-y-festivos/` | «dominical» (5), «compensatorios por domingos laborados» (91) | 10+8 / 0 | 0 % / 13,7 y 4,5 | Variante con barra en posición 4,5. Título de 104 caracteres | Acortar el título y corregir los enlaces internos (B1) para consolidar en una sola URL | **Alta.** Mejor CTR |
| `/derechos/salud-mental-y-riesgo-psicosocial/` | «salud mental en el trabajo» (83) | 9+5 / 0 | 0 % / 8,1 | Título de 92 caracteres | Acortarlo, con «salud mental en el trabajo» al principio | Media. Mejor CTR |
| `/derechos/seguridad-social-eps-pension-arl-y-caja/` | «salud pensión arl y caja de compensación» (7,5) | 5+5 / 0 | 0 % / 8 y 15,2 | Dividida entre dos variantes | B1, y un título que nombre los cuatro subsistemas | Media |
| `/derechos/inclusion-laboral-y-discapacidad/` | «inclusión laboral» (16 impresiones, 60,9), «ley de inclusion laboral» (32,4), «plan de inclusión laboral» (46,6) | 26+8 / 0 | 0 % / 46,7 | Es la página con más impresiones. Título de 100 caracteres | Título más corto con «Ley de inclusión laboral en Colombia» y la cuota (Ley 2466 de 2025) al inicio, verificando el umbral en la ley | Media. La consulta «inclusión laboral» es amplia y académica; la oportunidad está en «ley de inclusión laboral» y «cuota» |
| `/derechos/acoso-sexual-en-el-trabajo/` | «abusos sexuales en el trabajo» (15,9), «acoso sexual laboral» (61,6) | 24 / 0 | 0 % / 39,9 | 361 palabras. Parte de las impresiones viene de España | Ampliarla con la ruta de denuncia en Colombia (Ley 1010 de 2006, Ley 2365 de 2024) y poner «Colombia» en el título | Media |
| `/derechos/renuncia-y-preaviso/` | «puedo renunciar a mi trabajo si tengo contrato indefinido» (92,8), «preaviso contrato indefinido» (88) | 14+12 / 0 | 0 % / 61–77 | Dividida entre dos variantes. Responde bien (Ley 2466 de 2025, art. 47 del CST) pero compite con medios grandes | B1, y una entradilla que responda «sí, avisando con 30 días, sin multa» con la norma, más un enlace a la carta de renuncia | Media |
| `/calculadoras/prima/` | «calcular prima» (92), «simulador prima» (7), «formula de prima» (62) | 17 / 0 | 0 % / 69,2 | El título cambia tras JavaScript. HTML inicial casi vacío | B5 y B8: incluir la fórmula (salario × días / 360) y la norma en el HTML inicial. Enlazarla desde la guía de la prima | **Alta.** Temporada de diciembre: hacerlo antes del 1 de diciembre |
| `/herramientas/cartas/solicitud-de-vacaciones/` | «solicitud de vacaciones», «carta para pedir vacaciones», «modelo de carta…» (unas 10 consultas, posición 48–97) | 16 / 0 | 0 % / 48,6 | HTML inicial de 29 palabras. Ningún modelo visible sin JavaScript | Mostrar en el HTML inicial un modelo de ejemplo y las instrucciones | Media |
| `/derechos/vacaciones/` | «pago vacaciones» (76), «cuantos días de vacaciones tiene un trabajador» (94), «fechas de vacaciones por ley» (11) | 11+2 / 0 | 0 % / 54,6 | 312 palabras | Ampliarla (B6): 15 días hábiles (CST, art. 186), acumulación, compensación en dinero y un ejemplo de pago | **Alta** |
| `/derechos/liquidacion-al-terminar-el-contrato/` | «liquidación de contrato» (75), «a que tengo derecho si se termina mi contrato» (70) | 5+2 / 0 | 0 % / 39–49 | Compite con el título de la calculadora (B5) | Separar intenciones: la guía explica y la calculadora calcula. Enlazarlas entre sí | Media |

---

## D. Plan de acción por fases

### Fase 1 — Correcciones críticas

No se encontró ningún problema que impida rastrear o indexar el sitio. Esta fase reúne lo que **evita que se indexen páginas indebidas**:

| Tarea | Archivos | Dependencias | Riesgo | Validación |
|---|---|---|---|---|
| `noindex` en «guía no encontrada» (B2) | `src/pages/Rights.tsx` | Ninguna | Bajo | Renderizado con `noindex` |
| Metadatos y `noindex` en las reclamaciones (B3) | `src/pages/Claim.tsx` | Ninguna | Ninguno | Inspección de URL |
| Confirmar la redirección `http → https` en el VPS (hipótesis) | Nginx del VPS | Acceso al servidor | Bajo | `curl -I http://tuvozlaboral.com/` → 301 |

### Fase 2 — Optimización técnica

| Tarea | Archivos | Dependencias | Riesgo | Validación |
|---|---|---|---|---|
| Normalizar los enlaces internos a la URL canónica (B1) | `src/lib/meta.ts`, `src/components/GuideBody.tsx`, `ArticulosCst.tsx`, `Search.tsx`, `CompanyProfile.tsx`, `scripts/prerender.mjs` | Ninguna | Bajo | 0 enlaces con 301 en el rastreo |
| Una sola fuente de títulos para las herramientas (B5) | `scripts/seo-pages.mjs`, `src/lib/calculadoras.ts`, páginas de cartas | Ninguna | Bajo | Título del HTML inicial = título renderizado |
| Fechas de verificación y publicación en el prerender, y `datePublished` (B7) | `scripts/prerender.mjs`, `scripts/generar-sitemap.mjs` | Leer `created_at` y `last_verified_at` | Bajo | Prueba de resultados enriquecidos |
| «Cómo se calcula» y la norma en el HTML inicial de las calculadoras (B8) | `scripts/prerender.mjs`, `scripts/seo-pages.mjs` | Que el texto sea idéntico al de React | Bajo | Más de 250 palabras sin JavaScript |
| `og:url`, `WebSite` y `Organization` en la portada, y `BreadcrumbList` con barra (B9) | `scripts/prerender.mjs`, `src/pages/Rights.tsx` | Ninguna | Bajo | Validador de schema.org |
| Opcional: reducir el JavaScript inicial (cargar el cliente de Supabase solo cuando haga falta) y los subconjuntos de fuentes | `vite.config.ts`, `src/index.css` | Medir antes y después | Medio | LCP móvil de laboratorio < 2,5 s |

### Fase 3 — Optimización de contenidos

Todo pasa por el flujo editorial existente (`docs/sugerencias.md`): sugerencia de tipo `actualizar`, propuesta y revisión humana antes de aplicarla. Ningún texto legal cambia sin revisión.

1. **Títulos y resúmenes** de las 11 guías con títulos largos y de las 31 con descripciones largas, empezando por las de la tabla C (B4).
2. **Ampliar las guías cortas de alta demanda**, en orden de temporada:
   - prima (antes del 20 de diciembre) y cesantías (antes del 14 de febrero);
   - vacaciones (temporada de diciembre y enero);
   - salario mínimo (decreto de fin de año);
   - después despido, incapacidad, licencias, jornada y tipos de contrato.
3. **Calendario laboral:** destacar las fechas de cesantías e intereses, que ya generan impresiones en la primera página.
4. **Página de método editorial** y señales de autoría y revisión reales (B7).

### Fase 4 — Crecimiento orgánico

- **Datos de demanda:** usar Search Console como fuente principal. Exportar cada mes el cruce de consulta y página, que no viene en el Excel actual, y las búsquedas sin resultado del buscador interno (`node scripts/editorial.mjs busquedas`). No hay volúmenes de búsqueda de herramientas externas: cualquier volumen que se cite debe venir de una herramienta como Google Keyword Planner y decirlo.
- **Grupos temáticos.** Cada grupo tiene una guía principal, su calculadora y su carta:
  - terminación del contrato: liquidación, despido, renuncia y preaviso, carta de renuncia;
  - prestaciones: prima, cesantías, vacaciones, con sus calculadoras;
  - jornada: horas extra, recargos, dominicales, con las calculadoras de nómina;
  - reclamar: derecho de petición, conciliación, tutela, con la carta de derecho de petición.
- **Enlazado interno:** que cada guía enlace en el texto a su calculadora y a su carta, y cada herramienta a su guía. Ya existe `CalculatorGuideLinks`; hay que llevarlo también al HTML inicial.
- **Nuevas guías:** solo donde Search Console o el buscador interno muestren demanda sin una página que la responda, por ejemplo «compensatorio por trabajar domingos» o «cuántos días de incapacidad paga la empresa». Antes, comprobar que no compitan con una guía existente.

### Fase 5 — Seguimiento

Se miden las mismas métricas a los 30, 60 y 90 días de terminar cada fase, contra la línea base del 1 al 8 de noviembre de 2026 (338 impresiones, 13 clics, 2 de ellos sin la marca). Son metas de medición, no promesas: el posicionamiento depende también de la competencia y de Google.

| Métrica | Fuente | Qué se espera ver |
|---|---|---|
| Clics e impresiones **sin la marca** | Search Console (filtrar consultas que no contienen «tuvozlaboral») | Que crezcan |
| Posición media de los grupos de la tabla C | Search Console | Que mejore la posición de cada grupo |
| URLs sin barra en «Páginas» | Search Console | Que desaparezcan (B1) |
| Indexadas frente a enviadas en el sitemap | Search Console, Sitemaps | Que se acerque al 100 % de las 73 URLs |
| Soft 404 y «Excluida por noindex» | Search Console, Páginas | Reclamaciones excluidas y sin soft 404 |
| CTR de las guías con título acortado | Search Console | Comparación antes y después |
| Core Web Vitals de campo | Search Console o CrUX, cuando haya datos | LCP < 2,5 s, INP < 200 ms y CLS < 0,1 |

---

## Lo que ya está bien (no cambiar)

- Guías prerenderizadas con su texto completo, canónica, Open Graph, `Article` y `BreadcrumbList` (`scripts/prerender.mjs`).
- Sitemap de 73 URLs, todas con 200, canónicas coherentes y fecha `lastmod` en las guías.
- `robots.txt` que bloquea solo las rutas privadas (`/cuenta`, `/moderacion`, `/seguimiento/`, `/avisos`). El buscador `/buscar` lleva `noindex`.
- Redirecciones 301 de `www` a la versión sin www, y de las URLs sin barra a las que llevan barra.
- HSTS, `nosniff`, `X-Frame-Options`, gzip y caché de un año en los recursos con huella.
- Ningún título duplicado entre las 73 URLs.
- Lighthouse SEO 100 en las páginas probadas, y accesibilidad de 97 a 100.
