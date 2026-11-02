# Despliegue en el VPS (Nginx)

La web es un sitio estático (`npm run build` genera `dist/`) con rutas del lado del navegador: `/derechos/…`, `/calculadoras/…`, `/empresas/…`. **Nginx debe responder `index.html` a cualquier ruta que no sea un archivo.** Si no, al abrir un enlace directo o recargar la página aparece «404 Not Found».

## Configuración recomendada

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
        try_files $uri $uri/ /index.html;
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
```

Sin `VITE_GA_ID` no se carga Google Analytics ni aparece el aviso de cookies.

## Política de seguridad de contenidos (opcional, más adelante)

Una cabecera `Content-Security-Policy` limita desde dónde puede cargar scripts la página. Pruébala primero en modo solo informe, para no romper Google Analytics ni Supabase. Reemplaza `TU-PROYECTO` por el de tu URL de Supabase:

```nginx
add_header Content-Security-Policy-Report-Only "default-src 'self'; script-src 'self' https://www.googletagmanager.com; connect-src 'self' https://TU-PROYECTO.supabase.co https://www.google-analytics.com https://*.analytics.google.com https://*.google-analytics.com; img-src 'self' data: https://TU-PROYECTO.supabase.co https://www.google-analytics.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; font-src 'self'; media-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" always;
```

Cuando actives AdSense habrá que ampliarla con los dominios de anuncios de Google.
