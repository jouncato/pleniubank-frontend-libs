const PERCENTAGE_FORMATTER = new Intl.NumberFormat('es-CO', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

function formatPercentageValue(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return '—';
  return `${PERCENTAGE_FORMATTER.format(n)} %`;
}

/**
 * Formatea una tasa decimal proveniente de la API (0.18 → "18,00 %").
 * Usar SIEMPRE que el valor de origen sea una fracción (0-1 típicamente) —
 * esta función hace la conversión ×100 por vos.
 */
export function formatRateAsPercentage(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return '—';
  return formatPercentageValue(n * 100);
}

/**
 * Formatea un valor que YA está expresado en puntos porcentuales (18 → "18,00 %").
 * Usar SIEMPRE que el valor de origen ya venga multiplicado por 100 — esta
 * función NO hace ninguna conversión, solo formatea.
 *
 * Nunca adivines cuál de las dos funciones corresponde a partir de la
 * magnitud del valor (ej. "0.18 parece decimal, 18 parece puntos") — la
 * unidad la define el contrato de la fuente de datos (API/DTO), no el valor
 * observado. Si esa unidad es ambigua, no formatees: dejá el campo sin migrar
 * y documentá la ambigüedad.
 */
export function formatPercentagePoints(value: number | string | null | undefined): string {
  return formatPercentageValue(value);
}
