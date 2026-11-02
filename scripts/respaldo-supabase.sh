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
# Se lee la línea a mano (sin ejecutar el archivo) para tolerar errores comunes
# al escribirla: espacios, comillas, saltos de línea de Windows o el nombre de
# la variable repetido.
SUPABASE_DB_URL=$(grep -E '^[[:space:]]*(export[[:space:]]+)?SUPABASE_DB_URL[[:space:]]*=' .env.respaldo | tail -n 1 \
  | tr -d '\r' | sed -E 's/^[[:space:]]*(export[[:space:]]+)?(SUPABASE_DB_URL[[:space:]]*=[[:space:]]*)+//; s/[[:space:]]+$//; s/^["'"'"']//; s/["'"'"']$//')
if [ -z "$SUPABASE_DB_URL" ]; then
  echo "Falta la línea SUPABASE_DB_URL=postgresql://… en .env.respaldo." >&2
  exit 1
fi
case "$SUPABASE_DB_URL" in
  postgresql://*|postgres://*) ;;
  *) echo "La dirección de .env.respaldo debe empezar por postgresql:// (Supabase → Connect → Session pooler)." >&2; exit 1 ;;
esac
# Lo que va después de la contraseña debe ser el servidor de Supabase; si no,
# la contraseña tiene un símbolo (#, @, /, ?) que corta la dirección.
case "${SUPABASE_DB_URL##*@}" in
  *.supabase.com:*|*.supabase.co:*) ;;
  *) echo "La dirección de .env.respaldo está mal formada: si la contraseña tiene símbolos como # @ / ?, cámbiala por una solo con letras y números." >&2; exit 1 ;;
esac
if [ "$(printf '%s' "$SUPABASE_DB_URL" | grep -o '@' | wc -l)" -ne 1 ]; then
  echo "La dirección de .env.respaldo está mal formada: si la contraseña tiene símbolos como # @ / ?, cámbiala por una solo con letras y números." >&2
  exit 1
fi

# Usa el pg_dump 17 del paquete postgresql-client-17 aunque otro PostgreSQL
# del servidor (por ejemplo, el de aaPanel) tenga una versión anterior en el PATH.
PG_DUMP=/usr/lib/postgresql/17/bin/pg_dump
[ -x "$PG_DUMP" ] || PG_DUMP=$(command -v pg_dump || true)
[ -n "$PG_DUMP" ] || { echo "Falta pg_dump: instala postgresql-client-17." >&2; exit 1; }

umask 077
mkdir -p "$DESTINO"
ARCHIVO="$DESTINO/tuvozlaboral-$(date +%F-%H%M).dump"

echo "→ Copiando la base de datos…"
"$PG_DUMP" --dbname="$SUPABASE_DB_URL" \
  --format=custom --compress=9 --no-owner --no-privileges \
  --schema=public --schema=private --schema=auth --schema=storage \
  --file="$ARCHIVO.tmp"
mv "$ARCHIVO.tmp" "$ARCHIVO"

echo "→ Borrando copias de más de $DIAS días…"
find "$DESTINO" -name 'tuvozlaboral-*.dump' -type f -mtime +"$DIAS" -delete

echo "✓ Copia guardada: $ARCHIVO ($(du -h "$ARCHIVO" | cut -f1))"
