# Decisiones

## Arquitectura

- **SPA estática + Supabase.** Sin backend propio: la seguridad vive en Postgres (RLS, privilegios de columna,
  triggers y RPC `security definer`). El frontend solo oculta o muestra; nunca decide permisos.
- **Roles de aplicación, no de base de datos.** `moderator` y `admin` viven en `admin_roles`. Las políticas usan
  `is_moderator()` e `is_admin()`. Nadie de la aplicación es superusuario de Postgres.
- **Se asumen los privilegios por defecto de Supabase.** Supabase concede `ALL` sobre las tablas nuevas de `public` a
  `anon` y `authenticated`. Las migraciones revocan todo y conceden columna por columna. Las pruebas replican esos
  privilegios por defecto para que un olvido se detecte.
- **Lectura pública por vistas.** `public_experiences` y `public_company_responses` pertenecen al propietario de las
  tablas, filtran por estado y exponen solo columnas publicables. La tabla base `experiences` no es legible por `anon`.
- **Detección del contexto en el trigger de edición.** `experiences_before_update` es `security invoker` y mira
  `current_user`: si es `anon` o `authenticated`, la sentencia viene de la API y se bloquean los cambios de estado. Las
  RPC de moderación corren como propietario y pasan.
- **Auditoría inmutable.** `moderation_events` y `security_events` solo admiten INSERT, incluso para su propietario. No
  tienen FK a cuentas para sobrevivir a una eliminación. Al ser de solo inserción no tienen `updated_at`; es la única
  excepción a la regla de `created_at`/`updated_at`.

## Producto

- **"En disputa" es visible.** Una experiencia en disputa sigue publicada, con un chip. Restringida y retirada se ocultan.
- **Relato en dos campos.** Directo y por terceros; el límite de 200 a 5000 caracteres aplica a la suma.
- **Periodo por mes.** Se guarda como fecha del primer día del mes.
- **Empresas propuestas.** Si la empresa no existe, quien publica la propone (máximo 5 al día). Queda oculta hasta que
  la moderación la active; no se puede publicar una experiencia sobre una empresa sin activar.
- **Sin NIT, sin puntuaciones, sin rankings.** Las estadísticas ocultan las categorías con menos de 3 publicaciones.
- **Reportes y reclamaciones exigen cuenta**, para reducir abuso. Solo se puede reportar contenido publicado.
- **Respuestas de empresas.** Solo una cuenta con reclamación de representación aprobada puede responder, y la
  respuesta pasa por moderación.
- **Apelaciones.** Al aceptar una apelación, el estado de la experiencia se cambia aparte con `moderate_experience`,
  para que quede su propio registro y motivo.
- **Retiro por el autor.** No se implementó: el brief prohíbe que el autor cambie el estado. Hoy puede pedir la
  eliminación de la cuenta. Ver siguiente paso.
- **Borrador local.** Se guarda en `localStorage` del navegador, por usuario, y solo se borra tras un envío confirmado.
- **Alias en el registro.** Se envía en los metadatos; si no es válido o ya existe, el perfil se crea sin alias y la
  persona lo elige en Mi cuenta (para no romper el registro con un error opaco de Auth).

## Pruebas

- **PGlite en lugar de Docker.** En el entorno de desarrollo no hay CLI de Supabase. PGlite ejecuta PostgreSQL 18 real
  en WebAssembly. Se verificó que RLS se aplica con `SET ROLE` (`tests/db/rls-sanity.test.ts`) y se comprobó que la
  suite detecta regresiones: al debilitar a propósito políticas, privilegios y triggers fallaron 7 pruebas.
- **Limitación.** PGlite no es el Postgres de Supabase: faltan sus extensiones, el esquema `auth` completo y
  `storage`. Hay que repetir las pruebas con `supabase start` antes del lanzamiento.

## Siguiente paso

1. Aplicar las migraciones al proyecto real de Supabase, crear la primera cuenta admin y recorrer los flujos de
   registro, publicación y moderación de punta a punta.
2. Ejecutar la suite de seguridad contra `supabase start` y el *Security Advisor*.
3. Pruebas end-to-end con Playwright (registro, compartir, moderar, apelar) contra un proyecto de staging.
4. Solicitud de retiro por el autor (como reporte especial, sin que cambie el estado directamente).
5. CAPTCHA en registro y reportes, cabeceras de seguridad y SMTP propio.
6. Tarea programada de retención.
7. Revisión legal (`docs/checklist-legal.md`) y verificación de las guías de derechos.
8. Archivos de evidencia solo cuando existan los controles: Storage privado, URLs firmadas de corta duración,
   antivirus, limpieza de metadatos EXIF/PDF y revisión manual.
