#!/usr/bin/env bash
# Falla si aparece un nuevo sitio que (a) construya una URL de WebSocket/HTTP con
# `?token=<jwt>` fuera del único lugar auditado que lo hace a propósito (modo
# bearer explícito, no productivo), o (b) escriba un token de sesión (JWT/access/
# refresh) directamente en sessionStorage/localStorage fuera del gatekeeper único
# (SessionStore) o de la excepción de handoff legacy ya documentada y gateada por
# `allowCrossOriginTokenHandoff` (solo activable en desarrollo).
#
# Parte de openspec/changes/standardize-frontend-security-and-errors, tarea 2.4
# (sesión web segura). Sigue el mismo patrón que scripts/check-icon-regressions.sh
# y scripts/check-error-mapper-regressions.sh.
set -euo pipefail
cd "$(dirname "$0")/.."

VIOLATIONS=0

# --- ?token= en construcción de URL (WebSocket o HTTP) ---
# Único uso legítimo: core-websocket-events.service.ts, rama bearer explícita
# (_socketUrl(), solo cuando authMode === 'bearer', nunca en modo cookie/prod).
TOKEN_URL_HITS=$(grep -rlE "[\`'\"]\\?token=" --include="*.ts" libs/ 2>/dev/null \
  | grep -v "\.spec\.ts$" \
  | grep -v "libs/shared-http/src/lib/realtime/core-websocket-events.service.ts" \
  || true)
if [ -n "$TOKEN_URL_HITS" ]; then
  echo "Nuevo uso de '?token=' en URL fuera del sitio auditado (core-websocket-events.service.ts):"
  echo "$TOKEN_URL_HITS"
  echo "  -> usa connectCookieAuth() (SESSION_STRATEGY=httpOnlyCookie) en vez de exponer el JWT en la URL"
  VIOLATIONS=1
fi

# --- Escritura directa de tokens en Web Storage fuera de SessionStore ---
# Excepciones documentadas:
#   - session-store.service.ts: gatekeeper único (persist() solo se usa cuando
#     sessionStrategy !== 'httpOnlyCookie').
#   - portal-dev-token-handoff.ts: handoff legacy hacia el portal público
#     archivado, gateado por allowCrossOriginTokenHandoff (false en
#     environment.ts de producción, true solo en configuraciones de desarrollo).
STORAGE_ALLOWED_FILES=(
  "libs/shared-auth/src/lib/session-store.service.ts"
  "libs/shared-auth/src/lib/portal-dev-token-handoff.ts"
)
is_storage_allowed() {
  local f="$1"
  for allowed in "${STORAGE_ALLOWED_FILES[@]}"; do
    if [ "$f" = "$allowed" ]; then
      return 0
    fi
  done
  return 1
}

STORAGE_HITS=$(grep -rlE "(session|local)Storage\.setItem\([[:space:]]*[a-zA-Z0-9_]*(TOKEN|JWT|ACCESS|REFRESH|BEARER)" \
  --include="*.ts" libs/ 2>/dev/null | grep -v "\.spec\.ts$" || true)
for f in $STORAGE_HITS; do
  if ! is_storage_allowed "$f"; then
    echo "Escritura de token en Web Storage fuera de SessionStore en: $f"
    echo "  -> usa SessionStore.setUserToken()/setAdminToken()/setRefreshToken() en vez de tocar Web Storage directamente"
    VIOLATIONS=1
  fi
done

if [ "$VIOLATIONS" -eq 1 ]; then
  echo ""
  echo "Exposicion de token no gobernada detectada. Ver openspec/changes/standardize-frontend-security-and-errors."
  exit 1
fi

echo "Sin nuevas exposiciones de token en URL o Web Storage."
