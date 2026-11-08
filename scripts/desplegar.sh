#!/usr/bin/env bash
# Actualiza la web en el VPS: descarga los cambios de GitHub, compila y
# publica sin dejar la web rota mientras compila.
#
# Uso, desde la carpeta del proyecto (/www/wwwroot/tuvozlaboral.com):
#   bash scripts/desplegar.sh
#
# Compila en .dist-nuevo y, solo si todo sale bien, la cambia por dist/.
# Si algo falla, la web sigue con la versión anterior.
set -euo pipefail

cd "$(dirname "$0")/.."
RAMA="${RAMA:-main}"

echo "→ Descargando cambios de GitHub ($RAMA)…"
git fetch origin "$RAMA"
ANTES="$(git rev-parse HEAD)"
git reset --hard "origin/$RAMA"
DESPUES="$(git rev-parse HEAD)"

if [ "$ANTES" = "$DESPUES" ] && [ -d dist ] && [ "${FORZAR:-0}" != "1" ]; then
  echo "✓ No hay cambios nuevos. (Para compilar igualmente: FORZAR=1 bash scripts/desplegar.sh)"
  exit 0
fi
git --no-pager log --oneline -1

# Instala dependencias solo si cambiaron (o si no existen).
if [ ! -d node_modules ] || ! git diff --quiet "$ANTES" "$DESPUES" -- package.json package-lock.json; then
  echo "→ Instalando dependencias…"
  npm ci --no-audit --no-fund
fi

echo "→ Compilando…"
rm -rf .dist-nuevo
npx tsc --noEmit
npx vite build --outDir .dist-nuevo --emptyOutDir
SITEMAP_OUT=.dist-nuevo node scripts/generar-sitemap.mjs
# Autoriza el ID público de AdSense; nunca generar un ads.txt con HTML.
ADS_TXT_OUT=.dist-nuevo/ads.txt node scripts/generar-ads-txt.mjs

echo "→ Publicando…"
rm -rf .dist-anterior
[ -d dist ] && mv dist .dist-anterior
mv .dist-nuevo dist
rm -rf .dist-anterior

echo "✓ Listo: $(git --no-pager log --oneline -1)"
