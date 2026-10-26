# Checklist de seguridad

Leyenda: [x] hecho y probado · [~] hecho sin prueba automatizada · [ ] pendiente.

## Base de datos

- [x] RLS activado en todas las tablas de `public`. Una prueba falla si alguna tabla queda sin RLS.
- [x] Privilegios por defecto de Supabase revocados tabla por tabla; las columnas se conceden de forma explícita.
- [x] La tabla `experiences` no es legible por `anon`. Lo público va por `public_experiences`, que no expone `author_id`.
- [x] `companies.proposed_by` no es legible por nadie desde la API.
- [x] Las lecturas públicas nunca devuelven email ni `auth.uid` (prueba sobre las columnas de las vistas).
- [x] El autor no puede cambiar `status`, `author_id`, `published_at` ni `moderation_reason` (privilegios de columna y trigger).
- [x] Nadie aprueba su propio contenido, tampoco un moderador.
- [x] Los cambios de estado solo se hacen por RPC con rol, con motivo obligatorio y registro en `moderation_events`.
- [x] `moderation_events` y `security_events` son de solo inserción, incluso para el propietario de la tabla (trigger).
- [x] `admin_roles` no es modificable por usuarios; `admin_set_role` exige admin y no permite cambiar el propio rol.
- [x] Las RPC administrativas fallan sin rol y no son ejecutables por `anon`.
- [x] Límite de 3 experiencias cada 24 h por cuenta (trigger) y hash antiduplicado por autor.
- [x] Las reclamaciones de empresas no dan acceso al autor.
- [x] No se puede reportar ni reclamar contenido no publicado (no revela su existencia).
- [x] `evidence_files` sin políticas ni privilegios hasta tener controles de archivos.
- [x] Funciones `security definer` con `search_path` fijo.
- [ ] Ejecutar `supabase db lint` y el *Security Advisor* sobre el proyecto real.
- [ ] Probar las migraciones con `supabase start` (Postgres real de Supabase), no solo con PGlite.

## Autenticación

- [~] Confirmación de correo obligatoria (configurar en el panel).
- [~] Contraseña de al menos 10 caracteres en el formulario. Falta configurar el mismo mínimo en Supabase Auth.
- [ ] Activar la protección contra contraseñas filtradas y el CAPTCHA (hCaptcha o Turnstile) en registro e ingreso.
- [ ] SMTP propio con SPF, DKIM y DMARC.
- [ ] Revisar los límites de tasa de Auth.

## Frontend y despliegue

- [x] Solo la clave `anon` en el cliente; `service_role` nunca.
- [x] Sin datos simulados cuando falta configuración.
- [x] Fuentes autoalojadas (sin peticiones a terceros).
- [~] El panel de administración se oculta sin rol, pero la seguridad la impone la base de datos.
- [ ] Cabeceras: `Content-Security-Policy` (limitar `connect-src` al dominio de Supabase), `X-Content-Type-Options: nosniff`,
      `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `frame-ancestors 'none'`.
- [ ] Monitoreo de errores sin datos personales.

## Operación

- [ ] Proceso para atender requerimientos de autoridades.
- [ ] Copias de seguridad y prueba de restauración.
- [ ] Revisión periódica de `security_events` (`moderation_denied`, `role_change_denied`).
- [ ] Borrado programado según `docs/retencion.md`.
