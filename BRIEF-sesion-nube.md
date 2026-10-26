# Encargo para la sesión en la nube (pegar como primer mensaje)

Responde y documenta TODO en español (el código en inglés; los textos de interfaz, el README, los commits y los reportes en español).

Repositorio: `Javier0618/Voz-Laboral`. Antes de nada, inspecciónalo y no sobrescribas archivos sin revisarlos. Trabaja en la rama `feat/fase-1-2` con commits pequeños y abre un PR contra la rama por defecto. No hagas merge.

## Objetivo
Construir VozLaboral (nombre provisional), una plataforma de transparencia laboral para Colombia donde los trabajadores comparten experiencias sobre empresas reales usando un alias público. Completa de forma FUNCIONAL y PROBADA las fases 1 y 2 y, si queda margen, la fase 3. Documenta el siguiente paso. Prohibido simular éxitos, dejar botones sin función o inventar resultados de pruebas.

## Stack
React 18, TypeScript, Vite, Tailwind CSS, react-router, `@supabase/supabase-js`, zod (esquemas compartidos) y Vitest con Testing Library y jsdom. Supabase: Postgres, Auth y Storage solo privado (adjuntos todavía SIN habilitar). Incluye un `.env.example` con valores ficticios marcados como tales. `service_role` nunca va en el frontend.

## Base de datos (`supabase/migrations/*.sql`)
Tablas: profiles, companies, company_aliases, experience_categories, experiences, evidence_files (preparada, con RLS cerrada), content_reports, company_responses, company_claims, appeals, moderation_events, legal_resources, legal_resource_sources, admin_roles y security_events. Cada una con PK/FK, CHECK o enums de estado, índices (pg_trgm sobre el nombre y los alias), `created_at`/`updated_at` con trigger y reglas antiduplicado.

- Alias único sin distinguir mayúsculas, que no se parezca al correo y con palabras reservadas bloqueadas (admin, moderador, vozlaboral…). Las lecturas públicas nunca devuelven el email ni `auth.uid`: usa vistas o funciones `security definer` que solo expongan el alias y los campos publicados.
- Estados de una experiencia: en_revision, publicada, requiere_ajustes, en_disputa, restringida y retirada. El autor no puede cambiar el estado ni el author_id, ni aprobar su propia publicación. Los cambios de estado se hacen solo mediante una RPC de moderación que exige rol y registra en moderation_events el estado anterior, el nuevo, la fecha, el motivo, el moderador y una nota interna.
- moderation_events y security_events son de solo inserción. Ningún usuario ordinario puede hacer UPDATE ni DELETE en ellas.
- admin_roles (moderator, admin) no es modificable por los usuarios. Los administradores no son superusuarios de la base de datos.
- Las 10 categorías iniciales se cargan por migración: Pago de salarios; Contrato y condiciones laborales; Ascensos y ajustes salariales; Abuso de autoridad; Posible acoso laboral; Jornadas y descansos; Seguridad y salud en el trabajo; Discriminación y trato desigual; Organización y administración; Otras situaciones laborales.
- Las migraciones no incluyen empresas ni experiencias inventadas. Los datos de demo, si los hay, van solo en `supabase/seed.dev.sql`, con nombres claramente ficticios y marcados como prueba.
- Relato de entre 200 y 5000 caracteres. Límite de 3 publicaciones cada 24 h por cuenta, mediante trigger. Hash antiduplicado por autor.
- Estadísticas públicas: conteo por categoría, ocultando las categorías con menos de 3 publicaciones, y el periodo cubierto. Sin puntuaciones ni rankings.
- Al eliminar una cuenta, sus publicaciones se anonimizan y se conservan los registros necesarios para auditoría. Plazos documentados en `docs/retencion.md`.
- RLS activado en TODAS las tablas, con políticas explícitas para anon, authenticated, moderator y admin.

## Pruebas de seguridad reales (obligatorias)
Si no hay Docker ni `supabase start`, usa `@electric-sql/pglite` en Vitest: crea un stub del esquema auth (`auth.users` y `auth.uid()` leyendo `request.jwt.claims`), los roles anon y authenticated con grants al estilo de Supabase, aplica las migraciones reales y ejecuta las consultas con `SET ROLE`. Verifica antes que RLS se aplica de verdad en PGlite.

Las pruebas deben comprobar que:
- un usuario no ve publicaciones no publicadas de otra cuenta;
- no puede suplantar el author_id;
- no puede aprobar su propio contenido;
- no puede asignarse un rol;
- anon no ve emails, borradores, reclamaciones ni moderación;
- las reclamaciones no revelan al autor;
- moderation_events es inmutable;
- las RPC administrativas fallan sin rol;
- un moderador puede moderar y queda registro.

Corrige y vuelve a ejecutar hasta que pasen.

## Frontend
- **Inicio.**
- **Empresas:** búsqueda por nombre, alias, ciudad y sector, con paginación.
- **Perfil de empresa:** número de experiencias visibles, distribución por categoría con un aviso de que solo refleja lo que ha recibido la plataforma, periodo cubierto, experiencias recientes, respuestas de la empresa diferenciadas, botón de reportar y forma de pedir correcciones. Sin NIT.
- **Experiencias:** filtros por categoría, empresa y periodo.
- **Tus derechos:** lee legal_resources. No inventes normas ni enlaces: lo que no esté verificado queda como "pendiente de verificación".
- **Compartir experiencia:** empresa, categoría, periodo, relación (actual, anterior o prefiero no decirlo), título opcional, relato que distinga entre lo visto directamente y lo conocido por terceros, casilla "dispongo de documentos", aceptación de las reglas, avisos si el texto parece contener un email, teléfono o cédula, vista previa antes de enviar y borrador que se conserva aunque haya un error.
- **Mi cuenta:** registro, confirmación de correo, inicio y cierre de sesión, recuperación de contraseña, alias, historial con el estado y el motivo de moderación, y solicitud de eliminación de la cuenta.
- **Panel de administración:** ruta separada, visible solo para roles autorizados. La seguridad real la impone la base de datos.

Accesibilidad WCAG 2.2 AA: teclado, foco visible, etiquetas, contraste, estados de carga, vacío y error, confirmaciones accesibles en lugar de alert() y diseño adaptable desde 360 px. Si faltan las variables de Supabase, se muestra un aviso de configuración en lugar de fallar o simular datos.

## Diseño profesional (decidido)
- **Tono:** sobrio y confiable. Ni red social, ni portal gubernamental viejo, ni sensacionalista. La marca se cambia en `src/config/brand.ts` y en los tokens CSS de `:root`.
- **Paleta:**
  - tinta `#0F2440` y navy `#1B3A5C`;
  - verde azulado `#0F766E` para las acciones, con tinte `#E6F2F1`;
  - blanco `#FFFFFF`, niebla `#F3F5F8` y línea `#D9DEE5`;
  - texto secundario `#4A5566`;
  - advertencia `#B45309` y peligro `#B42318`.
- **Lo que no se usa:** fondos crema y degradados.
- **Tipografía:** autoalojada, sin Google Fonts, por privacidad. `@fontsource-variable/newsreader` para titulares y relatos, `@fontsource-variable/instrument-sans` para la interfaz. Líneas de menos de 75 caracteres, sentence case, sin etiquetas en mayúsculas y sin flechas en los botones.
- **Elemento memorable:** un hero alineado a la izquierda con un buscador de empresas grande y, al lado, el diagrama "Lo que ven otros / Lo que queda privado" (el alias es visible; el correo, la IP y la cuenta quedan ocultos).
- **Resto de la interfaz:** listas en lugar de rejillas de tarjetas, bordes finos y sin sombras exageradas.
- **Estados de moderación:** un sistema visual consistente, con chips que incluyen texto.
- **Microcopy:** voz activa y coherente. "Enviar a revisión" produce el aviso "Enviada a revisión".
- **Pie de página:** política de datos, términos, reglas, privacidad y contacto. Las páginas legales llevan la marca "Requiere revisión de abogado colombiano".

## Entrega
- README en español: instalación, Supabase, migraciones, pruebas y despliegue.
- `docs/checklist-seguridad.md`.
- `docs/checklist-legal.md`, con la Ley 1581 de 2012 y el Decreto 1074 de 2015 pendientes de verificar con un abogado.
- `docs/decisiones.md`.
- Ejecuta el build, el typecheck y las pruebas, y pega la salida real en el PR.
- Reporte final con: funcionalidades, archivos, migraciones, variables de entorno, pruebas y sus resultados, riesgos, pasos para ejecutar y lo que falta antes del lanzamiento público.

## Contexto
El usuario pidió trabajar sobre este repo de GitHub y no en su equipo local. El proyecto se divide en 6 fases: inspección; base; publicaciones; moderación, reclamaciones y appeals; guías, políticas y privacidad, y archivos solo con los controles listos; pruebas y entrega. Prioriza la seguridad y la claridad sobre la cantidad de funcionalidades.
