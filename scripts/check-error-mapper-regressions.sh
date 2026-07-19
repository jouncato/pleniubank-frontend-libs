#!/usr/bin/env bash
# Falla si aparece un mapeador de errores de API paralelo (un nuevo
# `switch (code)`/`switch (error.errors[0]?.code)` sobre un `ApiHttpError`, o un objeto
# `Record<string, string>` que luce como catálogo de códigos de error) fuera de
# `resolve-user-facing-api-error.ts` (API canónica) y de los dos resolutores legacy ya
# deprecados (`api-error-message.ts`, `error-message.mapper.ts`), que se toleran hasta
# que se retiren.
#
# Parte de openspec/changes/standardize-frontend-security-and-errors, tarea 3.3
# (contrato único de errores). Sigue el mismo patrón que
# scripts/check-icon-regressions.sh (openspec/changes/unify-financial-svg-iconography).
set -euo pipefail
cd "$(dirname "$0")/.."

ALLOWED_FILES=(
  "libs/shared-http/src/lib/resolve-user-facing-api-error.ts"
  "libs/shared-http/src/lib/error-message.mapper.ts"
  "libs/shared-http/src/lib/api-error-message.ts"
)
VIOLATIONS=0

is_allowed() {
  local f="$1"
  for allowed in "${ALLOWED_FILES[@]}"; do
    if [ "$f" = "$allowed" ]; then
      return 0
    fi
  done
  return 1
}

# `switch` sobre un código de error API (variable llamada `code` u obtenida de
# `errors[0]?.code` / `errors[0].code`).
SWITCH_HITS=$(grep -rlE "switch[[:space:]]*\([[:space:]]*(code|[a-zA-Z0-9_.]*errors\[0\]\??\.code)[[:space:]]*\)" \
  --include="*.ts" libs/ apps/ 2>/dev/null | grep -v "\.spec\.ts$" || true)
for f in $SWITCH_HITS; do
  if ! is_allowed "$f"; then
    echo "Mapeador de errores paralelo (switch sobre código de error API) en: $f"
    echo "  -> usa resolveUserFacingApiError(error, { overrides }) en su lugar (ver libs/shared-http/src/lib/resolve-user-facing-api-error.ts)"
    VIOLATIONS=1
  fi
done

if [ "$VIOLATIONS" -eq 1 ]; then
  echo ""
  echo "Contrato de errores no unificado. Ver openspec/changes/standardize-frontend-security-and-errors."
  exit 1
fi

echo "Sin nuevos mapeadores de errores de API paralelos."
