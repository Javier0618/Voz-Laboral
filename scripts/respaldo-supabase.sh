#!/usr/bin/env bash
# Copia de seguridad diaria de la base de datos de Supabase en el VPS.
#
# Uso: bash scripts/respaldo-supabase.sh
# Configuración: archivo .env.respaldo en la carpeta del proyecto, con:
#   SUPABASE_DB_URL=postgresql://postgres.XXXX:CONTRASEÑA@aws-0-REGION.pooler.supabase.com:5432/postgres
#   (Supabase → Connect → Session pooler. Ese archivo NO va al repositorio.)
#
# Guarda las copias en /www/backup/tuvozlaboral (cámbialo con DESTINO=…) y
# conserva las de los últimos 30 días (DIAS=…). Incluye los datos de la web,
# las cuentas (auth) y la lista de archivos de Storage; las imágenes de las
# portadas de guías no van dentro (se guardan aparte en Supabase Storage).
set -euo pipefail

cd "$(dirname "$0")/.."
DESTINO="${DESTINO:-/www/backup/tuvozlaboral}"
DIAS="${DIAS:-30}"

if [ ! -f .env.respaldo ]; then
  echo "Falta el archivo .env.respaldo con SUPABASE_DB_URL." >&2
  exit 1
fi
# shellcheck disable=SC1091
set -a; . ./.env.respaldo; set +a
: "${SUPABASE_DB_URL:?Falta SUPABASE_DB_URL en .env.respaldo}"

# Usa el pg_dump 17 del paquete postgresql-client-17 aunque otro PostgreSQL
# del servidor (por ejemplo, el de aaPanel) tenga una versión anterior en el PATH.
PG_DUMP=/usr/lib/postgresql/17/bin/pg_dump
[ -x "$PG_DUMP" ] || PG_DUMP=$(command -v pg_dump || true)
[ -n "$PG_DUMP" ] || { echo "Falta pg_dump: instala postgresql-client-17." >&2; exit 1; }

umask 077
mkdir -p "$DESTINO"
ARCHIVO="$DESTINO/tuvozlaboral-$(date +%F-%H%M).dump"

echo "→ Copiando la base de datos…"
"$PG_DUMP" "$SUPABASE_DB_URL" \
  --format=custom --compress=9 --no-owner --no-privileges \
  --schema=public --schema=private --schema=auth --schema=storage \
  --file="$ARCHIVO.tmp"
mv "$ARCHIVO.tmp" "$ARCHIVO"

echo "→ Borrando copias de más de $DIAS días…"
find "$DESTINO" -name 'tuvozlaboral-*.dump' -type f -mtime +"$DIAS" -delete

echo "✓ Copia guardada: $ARCHIVO ($(du -h "$ARCHIVO" | cut -f1))"
