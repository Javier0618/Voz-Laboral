# Despliegue en el VPS (Nginx)

La web es un sitio estático (`npm run build` genera `dist/`) con rutas del lado del navegador: `/derechos/…`, `/calculadoras/…`, `/empresas/…`. **Nginx debe responder `index.html` a cualquier ruta que no sea un archivo.** Si no, al abrir un enlace directo o recargar la página aparece «404 Not Found».

## Clonar y actualizar desde GitHub

Carpeta del proyecto en el VPS: `/www/wwwroot/tuvozlaboral.com`. Nginx sirve `dist/`, así que el código fuente, `.git` y `.env` no son accesibles desde la web.

### Una sola vez

1. Necesitas Node.js 20 o superior y Git (`node -v`, `git --version`). Puedes instalar Node desde aaPanel → App Store → «Node.js version manager».
2. Si el repositorio es privado, crea una clave de solo lectura para el VPS:
   ```bash
   ssh-keygen -t ed25519 -C "vps-tuvozlaboral" -f ~/.ssh/tuvozlaboral -N ""
   ```
   Copia la clave pública (`cat ~/.ssh/tuvozlaboral.pub`) en GitHub → repositorio → Settings → Deploy keys → Add deploy key, sin marcar «Allow write access». Después añade esto a `~/.ssh/config`:
   ```
   Host github-tuvozlaboral
       HostName github.com
       User git
       IdentityFile ~/.ssh/tuvozlaboral
       IdentitiesOnly yes
   ```
3. Convierte la carpeta en una copia del repositorio. Así se conservan los archivos que no son del repositorio, como `.env` y el `.user.ini` de aaPanel:
   ```bash
   cd /www/wwwroot/tuvozlaboral.com
   git init -b main
   git remote add origin git@github-tuvozlaboral:Javier0618/Voz-Laboral.git
   git fetch origin main
   git checkout -f -B main origin/main
   ```
   Si el repositorio es público, usa `https://github.com/Javier0618/Voz-Laboral.git` como dirección y sáltate el paso 2.
4. Crea o revisa el archivo `.env`. Las variables están en la sección «Variables al compilar».
5. Compila y publica por primera vez:
   ```bash
   FORZAR=1 bash scripts/desplegar.sh
   ```

### Cada vez que haya cambios

```bash
cd /www/wwwroot/tuvozlaboral.com && bash scripts/desplegar.sh
```

El script hace esto:
- Descarga `main` y deja el código idéntico a GitHub. Los cambios hechos a mano en archivos del repositorio se pierden; `.env`, `dist` y los archivos de aaPanel no se tocan.
- Reinstala las dependencias solo si cambiaron.
- Compila en una carpeta aparte (`.dist-nuevo`) y solo al final la cambia por `dist/`. Si algo falla, la web sigue con la versión anterior.
- Si no hay cambios, no hace nada. Para compilar igualmente, por ejemplo tras cambiar `.env`, usa `FORZAR=1 bash scripts/desplegar.sh`.

### Opcional: actualizar solo

En aaPanel → Cron → Add task → tipo «Shell script», cada 10 minutos:

```bash
cd /www/wwwroot/tuvozlaboral.com && bash scripts/desplegar.sh >> /www/wwwlogs/tuvozlaboral-despliegue.log 2>&1
```

Como el script termina enseguida si no hay cambios, no consume recursos.

## Con aaPanel (configuración actual del VPS)

El VPS usa **aaPanel**, que gestiona Nginx y los certificados por su cuenta:

- **Nginx de aaPanel:** está en `/www/server/nginx/`. Para comprobar y recargar usa ese binario, no el comando `nginx` del sistema, que apunta a otra instalación:
  ```bash
  /www/server/nginx/sbin/nginx -t && /www/server/nginx/sbin/nginx -s reload
  ```
- **Configuración del sitio:** Website → `tuvozlaboral.com` → Conf → Config file. Debe incluir `www.tuvozlaboral.com` en `server_name`, la redirección de `www`, las cabeceras de seguridad, la caché de `/assets/` y, sobre todo:
  ```nginx
  location / {
      try_files $uri $uri/index.html /index.html;
  }
  ```
  Usa `$uri/index.html` y no `$uri/`: con `$uri/`, una carpeta sin `index.html` (por ejemplo `derechos/`, que existe por las guías prerenderizadas) da «403 Forbidden», y `/derechos/slug` redirige a `/derechos/slug/`, una dirección distinta de la canónica.

  La sección **URL rewrite** del panel debe quedar vacía si el `location /` ya está en el archivo; si no, Nginx da un error por bloque duplicado.
- **Certificados:** se emiten desde el panel (SSL → Let's Encrypt), no con Certbot. Al cambiar el SSL o los dominios, aaPanel regenera el archivo de configuración: revisa que conserve los cambios.
- **Cabeceras propias:** lo que pongas en `/www/server/panel/vhost/nginx/extension/tuvozlaboral.com/*.conf` el panel no lo toca.

## Configuración recomendada (Nginx sin panel)

Reemplaza `/var/www/tuvozlaboral/dist` por la ruta real de tu carpeta `dist`.

```nginx
# http → https, y www → sin www
server {
    listen 80;
    listen [::]:80;
    server_name tuvozlaboral.com www.tuvozlaboral.com;
    return 301 https://tuvozlaboral.com$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.tuvozlaboral.com;
    ssl_certificate     /etc/letsencrypt/live/tuvozlaboral.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tuvozlaboral.com/privkey.pem;
    return 301 https://tuvozlaboral.com$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name tuvozlaboral.com;

    ssl_certificate     /etc/letsencrypt/live/tuvozlaboral.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tuvozlaboral.com/privkey.pem;

    root /var/www/tuvozlaboral/dist;
    index index.html;

    # Cabeceras de seguridad (docs/checklist-seguridad.md)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()" always;
    add_header X-Frame-Options "DENY" always;

    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml text/xml text/plain;

    # Archivos con huella en el nombre: caché de un año.
    location /assets/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
        add_header X-Content-Type-Options "nosniff" always;
        try_files $uri =404;
    }

    # La página principal no se guarda en caché: así cada despliegue se ve al instante.
    location = /index.html {
        add_header Cache-Control "no-cache";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header X-Frame-Options "DENY" always;
    }

    # Rutas de la web: si no es un archivo, responde index.html.
    location / {
        try_files $uri $uri/index.html /index.html;
    }
}
```

Ojo: en Nginx, un `add_header` dentro de un `location` anula los del `server`. Por eso se repiten en `/assets/` y en `/index.html`.

## Certificado con www

El certificado actual no incluye `www.tuvozlaboral.com`, así que quien escriba la dirección con `www` ve un aviso de «sitio no seguro». Amplíalo con Certbot:

```bash
sudo certbot --nginx -d tuvozlaboral.com -d www.tuvozlaboral.com
```

Después comprueba la configuración y recarga Nginx:

```bash
sudo nginx -t
```

```bash
sudo systemctl reload nginx
```

## Comprobación

Estas direcciones deben responder 200:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://tuvozlaboral.com/derechos
```

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://tuvozlaboral.com/politicas/cookies
```

Y esta debe redirigir (301) a `https://tuvozlaboral.com/`:

```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" https://www.tuvozlaboral.com/
```

## Variables al compilar

Ponlas en el archivo `.env` de la carpeta del proyecto, antes de ejecutar `npm run build`:

```
VITE_SUPABASE_URL=…
VITE_SUPABASE_ANON_KEY=…
VITE_CONTACT_EMAIL=…
VITE_GA_ID=G-…
VITE_TURNSTILE_SITE_KEY=0x4…
VITE_GOOGLE_CLIENT_ID=….apps.googleusercontent.com
```

Sin `VITE_GA_ID` no se carga Google Analytics ni aparece el aviso de cookies. Sin `VITE_TURNSTILE_SITE_KEY` no aparece la verificación anti-robots.

## Protección contra bots (Cloudflare Turnstile)

Turnstile es la casilla «No soy un robot» de Cloudflare: gratis, sin imágenes que adivinar y casi siempre invisible. Protege el registro, el inicio de sesión, la recuperación de contraseña y el envío de experiencias sin cuenta. No hace falta que el dominio esté en Cloudflare.

**El orden importa.** Si activas la protección en Supabase antes de que la web envíe el token, nadie podrá iniciar sesión.

1. **Crear las claves.** En [dash.cloudflare.com](https://dash.cloudflare.com) (cuenta gratis) → **Turnstile** → **Add widget**:
   - Nombre: `TuVozLaboral`.
   - Hostnames: `tuvozlaboral.com` y `www.tuvozlaboral.com`.
   - Widget mode: **Managed**.

   Al crearlo, Cloudflare te da una **Site Key** (pública) y una **Secret Key** (secreta).
2. **Web.** En el `.env` del VPS añade `VITE_TURNSTILE_SITE_KEY=` seguido de la **Site Key**, y publica con `FORZAR=1 bash scripts/desplegar.sh`. Abre `/cuenta`: debe aparecer la verificación encima del botón. Supabase ignora el token mientras no actives el paso 3, así que todo sigue funcionando.
3. **Registro e inicio de sesión.** En Supabase → **Authentication → Attack Protection** → activa **Enable Captcha protection**, elige **Cloudflare Turnstile**, pega la **Secret Key** y guarda.
4. **Envíos sin cuenta.** En Supabase → **SQL Editor**, ejecuta la migración `20261102002100_turnstile.sql` y después esto, con tu **Secret Key**:
   ```sql
   insert into private.app_settings (name, value) values ('turnstile_secret', 'TU-SECRET-KEY')
   on conflict (name) do update set value = excluded.value, updated_at = now();
   ```
5. **Probar.** Cierra sesión y vuelve a entrar. Luego envía una experiencia sin cuenta de prueba y recházala desde Moderación.

**Desactivarla**, en orden inverso:

1. Ejecuta `delete from private.app_settings where name = 'turnstile_secret';`.
2. Desactiva el captcha en **Attack Protection**.
3. Quita la línea del `.env` y vuelve a publicar.

Si Cloudflare no responde, los envíos sin cuenta se rechazan con el mensaje «No pudimos comprobar que no eres un robot» en lugar de aceptarse sin comprobar.

## Política de seguridad de contenidos (opcional, más adelante)

Una cabecera `Content-Security-Policy` limita desde dónde puede cargar scripts la página. Pruébala primero en modo solo informe, para no romper Google Analytics ni Supabase. Reemplaza `TU-PROYECTO` por el de tu URL de Supabase:

```nginx
add_header Content-Security-Policy-Report-Only "default-src 'self'; script-src 'self' https://www.googletagmanager.com https://challenges.cloudflare.com https://accounts.google.com; frame-src https://challenges.cloudflare.com https://accounts.google.com; connect-src 'self' https://accounts.google.com https://TU-PROYECTO.supabase.co https://www.google-analytics.com https://*.analytics.google.com https://*.google-analytics.com; img-src 'self' data: https://TU-PROYECTO.supabase.co https://www.google-analytics.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://accounts.google.com; font-src 'self'; media-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" always;
```

Cuando actives AdSense habrá que ampliarla con los dominios de anuncios de Google.

## Copias de seguridad de Supabase

El plan gratuito de Supabase no permite descargar copias. `scripts/respaldo-supabase.sh` guarda cada noche una copia de la base de datos en el VPS (datos de la web, cuentas y lista de archivos) y conserva los últimos 30 días.

1. Instala el cliente de PostgreSQL 17, que debe ser de la misma versión o superior a la de Supabase (para Ubuntu y Debian, sigue las instrucciones de postgresql.org).
2. Crea `/www/wwwroot/tuvozlaboral.com/.env.respaldo` con la cadena de conexión de Supabase. Está en Connect → **Session pooler**, porque la conexión directa solo funciona por IPv6:
   ```
   SUPABASE_DB_URL=postgresql://postgres.TU-PROYECTO:CONTRASEÑA@aws-0-REGION.pooler.supabase.com:5432/postgres
   ```
   Protégelo con `chmod 600 .env.respaldo`. Está en `.gitignore` y Nginx no lo sirve, porque solo publica `dist/`.
3. Prueba a mano: `bash scripts/respaldo-supabase.sh`. Las copias quedan en `/www/backup/tuvozlaboral`.
4. Prográmalo en aaPanel → Cron → «Shell script», cada día a las 3:00:
   ```bash
   cd /www/wwwroot/tuvozlaboral.com && bash scripts/respaldo-supabase.sh >> /www/wwwlogs/tuvozlaboral-respaldo.log 2>&1
   ```

**Restaurar** (en un proyecto nuevo o tras un error), con cuidado:

```bash
pg_restore --no-owner --no-privileges --clean --if-exists -d "$SUPABASE_DB_URL" /www/backup/tuvozlaboral/tuvozlaboral-AAAA-MM-DD-HHMM.dump
```

Las imágenes de portada de las guías no van en esta copia: están en Supabase Storage.
