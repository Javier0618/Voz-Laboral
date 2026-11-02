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

1. Ejecuta `npm install` si hace falta. Después, `node scripts/editorial.mjs guias` para ver las guías existentes y `node scripts/editorial.mjs sugerencias` para ver las que ya se sugirieron. No repitas temas.
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
3. Escribe la guía con la plantilla de `src/lib/guideTemplate.ts` y las reglas de `docs/editorial.md`:
   - **Secciones:** «Qué dice la ley», «En la práctica», con un ejemplo en pesos si aplica, «Errores comunes», «Qué puedes hacer» y enlaces.
   - **Formato:** el de `src/lib/guide.ts`: `##`, `###`, listas, `> ` para avisos, `**negrita**`, `[texto](https://…)` y enlaces internos `[texto](/derechos/slug)` o `[texto](/calculadoras/…)`.
   - **SEO:** el título responde a la búsqueda; el resumen, de 20 a 400 caracteres, sirve como meta descripción; el slug es corto, en minúsculas y con guiones.
   - **Enlaces internos:** a guías y calculadoras existentes.
4. Guarda la guía:
   - **Guía nueva:** prepara un JSON con `slug`, `title`, `summary`, `category` (una categoría de experiencias o `null`), `content_file` y `sources` (`label`, `publisher`, `url`, `accessed_at`). Después ejecuta `node scripts/editorial.mjs borrador <id> guia.json`. Queda como **borrador**.
   - **Actualización:** lee el texto actual con `node scripts/editorial.mjs guia <slug>`, escribe el texto completo actualizado en un `.md` y ejecuta `node scripts/editorial.mjs propuesta <id> texto.md "qué cambia"`.
5. Di en el chat qué redactaste y que el borrador está en Moderación → Guías (o la propuesta, en Sugerencias). Nunca publiques: la publicación la hace una persona.

## Código

- Pruebas: `npm test`. Verificación de tipos: `npm run typecheck`. Compilación: `npm run build`. Las pruebas de base de datos usan PGlite y no necesitan Docker.
- Los cambios de base de datos van en una migración nueva en `supabase/migrations/`, con su prueba en `tests/db/`. La persona la ejecuta a mano en el SQL Editor de Supabase: recuérdaselo.
