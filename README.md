# VozLaboral

Plataforma independiente de transparencia laboral para Colombia. Los trabajadores comparten experiencias buenas, malas y mixtas sobre empresas reales, con un alias público o sin cuenta. Cada relato pasa por una moderación auditada antes de publicarse, y la comunidad puede reaccionar y comentar.

> **Estado:** MVP en desarrollo. **No está listo para producción.** Faltan la verificación contra un proyecto de Supabase real, la revisión jurídica de las políticas y los puntos pendientes de [`docs/checklist-seguridad.md`](docs/checklist-seguridad.md) y [`docs/checklist-legal.md`](docs/checklist-legal.md).
>
> «VozLaboral» es un nombre provisional: la disponibilidad de la marca y del dominio no se ha comprobado.

## Qué incluye

| Área | Estado |
|---|---|
| Portada, navegación, diseño adaptable y accesible | Implementado |
| Registro, confirmación de correo, inicio y cierre de sesión, recuperación de contraseña | Implementado (Supabase Auth) |
| Alias público con validación (duplicados, palabras reservadas, parecido al correo) | Implementado y probado en la base de datos |
| Catálogo y buscador de empresas (nombre, alias, ciudad, sector, paginación, orden) | Implementado |
| Perfil público de empresa con estadísticas protegidas | Implementado |
| Formulario de experiencias con tono (buena, mala o mixta), vista previa, borrador y avisos de datos personales | Implementado y probado |
| Compartir sin cuenta, con enlace privado de seguimiento y opción de vincular a una cuenta | Implementado y probado en la base de datos |
| Reacciones de apoyo («Me pasó igual», «Me sirvió», «Gracias») y comentarios con moderación | Implementado y probado en la base de datos |
| Página «Quiénes somos y cómo moderamos» | Implementado |
| Historial propio: estados, motivos, edición, retirada y apelación | Implementado |
| Panel de moderación: cola, comentarios, reportes, reclamaciones, apelaciones, catálogo, guías e historial | Implementado |
| Reclamaciones de empresas y respuestas empresariales | Implementado |
| Guías de derechos laborales con editor (formato enriquecido, índice, buscador y guías relacionadas) | Implementado; 10 guías cargadas como «pendiente de verificación» |
| Políticas legales | **Borradores** pendientes de un abogado |
| Eliminación de cuenta con anonimización y purga por plazo | Implementado y probado en la base de datos |
| Archivos de respaldo | **No habilitado** a propósito (ver `docs/decisiones.md`) |

## Requisitos

- Node.js 20 o superior y npm.
- Un proyecto de [Supabase](https://supabase.com).

## Instalación local

```bash
npm install
cp .env.example .env.local   # y edita los valores
npm run dev
```

Sin variables de Supabase la app arranca igualmente y muestra un aviso de configuración. Nunca muestra datos simulados.

### Variables de entorno

| Variable | Descripción |
|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto (Settings → API) |
| `VITE_SUPABASE_ANON_KEY` | Clave pública `anon` / *publishable*. Su seguridad depende de RLS. |
| `VITE_CONTACT_EMAIL` | Correo público de contacto (opcional) |

**Nunca** pongas la clave `service_role` en variables `VITE_*`: quedarían expuestas en el navegador.

## Configurar Supabase

1. **Aplicar las migraciones** de `supabase/migrations`, en orden, con una de estas opciones:
   - Supabase CLI: `supabase link --project-ref <ref>` y después `supabase db push`.
   - SQL Editor del panel: pega y ejecuta cada archivo en orden numérico.
2. **Auth → Providers → Email**: activa *Confirm email*.
3. **Auth → URL Configuration**: define *Site URL* y añade a *Redirect URLs* `https://tu-dominio/cuenta` y `https://tu-dominio/cuenta/nueva-contrasena` (en local, `http://localhost:5173/...`).
4. **Auth → Policies / Security**: contraseña mínima de 10 caracteres y protección de contraseñas filtradas. Recomendado: CAPTCHA y SMTP propio.
5. **Primer administrador.** Regístrate desde la app, confirma el correo, elige un alias y después ejecuta en el SQL Editor:

   ```sql
   insert into public.admin_roles (user_id, role)
   select id, 'admin' from auth.users where email = 'tu-correo@dominio.com';
   ```

   A partir de ahí, los roles se gestionan con `select public.admin_set_role('<uuid>', 'moderator', true);`, que queda registrado.
6. **Datos de prueba (solo en desarrollo):** `supabase/seed.dev.sql` crea tres empresas ficticias marcadas como contenido de prueba.
7. **Importar empresas desde el informe de Supersociedades** («10.000 empresas más grandes»):

   ```bash
   pip install openpyxl
   python scripts/importar_empresas.py ruta/al/reporte.xlsx --anio 2025
   ```

   Genera `supabase/importaciones/empresas_<año>_parte_N.sql` (2.000 empresas por archivo). Ejecútalos en orden en el SQL Editor. Son idempotentes: repetirlos no duplica. El NIT se guarda en `company_private_data` y nunca es público. Las razones sociales idénticas en el mismo departamento se omiten para no crear perfiles indistinguibles; revísalas a mano. Estos archivos no se suben al repositorio.
8. **Guías de «Tus derechos»:** `supabase/contenido/guias-derechos-2026.sql` carga 10 guías redactadas a partir del texto oficial de la Secretaría del Senado (Código Sustantivo del Trabajo, Constitución, Leyes 1010 de 2006 y 2101 de 2021). Quedan como «pendiente de verificación», no públicas; se publican desde Moderación → Guías tras la revisión de un abogado.
9. **Tareas programadas:** ver [`docs/retencion.md`](docs/retencion.md).

## Pruebas

```bash
npm test          # todo
npm run test:db   # seguridad de la base de datos (RLS, privilegios, auditoría)
npm run test:ui   # validación y recorridos de interfaz
npm run typecheck
npm run build
```

Las pruebas de base de datos aplican las **migraciones reales** sobre [PGlite](https://pglite.dev), un Postgres real compilado a WebAssembly, que reproduce los roles `anon`, `authenticated` y `service_role`, `auth.uid()` y los privilegios por defecto de Supabase. No requieren Docker. Antes del lanzamiento conviene repetirlas contra `supabase start`.

## Despliegue

Es un sitio estático (`npm run build` genera `dist/`). Sirve en cualquier hosting con *fallback* a `index.html` para las rutas del cliente (Vercel, Netlify, Cloudflare Pages…). Configura las variables `VITE_*` en el hosting y añade las cabeceras de seguridad indicadas en el checklist.

## Estructura

```
supabase/migrations/   esquema, RLS, funciones y auditoría (14 migraciones)
supabase/seed.dev.sql  empresas ficticias para desarrollo
src/config/brand.ts    nombre y textos de marca
src/index.css          colores de marca (variables en :root)
src/lib/               cliente Supabase, acceso a datos, validación y errores
src/pages/             páginas (Admin.tsx se carga aparte)
src/content/           borradores de políticas
tests/db/              pruebas de seguridad contra Postgres
tests/unit, tests/ui   validación y recorridos de interfaz
docs/                  decisiones, conservación y checklists
```

## Cambiar la identidad visual

- Nombre y textos: `src/config/brand.ts`, `index.html` y `public/favicon.svg`.
- Colores: variables RGB en `:root` dentro de `src/index.css`.
- Tipografías: los `@import` de `src/index.css` y `fontFamily` en `tailwind.config.js`.
