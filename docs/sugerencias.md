# Sugerencias editoriales

Claude actúa como **redactor**: revisa fuentes oficiales y especializadas, propone temas de guías en **Moderación → Sugerencias** y redacta las que la administración pide. Todo lo que escribe entra como **borrador** o como **propuesta**: nada se publica sin que una persona lo revise.

No usa ninguna API de pago. Funciona en las conversaciones con Claude Code, con el cupo del plan de Claude que ya tienes.

## Flujo

1. **Sugerir.** En una conversación, pide «revisa qué guías conviene publicar». Claude:
   - revisa las fuentes;
   - compara con las guías existentes;
   - crea sugerencias con el motivo, el interés estimado, las búsquedas a las que responderían y sus fuentes.
2. **Decidir.** En Moderación → Sugerencias, cada sugerencia nueva tiene tres botones:
   - **Redactar guía** (o «Redactar actualización»), con indicaciones opcionales;
   - **Ya la tenemos**;
   - **Descartar**.
3. **Redactar.** En una conversación, pide «redacta las sugerencias pedidas». Claude escribe la guía con la plantilla editorial (`docs/editorial.md`), las fuentes oficiales y lo necesario para buscadores. Después la guarda:
   - una **guía nueva** queda como borrador en Moderación → Guías;
   - una **actualización** queda como propuesta en la sugerencia, con «Ver propuesta» y «Aplicar a la guía».
4. **Publicar.** Revisas el borrador en el editor de siempre y lo publicas.

Estados: `nueva → pedida → redactada`. Cuando publicas la guía (o aplicas la actualización), la sugerencia pasa a la pestaña **Publicadas**. Las `descartada` y `existente` se pueden reabrir o **eliminar** de forma definitiva.

Las sugerencias cubren todo lo relacionado con el trabajo, no solo la ley: normas y posibles cambios, temporadas (prima, cesantías), empleo y vida laboral (buscar trabajo, entrevistas, bienestar, tendencias) y el dinero del trabajador. Cada publicación es de tipo **legal** (cita la norma y usa la plantilla) o **informativa** (estructura libre, sin obligación de citar leyes). El tema «Empleo y vida laboral» del índice reúne las publicaciones generales; puedes cambiar el tema de cualquier guía en el editor.

## Configuración (una sola vez)

1. **Migraciones.** Ejecuta en el SQL Editor de Supabase `supabase/migrations/20261102002200_guide_suggestions.sql` , `20261102002300_guide_topics_and_suggestion_delete.sql` y `20261102002400_site_search.sql` (buscador). Para que el redactor suba gráficos al cuerpo de las guías, también `20261103002600_redactor_guide_images.sql`. Deben estar aplicadas **antes** de desplegar el código que las usa.
2. **Cuenta del redactor.** Regístrate en el sitio con un correo propio solo para esto, por ejemplo `redaccion.tuvozlaboral@gmail.com`. Confirma el correo y elige un alias, por ejemplo `redaccion`.
3. **Rol.** En el SQL Editor:
   ```sql
   insert into public.admin_roles (user_id, role)
   select id, 'redactor' from auth.users where email = 'redaccion.tuvozlaboral@gmail.com';
   ```
   El rol «redactor» solo puede:
   - crear sugerencias;
   - consultar las guías existentes;
   - guardar borradores y propuestas de lo que la administración pidió.

   No puede publicar, borrar, moderar ni ver datos de personas usuarias.
4. **Credenciales para Claude (no van en el VPS).** El script lo ejecuta Claude en su entorno en la nube, no tu servidor. El `.env` del VPS no cambia, y la contraseña del redactor nunca se guarda allí. No pegues las credenciales en el chat. En Claude Code, abre el menú del entorno en la nube (barra de título de la sesión) → **Edit**. Agrega como variables de entorno:
   - `REDACTOR_EMAIL`
   - `REDACTOR_PASSWORD`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

   Las sesiones nuevas las leen solas.

## Herramienta: `scripts/editorial.mjs`

```bash
node scripts/editorial.mjs guias                     # guías existentes, también borradores
node scripts/editorial.mjs guia <slug>               # texto de una guía
node scripts/editorial.mjs sugerencias [estado]      # sugerencias
node scripts/editorial.mjs sugerir sugerencias.json  # crea sugerencias
node scripts/editorial.mjs pedidas                   # pedidas, con tus indicaciones
node scripts/editorial.mjs busquedas [días]          # lo que se buscó en el sitio sin resultados
node scripts/editorial.mjs borrador <id> guia.json   # guarda una guía nueva como borrador
node scripts/editorial.mjs propuesta <id> texto.md "qué cambia"
node scripts/editorial.mjs revisar guia.json      # revisión de calidad y SEO, sin conectarse
node scripts/editorial.mjs imagen <slug> grafico.jpg "descripción"   # sube un gráfico para el cuerpo de la guía
node scripts/editorial.mjs enlaces guia.json          # comprueba que los enlaces internos existan
```

`borrador` y `propuesta` repiten esa revisión y no guardan nada si encuentran errores: longitud mínima, secciones de la plantilla, preguntas frecuentes, enlaces internos, título, resumen, slug, fuentes, restos de plantilla y títulos anzuelo. Además rechaza tablas, secciones finales de fuentes o fechas y enlaces internos rotos. También avisa, sin bloquear, si falta la entradilla o quedan muletillas (ver `docs/estilo-editorial.md`). Los criterios completos están en `CLAUDE.md`, en «Estándar de calidad de las guías».

El formato de los archivos está al inicio del script. Una sugerencia repetida, con el mismo título aunque cambien las mayúsculas o las tildes, no se duplica mientras siga abierta.

## Más adelante: que funcione solo

Con tareas programadas de Claude Code, la revisión puede correr sola:
- una tarea semanal que crea sugerencias;
- una tarea cada pocas horas que redacta las pedidas.

Usan el mismo script y las mismas credenciales del paso 4. Antes de activarlas, confirma que tu plan incluye tareas programadas.

## Sobre «lo que la gente busca»

El buscador del sitio (`/buscar`, migración `20261102002400_site_search.sql`) cuenta de forma anónima los términos que se buscan: solo el término normalizado, el día, cuántas veces y cuántos resultados hubo. No guarda persona, cuenta, IP ni navegador, descarta términos con números largos (podrían ser una cédula o un teléfono) y borra lo que tenga más de 180 días. Las búsquedas sin resultado aparecen arriba de Moderación → Sugerencias y el redactor las consulta con `busquedas`.

Fuera de eso, el campo «Interés» es una estimación de Claude a partir de noticias, temporada y preguntas frecuentes, no un dato de Google. Para datos reales, conecta más adelante Google Search Console, que es gratis: muestra con qué búsquedas ya llegan al sitio.

## Asistente de investigación desde Moderación

En **Moderación → Sugerencias**, el bloque «Asistente de investigación editorial» permite trabajar con ChatGPT sin conectar una API ni pagar consumo adicional:

1. Pulsa **Descargar contexto de investigación**. El navegador prepara un JSON con el catálogo de guías, las búsquedas internas sin resultados de los últimos 180 días y las sugerencias existentes. También incluye consultas iniciales para buscar novedades en fuentes oficiales.
2. Adjunta ese JSON en una conversación de ChatGPT y copia las instrucciones que aparecen en el mismo bloque.
3. ChatGPT realiza la investigación web, contrasta las novedades con fuentes oficiales y devuelve un JSON con las recomendaciones.
4. Pulsa **Importar recomendaciones JSON** y selecciona el archivo devuelto por ChatGPT.
5. Revisa cada propuesta en la pestaña **Nuevas**. La importación no redacta guías, no aplica actualizaciones ni publica contenido.

El importador valida el formato, las fuentes HTTPS, los temas, los slugs de las guías que se quieren actualizar y los duplicados exactos. Las recomendaciones que no superen la validación se informan para corregirlas; las demás se guardan como sugerencias nuevas.

**Alcance:** la investigación web se ejecuta en ChatGPT, no en el servidor de TuVozLaboral. El panel no hace consultas directas a Google ni consume una API. Las consultas sugeridas pueden copiarse y ejecutarse manualmente en Google. Tampoco equivale a conectar Google Search Console: las búsquedas internas del sitio no son datos de impresiones o clics de Google.

La investigación jurídica debe distinguir entre normas vigentes, proyectos, anuncios y decisiones judiciales. Cada recomendación debe incluir al menos una fuente HTTPS verificable y la revisión editorial sigue siendo obligatoria.

