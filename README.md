# VozLaboral

Plataforma de transparencia laboral para Colombia. Las personas comparten sus experiencias en empresas reales con un
alias público. El correo, la IP y el identificador de la cuenta nunca se muestran. Cada publicación pasa por moderación
y cada decisión queda registrada.

> Nombre provisional. La marca se cambia en `src/config/brand.ts` y la paleta en los tokens de `:root`
> (`src/styles/index.css`).

## Estado

| Fase | Contenido | Estado |
| --- | --- | --- |
| 1. Inspección y base | Proyecto, esquema, RLS, auth, alias, categorías | Hecha y probada |
| 2. Publicaciones | Compartir, vista previa, borrador, límites, búsqueda, perfil de empresa | Hecha y probada |
| 3. Moderación, reclamaciones y apelaciones | RPC con rol, auditoría, panel, reportes, reclamaciones, respuestas | Base de datos probada; panel hecho, sin pruebas de interfaz contra Supabase real |
| 4. Guías, políticas y privacidad | Fichas legales pendientes de verificación, borradores legales | Estructura hecha, contenido pendiente de abogado |
| 5. Archivos | Tabla `evidence_files` con RLS cerrada | Sin habilitar a propósito |
| 6. Pruebas y entrega | Ver abajo | En curso |

El siguiente paso está en [`docs/decisiones.md`](docs/decisiones.md#siguiente-paso).

## Stack

React 18, TypeScript, Vite, Tailwind CSS, React Router, `@supabase/supabase-js` y zod en el frontend. Supabase
(Postgres, Auth y Storage privado) en el backend. Vitest con Testing Library, jsdom y PGlite para las pruebas.
Las fuentes (Newsreader e Instrument Sans) están autoalojadas: no se usa Google Fonts.

## Instalación

Requisitos: Node 20 o superior y npm.

```bash
npm install
cp .env.example .env.local   # y completa los valores reales
npm run dev                  # http://localhost:5173
```

Sin las variables de Supabase la aplicación arranca y muestra un aviso de configuración en cada sección que necesita
datos. No muestra datos simulados.

### Variables de entorno

| Variable | Descripción |
| --- | --- |
| `VITE_SUPABASE_URL` | URL del proyecto (Settings, API) |
| `VITE_SUPABASE_ANON_KEY` | Clave pública `anon` |

La clave `service_role` **nunca** va en el frontend ni en `.env.local`.

## Supabase

1. Crea el proyecto en Supabase.
2. Aplica las migraciones de `supabase/migrations` en orden. Con la CLI:
   ```bash
   supabase link --project-ref <tu-ref>
   supabase db push
   ```
   Sin CLI: pega cada archivo, en orden, en el editor SQL del panel.
3. En Authentication:
   - Activa la confirmación de correo.
   - Agrega a *Redirect URLs* `https://<tu-dominio>/cuenta/confirmada` y `https://<tu-dominio>/cuenta/nueva-contrasena`
     (y las equivalentes en `http://localhost:5173` para desarrollo).
   - Configura un SMTP propio antes del lanzamiento: el de Supabase tiene límites bajos.
4. Crea la primera cuenta administradora desde el editor SQL (rol `postgres`), después de registrarla en la app:
   ```sql
   insert into public.admin_roles (user_id, role)
   select id, 'admin' from auth.users where email = 'correo-real@dominio.co';
   ```
   A partir de ahí, la administración asigna roles con la RPC `admin_set_role`.
5. Datos de demo (solo desarrollo): `supabase/seed.dev.sql`. Son empresas ficticias marcadas como `[PRUEBA]`.

### Migraciones

| Archivo | Contenido |
| --- | --- |
| `20261026000100_base.sql` | `pg_trgm`, normalización, roles de la aplicación, `security_events`, perfiles y validación de alias |
| `20261026000200_core.sql` | `moderation_events`, empresas, alias de empresa, categorías (las 10 iniciales), experiencias, `evidence_files` |
| `20261026000300_participation.sql` | Reportes, reclamaciones, respuestas de empresas, apelaciones y recursos legales |
| `20261026000400_public_api.sql` | Vistas públicas, búsqueda, estadísticas y RPC de moderación y administración |

## Pruebas

```bash
npm test           # todas las pruebas
npm run typecheck
npm run build
```

- `tests/db`: pruebas de seguridad reales. Levantan PostgreSQL 18 en WebAssembly (PGlite) con una réplica mínima de
  Supabase (esquema `auth`, `auth.uid()` leyendo `request.jwt.claims`, roles `anon` y `authenticated` con los
  privilegios por defecto de Supabase). Después aplican las migraciones reales y ejecutan las consultas con `SET ROLE`.
  `rls-sanity.test.ts` comprueba antes que RLS se aplica de verdad.
- `tests/unit`: esquemas zod y detección de datos personales.
- `tests/ui`: formulario de compartir, borrador, avisos de configuración y estructura accesible.

## Despliegue

El frontend es estático (`npm run build` genera `dist/`). Sirve en Vercel, Netlify, Cloudflare Pages o similar:

- Comando de build: `npm run build`. Directorio de salida: `dist`.
- Define `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en el proveedor.
- Configura la reescritura de todas las rutas a `index.html` (SPA).
- Añade cabeceras de seguridad (CSP, `X-Content-Type-Options`, `Referrer-Policy`). Ver `docs/checklist-seguridad.md`.

## Documentación

- [`docs/decisiones.md`](docs/decisiones.md): decisiones de diseño y siguiente paso.
- [`docs/checklist-seguridad.md`](docs/checklist-seguridad.md)
- [`docs/checklist-legal.md`](docs/checklist-legal.md)
- [`docs/retencion.md`](docs/retencion.md): plazos de conservación y eliminación.
