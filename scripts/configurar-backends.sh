#!/usr/bin/env bash
# Configura la interfaz para usar los backends por https (túneles de Cloudflare).
#
# Uso:
#   ./scripts/configurar-backends.sh <url-backend-1> <url-backend-2>
#
# Ejemplo:
#   ./scripts/configurar-backends.sh https://abc-def.trycloudflare.com https://ghi-jkl.trycloudflare.com
#
# Qué hace:
#   1. Comprueba que las dos direcciones sean https y que respondan
#      (backend 1: /api/health, backend 2: /health).
#   2. Escribe .env.local (para npm run dev), conservando VITE_MONITOREO_URL si existe.
#   3. Guarda las direcciones como variables del repo en GitHub (para GitHub Pages).
#   4. Vuelve a publicar la página (workflow "Publicar en GitHub Pages").
#
# Necesita: curl y gh (con sesión iniciada: gh auth login).

set -euo pipefail

REPO="NasaSpaceChallenge-DeploySinMerken/Interfaz"
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"

if [ $# -ne 2 ]; then
  echo "Uso: $0 <url-backend-1> <url-backend-2>" >&2
  exit 1
fi

API="${1%/}"
ANALISIS="${2%/}"

for url in "$API" "$ANALISIS"; do
  case "$url" in
    https://*) ;;
    *) echo "✗ $url no es https: GitHub Pages solo puede llamar a backends https." >&2; exit 1 ;;
  esac
done

revisar() {
  local nombre="$1" url="$2"
  local codigo
  codigo=$(curl -s -m 20 -o /dev/null -w '%{http_code}' "$url" || true)
  if [ "$codigo" = "200" ]; then
    echo "✓ $nombre responde ($url)"
  else
    echo "✗ $nombre no responde ($url → HTTP ${codigo:-sin conexión})." >&2
    echo "  Revisa que el túnel siga corriendo y que la dirección esté bien copiada." >&2
    exit 1
  fi
}

echo "1. Revisando los backends…"
revisar "Backend 1 (API del mapa)" "$API/api/health"
revisar "Backend 2 (análisis)" "$ANALISIS/health"

echo "2. Escribiendo .env.local…"
MONITOREO=""
if [ -f "$RAIZ/.env.local" ]; then
  MONITOREO=$(grep -E '^VITE_MONITOREO_URL=' "$RAIZ/.env.local" || true)
fi
{
  echo "VITE_API_URL=$API"
  echo "VITE_ANALISIS_URL=$ANALISIS"
  [ -n "$MONITOREO" ] && echo "$MONITOREO"
} > "$RAIZ/.env.local"
echo "✓ .env.local listo (si npm run dev estaba corriendo, Vite se reinicia solo)"

echo "3. Guardando las variables en GitHub ($REPO)…"
gh variable set VITE_API_URL --body "$API" -R "$REPO"
gh variable set VITE_ANALISIS_URL --body "$ANALISIS" -R "$REPO"
echo "✓ Variables guardadas"

echo "4. Publicando de nuevo la página…"
if gh workflow run deploy.yml -R "$REPO" >/dev/null 2>&1; then
  echo "✓ Publicación en marcha: https://github.com/$REPO/actions"
  echo "  En un par de minutos: https://nasaspacechallenge-deploysinmerken.github.io/Interfaz/"
else
  echo "! No se pudo lanzar el workflow. Revisa que .github/workflows/deploy.yml esté en main" >&2
  echo "  y que en Settings → Pages → Source esté elegido \"GitHub Actions\"." >&2
fi
