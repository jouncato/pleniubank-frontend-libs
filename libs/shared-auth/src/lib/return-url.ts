/**
 * Solo se permiten rutas internas de la app para evitar open redirect.
 * Reglas FE-SEC-003:
 * - Debe comenzar con /app/ o /admin/
 * - No se aceptan URLs absolutas o esquemas (http, https, javascript, data, etc.)
 */
export function isValidReturnUrl(returnUrl: string | null | undefined): returnUrl is string {
  if (typeof returnUrl !== 'string') {
    return false;
  }

  const candidate = returnUrl.trim();
  if (!candidate) {
    return false;
  }

  // Debe ser ruta relativa interna.
  if (!candidate.startsWith('/')) {
    return false;
  }

  // Evita rutas protocol-relative (//evil.com/...).
  if (candidate.startsWith('//')) {
    return false;
  }

  // Evita payloads con espacios/saltos de línea.
  if (/\s/.test(candidate)) {
    return false;
  }

  return candidate.startsWith('/app/') || candidate.startsWith('/admin/');
}
