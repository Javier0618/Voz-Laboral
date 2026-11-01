# TuVozLaboral

Sitio independiente de **guías laborales** para trabajadores en Colombia. Su foco principal es publicar guías claras sobre derechos laborales, reformas y cambios en el mundo del trabajo, con la norma citada, su fuente oficial y la fecha de verificación.

Completan las guías:

1. **Experiencias:** los trabajadores cuentan cómo les fue en empresas reales, con un alias público o sin cuenta. Cada relato pasa por una moderación auditada antes de publicarse, y la comunidad puede reaccionar y comentar.
2. **Calculadoras:** de nómina, prima, cesantías y liquidación. Cada una explica cómo se calcula y enlaza a su guía.

El sistema editorial (plantilla, temas, calendario y flujo de publicación) está en [`docs/editorial.md`](docs/editorial.md).

> **Estado:** MVP en desarrollo. **No está listo para producción.** Faltan la verificación contra un proyecto de Supabase real, la revisión jurídica de las políticas y los puntos pendientes de [`docs/checklist-seguridad.md`](docs/checklist-seguridad.md) y [`docs/checklist-legal.md`](docs/checklist-legal.md).
>
> «TuVozLaboral» es un nombre provisional: la disponibilidad de la marca y del dominio no se ha comprobado.

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
| Página «Quiénes somos y cómo trabajamos» (guías, experiencias y moderación) | Implementado |
| Página propia de cada experiencia (`/experiencias/:id`) con botón Compartir (WhatsApp, copiar enlace) | Implementado |
| Avisos para quien publica: comentarios, reacciones y decisiones de moderación (campana y `/avisos`) | Implementado y probado en la base de datos |
| `sitemap.xml` y `robots.txt` generados al compilar | Implementado (requiere `SITE_URL`) |
| Respuestas a comentarios (un nivel) con aviso, y balance bueno/mixto/malo en el perfil de empresa | Implementado y probado en la base de datos |
| Historial propio: estados, motivos, edición, retirada y apelación | Implementado |
| Panel de moderación: cola, comentarios, reportes, reclamaciones, apelaciones, catálogo, guías e historial | Implementado |
| Reclamaciones de empresas y respuestas empresariales | Implementado |
| **Guías laborales** (eje principal): editor con plantilla, índice por temas editoriales, buscador, guías relacionadas, experiencias relacionadas y enlaces a calculadoras | Implementado; 31 guías en `supabase/contenido` (partes 1 a 6) |
| Borrado definitivo de guías desde el panel, con registro en moderación | Implementado y probado en la base de datos |
| «Cómo se calcula» y enlace a la guía en cada calculadora | Implementado |
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
| `VITE_UMAMI_URL` | Dirección de tu instancia de Umami, por ejemplo `https://estadisticas.tuvozlaboral.com` (opcional; sin ella no se mide nada) |
| `VITE_UMAMI_WEBSITE_ID` | «Website ID» que da Umami al añadir el sitio (opcional) |
| `VITE_UMAMI_DOMAINS` | Dominio público, para que solo se cuenten visitas reales y no las de pruebas en local (opcional) |
| `SITE_URL` | Dominio público para generar `sitemap.xml` y `robots.txt` al compilar. Si no la defines, se usa `https://tuvozlaboral.com`. |
| `VITE_SITE_URL` | Dominio público para la dirección canónica y las vistas previas al compartir. Por defecto, `https://tuvozlaboral.com`; cámbialo solo para un entorno de pruebas. |

**Nunca** pongas la clave `service_role` en variables `VITE_*`: quedarían expuestas en el navegador.

## Configurar Supabase

1. **Aplicar las migraciones** de `supabase/migrations`, en orden, con una de estas opciones:
   - Supabase CLI: `supabase link --project-ref <ref>` y después `supabase db push`.
   - SQL Editor del panel: pega y ejecuta cada archivo en orden numérico.
2. **Auth → Providers → Email**: activa *Confirm email*.
3. **Auth → URL Configuration**: define *Site URL* como `https://tuvozlaboral.com` y añade a *Redirect URLs* `https://tuvozlaboral.com/cuenta` y `https://tuvozlaboral.com/cuenta/nueva-contrasena` (en local, `http://localhost:5173/...`). Sin esto, los correos de confirmación y de recuperación de contraseña no llevan de vuelta al sitio.
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
8. **Guías de «Tus derechos»:** `supabase/contenido/guias-derechos-2026.sql` (10 guías redactadas a partir del texto oficial de la Secretaría del Senado), `guias-derechos-2026-parte-2.sql` (vacaciones, cesantías, prima, despido, incapacidad y licencias de maternidad y paternidad) y `guias-derechos-2026-parte-3.sql` (liquidación, renuncia, tipos de contrato y período de prueba, seguridad social, accidente de trabajo, estabilidad laboral reforzada, acoso sexual, y salario mínimo con auxilio de transporte y dotación) cargan 24 guías. Entran como «pendiente de verificación», no públicas; se publican desde Moderación → Guías tras la revisión de un abogado. Después, `guias-derechos-2026-actualizacion.sql` enlaza las guías entre sí, precisa algunos datos y cambia las fuentes generales por la página exacta de cada artículo. Las guías enlazan a otras con `[texto](/derechos/slug)`.
9. **Tareas programadas:** ver [`docs/retencion.md`](docs/retencion.md).
10. **Antes de abrir al público:** sigue la lista de [`docs/lanzamiento.md`](docs/lanzamiento.md), que incluye textos de invitación.

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
supabase/migrations/   esquema, RLS, funciones y auditoría (19 migraciones)
supabase/seed.dev.sql  empresas ficticias para desarrollo
src/config/brand.ts    nombre y textos de marca
src/index.css          colores de marca (variables en :root)
src/lib/               cliente Supabase, acceso a datos, validación y errores
src/pages/             páginas (Admin.tsx se carga aparte)
src/content/           borradores de políticas
tests/db/              pruebas de seguridad contra Postgres
tests/unit, tests/ui   validación y recorridos de interfaz
docs/                  decisiones, conservación, checklists y kit de lanzamiento (lanzamiento.md)
```

## Cambiar la identidad visual

- Nombre y textos: `src/config/brand.ts`, `index.html` y `public/favicon.svg`.
- Colores: variables RGB en `:root` dentro de `src/index.css`.
- Tipografías: los `@import` de `src/index.css` y `fontFamily` en `tailwind.config.js`.
