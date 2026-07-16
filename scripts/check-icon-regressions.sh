#!/usr/bin/env bash
# Falla si aparecen emojis decorativos, SVG inline de icono de UI no autorizado,
# icon fonts o registros locales de paths SVG fuera del catálogo gobernado
# (financial-icon.registry.ts) o de las excepciones documentadas en
# scripts/icon-regression-allowlist.txt.
#
# Parte de openspec/changes/unify-financial-svg-iconography, tarea 7.1.
set -euo pipefail
cd "$(dirname "$0")/.."

ALLOWLIST_FILE="scripts/icon-regression-allowlist.txt"
VIOLATIONS=0

EMOJI_HITS=$(grep -rlP "[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]" --include="*.html" --include="*.ts" libs/ 2>/dev/null | grep -v ".spec.ts" || true)
if [ -n "$EMOJI_HITS" ]; then
  echo "Emojis decorativos encontrados (usa <pb-icon> en su lugar):"
  echo "$EMOJI_HITS"
  VIOLATIONS=1
fi

SVG_HITS=$(grep -rl "<svg" --include="*.html" --include="*.ts" libs/ 2>/dev/null | grep -v ".spec.ts" || true)
for f in $SVG_HITS; do
  if ! grep -qxF "$f" "$ALLOWLIST_FILE" 2>/dev/null; then
    echo "SVG inline no autorizado en: $f"
    echo "  -> usa el catalogo de financial-icon.registry.ts o anade la excepcion documentada en $ALLOWLIST_FILE"
    VIOLATIONS=1
  fi
done

ICONPATHS_HITS=$(grep -rlE "[A-Z_]*ICON_PATHS[A-Z_]*[[:space:]]*:[[:space:]]*Record<string" --include="*.ts" libs/ 2>/dev/null | grep -v "financial-icon.registry.ts" || true)
if [ -n "$ICONPATHS_HITS" ]; then
  echo "Registro local de iconos (*ICON_PATHS) fuera de financial-icon.registry.ts:"
  echo "$ICONPATHS_HITS"
  VIOLATIONS=1
fi

if [ "$VIOLATIONS" -eq 1 ]; then
  echo ""
  echo "Iconografia no gobernada detectada. Ver openspec/changes/unify-financial-svg-iconography."
  exit 1
fi

echo "Sin nuevas ocurrencias de iconografia no gobernada."
