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

Estados: `nueva → pedida → redactada`. Además, `descartada` y `existente` se pueden reabrir.

## Configuración (una sola vez)

1. **Migración.** Ejecuta `supabase/migrations/20261102002200_guide_suggestions.sql` en el SQL Editor de Supabase.
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
node scripts/editorial.mjs borrador <id> guia.json   # guarda una guía nueva como borrador
node scripts/editorial.mjs propuesta <id> texto.md "qué cambia"
node scripts/editorial.mjs revisar guia.json      # revisión de calidad y SEO, sin conectarse
```

`borrador` y `propuesta` repiten esa revisión y no guardan nada si encuentran errores: longitud mínima, secciones de la plantilla, preguntas frecuentes, enlaces internos, título, resumen, slug, fuentes y restos de plantilla. Los criterios completos están en `CLAUDE.md`, en «Estándar de calidad de las guías».

El formato de los archivos está al inicio del script. Una sugerencia repetida, con el mismo título aunque cambien las mayúsculas o las tildes, no se duplica mientras siga abierta.

## Más adelante: que funcione solo

Con tareas programadas de Claude Code, la revisión puede correr sola:
- una tarea semanal que crea sugerencias;
- una tarea cada pocas horas que redacta las pedidas.

Usan el mismo script y las mismas credenciales del paso 4. Antes de activarlas, confirma que tu plan incluye tareas programadas.

## Sobre «lo que la gente busca»

El campo «Interés» es una estimación de Claude a partir de noticias, temporada y preguntas frecuentes, no un dato de Google. Para datos reales, conecta más adelante Google Search Console, que es gratis: muestra con qué búsquedas ya llegan al sitio.
