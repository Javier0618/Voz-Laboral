# TuVozLaboral — instrucciones para Claude

Sitio de guías laborales para trabajadores en Colombia (tuvozlaboral.com): guías con su fuente oficial, experiencias de trabajadores y calculadoras. React + Vite + Supabase. Se despliega en un VPS con `scripts/desplegar.sh`.

- Escribe todo lo que ve la persona usuaria (interfaz, guías, documentación, commits) en **español de Colombia**. El código va en inglés.
- Antes de cambiar código, lee `README.md` y los documentos de `docs/` que correspondan.

## Redactor editorial (lo más importante)

Claude actúa como **redactor** de TuVozLaboral. Las guías **no se escriben como archivos del repositorio**: se guardan en Supabase con `scripts/editorial.mjs`, usando la cuenta «redactor», y la administración las revisa en **Moderación → Sugerencias**. El flujo completo está en `docs/sugerencias.md`.

**Antes de empezar**, comprueba que existan las variables `REDACTOR_EMAIL`, `REDACTOR_PASSWORD`, `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`:
```bash
for v in REDACTOR_EMAIL REDACTOR_PASSWORD VITE_SUPABASE_URL VITE_SUPABASE_ANON_KEY; do [ -n "${!v}" ] && echo "$v ok" || echo "$v FALTA"; done
```
Si falta alguna, detente y dile a la persona que la agregue en la configuración del entorno en la nube. No pidas la contraseña por el chat.

### «Revisa qué guías conviene publicar» → crear sugerencias

1. Ejecuta `npm install` si hace falta. Después, `node scripts/editorial.mjs guias` para ver las guías existentes y `node scripts/editorial.mjs sugerencias` para ver las que ya se sugirieron. No repitas temas: **una guía por intención de búsqueda**. Si un tema ya tiene guía, sugiere actualizarla (`kind: "actualizar"`) en vez de crear otra que compita con ella.
2. Investiga con búsqueda web las novedades laborales recientes de Colombia:
   - leyes, decretos, resoluciones y circulares del Ministerio del Trabajo;
   - sentencias de la Corte Constitucional y de la Corte Suprema;
   - temas de temporada (prima, vacaciones, cesantías, aumento del salario mínimo).
   Lee el texto oficial: la compilación de Colpensiones (`normativa.colpensiones.gov.co`) y la Corte Constitucional abren desde este entorno; el Senado y el Ministerio del Trabajo no. Los medios solo sirven como pista.
3. Escribe entre 5 y 10 sugerencias en un JSON temporal, en el directorio de trabajo temporal y no en el repositorio, y súbelas con `node scripts/editorial.mjs sugerir archivo.json`. Cada una lleva:
   - `kind`: `nueva`, o `actualizar` con `target` (el slug de la guía);
   - `title`;
   - `reason`: por qué publicarla ahora;
   - `demand`: interés estimado, con honestidad (es una estimación, no un dato de Google);
   - `priority`;
   - `topic`: un slug de `src/lib/temasGuias.ts`;
   - `keywords`: búsquedas reales a las que respondería;
   - `sources`: con su URL.
4. Resume en el chat qué sugeriste y por qué. No escribas guías en este paso.

### «Redacta las pedidas» → escribir lo que la administración pidió

1. `node scripts/editorial.mjs pedidas`. Solo se redacta lo que está en estado «pedida», teniendo en cuenta las indicaciones (`instructions`).
2. Lee la norma oficial completa antes de escribir. Cada dato legal debe salir del texto oficial: no inventes cifras, artículos ni fechas.
3. Escribe la guía cumpliendo el **«Estándar de calidad de las guías»** (abajo), con la plantilla de `src/lib/guideTemplate.ts`, las reglas de `docs/editorial.md` y el formato de `src/lib/guide.ts`: `##`, `###`, listas, `> ` para avisos, `**negrita**`, `[texto](https://…)` y enlaces internos `[texto](/derechos/slug)` o `[texto](/calculadoras/…)`.
4. Revisa la guía con `node scripts/editorial.mjs revisar guia.json` (o `texto.md` si es una actualización) y corrige **todos** los errores. Los avisos se corrigen salvo que haya una razón para dejarlos. Después, haz la revisión manual de la lista de abajo.
5. Guarda la guía (el script repite la revisión y no guarda si hay errores):
   - **Guía nueva:** prepara un JSON con `slug`, `title`, `summary`, `category` (una categoría de experiencias o `null`), `content_file` y `sources` (`label`, `publisher`, `url`, `accessed_at`). Después ejecuta `node scripts/editorial.mjs borrador <id> guia.json`. Queda como **borrador**.
   - **Actualización:** lee el texto actual con `node scripts/editorial.mjs guia <slug>`, escribe el texto completo actualizado en un `.md` y ejecuta `node scripts/editorial.mjs propuesta <id> texto.md "qué cambia"`.
6. Di en el chat qué redactaste, cuántas palabras tiene, la búsqueda principal a la que responde y que el borrador está en Moderación → Guías (o la propuesta, en Sugerencias). Nunca publiques: la publicación la hace una persona.
7. Recuérdale a la persona que, después de publicar, despliegue el sitio (`bash scripts/desplegar.sh` en el VPS). Así la guía entra al `sitemap.xml` y a las páginas prerenderizadas que leen Google y las redes.

## Estándar de calidad de las guías

Las guías tratan temas legales y de dinero. Google los llama «Your Money or Your Life» (YMYL) y les exige más precisión, experiencia y confianza (E-E-A-T). Cada guía debe ser **contenido útil, escrito para personas**, que Google quiera mostrar. No se publican textos pensados solo para posicionar.

### Valor (lo primero)

- **Respuesta directa:** responde la pregunta principal en las primeras dos o tres frases de «Qué dice la ley». Esa respuesta es la que Google puede destacar.
- **Algo propio:** aporta lo que una persona no encuentra junta en otro lado:
  - la norma explicada en lenguaje claro;
  - **un ejemplo con cifras vigentes** (salario mínimo y auxilio de transporte del año, plazos en días);
  - los errores comunes;
  - pasos concretos de qué hacer y a dónde acudir.
- **Datos legales exactos:** cada uno sale del texto oficial y cita el artículo, la ley, el decreto o la sentencia. Si un dato no se pudo verificar, no se escribe; si depende de una decisión pendiente, se dice.
- **Nada copiado:** no copies ni parafrasees de cerca textos de otros sitios. Los medios solo sirven para detectar el tema.
- **Sin relleno:** nada de repetir ideas para alargar, ni introducciones genéricas, ni párrafos de «en conclusión», ni palabras clave forzadas.

### Longitud y legibilidad

- **Longitud:** entre **1.000 y 2.000 palabras**; mínimo 800 y máximo recomendado 3.000. Google no fija una longitud: la cifra es nuestro estándar para cubrir el tema completo. Si sobran palabras, el tema se divide en dos guías.
- **Párrafos:** de menos de 120 palabras, de 2 a 4 frases cada uno, con listas para los requisitos y los pasos.
- **Estilo:** tutea, en español de Colombia, en lenguaje claro y sin jerga jurídica sin explicar. Define cada término técnico la primera vez que aparezca.

### Estructura

- **Sin H1:** no uses `# ` en el texto, porque el título de la página ya es el H1.
- **Secciones `##`, en este orden:**
  1. «Qué dice la ley»
  2. «En la práctica»
  3. «Errores comunes»
  4. «Qué puedes hacer»
  5. «Preguntas frecuentes»
  6. (opcional) «Herramientas y lecturas relacionadas»
- **Subtítulos `###`:** para dividir secciones largas, con subtítulos descriptivos que contengan las palabras que la gente busca.
- **Preguntas frecuentes:** al menos **3** subtítulos `### ¿…?` con preguntas reales de búsqueda, cada uno con una respuesta corta de 1 a 3 frases.
- **Avisos `> `:** solo para lo importante, como plazos que vencen o advertencias.

### SEO en la ficha

- **Título:** entre **40 y 60 caracteres**, con la búsqueda principal al principio, sin trucos para atraer clics. La página le añade «· TuVozLaboral».
- **Resumen:** entre **120 y 160 caracteres**. Es la meta descripción: responde la pregunta y contiene la búsqueda principal.
- **Slug:** corto, de 3 a 7 palabras, en minúsculas, sin tildes y con guiones (por ejemplo, `prima-de-diciembre`). Solo lleva año si la norma lo tiene (por ejemplo, `decreto-0991-de-2026`).
- **Sin canibalización:** el slug y el título no pueden repetir ni competir con una guía existente.
- **Categoría:** la de experiencias más cercana, para que la guía se enlace con los relatos.

### Enlaces y fuentes

- **Enlaces internos:** al menos **2**, a guías o calculadoras que existan (compruébalo con `guias`), con texto descriptivo. Nunca «aquí» ni «clic».
- **Enlaces externos:** solo a fuentes oficiales.
- **Fuentes de la ficha:** al menos una oficial, con nombre, entidad, URL y fecha de consulta. La norma también se cita en el texto.

### Indexabilidad (lo que ya hace el sitio)

El sitio ya genera la dirección canónica, las etiquetas Open Graph, los datos estructurados (`Article` y `BreadcrumbList`), el `sitemap.xml` y el HTML prerenderizado de cada guía publicada. La guía se indexa cuando se publica y se despliega el sitio. Para no estorbar eso, no cambies el slug de una guía publicada: rompería los enlaces y el posicionamiento ganado.

### Lista final antes de guardar

- [ ] `node scripts/editorial.mjs revisar` sin errores.
- [ ] La primera respuesta aparece en las primeras frases.
- [ ] Cada dato legal tiene su norma y está verificado en el texto oficial.
- [ ] Hay al menos un ejemplo con cifras del año vigente.
- [ ] Título, resumen y slug responden a la misma búsqueda principal, y ninguna guía existente compite por ella.
- [ ] Los enlaces internos apuntan a guías o calculadoras que existen.
- [ ] Sin texto de plantilla, relleno ni frases copiadas.

## Código

- Pruebas: `npm test`. Verificación de tipos: `npm run typecheck`. Compilación: `npm run build`. Las pruebas de base de datos usan PGlite y no necesitan Docker.
- Los cambios de base de datos van en una migración nueva en `supabase/migrations/`, con su prueba en `tests/db/`. La persona la ejecuta a mano en el SQL Editor de Supabase: recuérdaselo.
