# Lista de comprobación de seguridad

Leyenda: ✅ hecho y probado · 🟡 hecho, pendiente de verificar en Supabase real · ⬜ pendiente

## Base de datos y permisos

- ✅ RLS activado en todas las tablas de `public` (lo comprueba una prueba).
- ✅ Se revocan los privilegios por defecto de Supabase y se conceden por columna.
- ✅ Anónimos sin acceso a perfiles, correos, borradores, reclamaciones, reportes, moderación, NIT ni archivos.
- ✅ Un usuario no ve publicaciones no publicadas de otra cuenta.
- ✅ Un usuario no puede fijar `author_id` ni `status` al crear o editar.
- ✅ Un usuario no puede aprobar su propio contenido; un moderador tampoco.
- ✅ Un usuario no puede asignarse roles ni cambiar el estado de su cuenta.
- ✅ Las reclamaciones no revelan al autor (sin acceso a `author_id` ni al correo).
- ✅ `moderation_events` es inmutable incluso para el propietario de la base de datos, salvo la purga programada.
- ✅ Las funciones administrativas fallan sin rol y registran el intento.
- ✅ Límites de frecuencia y antiduplicados en el servidor.
- ✅ Envíos sin cuenta solo por `submit_anonymous_experience()`: el token de seguimiento no se guarda (solo su hash) y nadie puede leer el hash desde la API.
- ✅ Reacciones y comentarios exigen cuenta con alias; no se puede reaccionar o comentar en nombre de otra cuenta ni sobre contenido no publicado; nadie ve quién reaccionó.
- ✅ Los comentarios con datos personales quedan retenidos y solo los ve quien los escribió; solo la moderación los oculta o publica, con registro.
- 🟡 Repetir `npm run test:db` contra `supabase start` (Postgres de Supabase con su Auth real) antes del lanzamiento.
- 🟡 Ejecutar el *Security Advisor* del panel de Supabase y revisar sus avisos. Las funciones `security definer` y el esquema `private` son intencionados.
- ⬜ Prueba de extremo a extremo con dos cuentas reales y la clave `anon`, haciendo peticiones REST manipuladas contra el proyecto de Supabase real (pendiente de que el proyecto esté conectado).

## Autenticación

- ✅ Registro con confirmación de correo (`emailRedirectTo`), recuperación de contraseña y PKCE.
- ✅ Mensaje idéntico en la recuperación de contraseña, exista o no la cuenta.
- 🟡 En Supabase → Auth: activar «Confirm email», la longitud mínima de contraseña (10) y la protección de contraseñas filtradas.
- 🟡 Configurar las URL de redirección permitidas (solo los dominios propios).
- ⬜ Activar el CAPTCHA de Supabase Auth (hCaptcha o Turnstile) en el registro.
- ⬜ **Antes de abrir el envío sin cuenta al público:** CAPTCHA (Turnstile) verificado en una Edge Function antes de llamar a `submit_anonymous_experience()`. Hoy solo hay un freno global de 30 envíos por hora, un campo trampa y un tiempo mínimo de redacción.
- ⬜ Configurar un SMTP propio para los correos de Auth (el de Supabase tiene límites estrictos).

## Aplicación

- ✅ Ninguna clave `service_role` en el frontend; solo `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
- ✅ Los errores se traducen a mensajes sin detalles internos (prueba unitaria).
- ✅ Sin `dangerouslySetInnerHTML`: los relatos se muestran como texto.
- ✅ Los enlaces externos usan `rel="noopener noreferrer"`.
- ⬜ Cabeceras de seguridad en el hosting: `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` y `frame-ancestors 'none'`.
- ⬜ Monitorización de errores sin datos personales (sin correos ni textos de relatos).

## Archivos de respaldo (fase 5, no habilitada)

- ⬜ Bucket privado con políticas de Storage por rol.
- ⬜ Validar el tipo real (*magic bytes*) y el tamaño en una Edge Function.
- ⬜ Eliminar metadatos (EXIF, PDF) y avisar de que eso no anonimiza el contenido.
- ⬜ URL firmadas de corta duración solo para moderación, con registro de cada acceso.
- ⬜ Plazo de conservación y borrado.

## Operación

- ⬜ Programar `purge_expired_records()` (pg_cron) y el procesamiento de eliminaciones.
- ⬜ Procedimiento de respuesta ante incidentes: responsables, contención, notificación a la SIC y a los titulares (revisión jurídica).
- ⬜ Copias de seguridad y prueba de restauración.
- ⬜ Rotación de claves y revisión periódica de quién tiene rol de administración.
