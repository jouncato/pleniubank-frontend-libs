/**
 * Extrae el nombre de archivo de un header `Content-Disposition` (RFC 6266),
 * priorizando `filename*=UTF-8''...` sobre `filename="..."`. Devuelve `null`
 * si el header falta o no trae un nombre reconocible (el llamador debe
 * aplicar un nombre de respaldo determinístico).
 */
export function parseContentDispositionFilename(header: string | null): string | null {
  if (!header) {
    return null;
  }
  const utf8Match = header.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (utf8Match) {
    try {
      return decodeURIComponent(utf8Match[1].trim());
    } catch {
      return utf8Match[1].trim();
    }
  }
  const quotedMatch = header.match(/filename\s*=\s*"([^"]+)"/i);
  if (quotedMatch) {
    return quotedMatch[1].trim();
  }
  const bareMatch = header.match(/filename\s*=\s*([^;]+)/i);
  if (bareMatch) {
    return bareMatch[1].trim();
  }
  return null;
}

/** Nombre de archivo de respaldo cuando el backend no envía `Content-Disposition` parseable. */
export function fallbackStatementFilename(accountId: string, period: string, format: 'csv' | 'pdf'): string {
  return `extracto_${accountId}_${period}.${format}`;
}
