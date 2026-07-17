/**
 * Decodifica el payload de un JWT (segunda parte, base64url).
 * Devuelve `null` si el token es inválido o no contiene JSON parseable.
 * No valida la firma: solo para leer claims en cliente.
 *
 * Compartido entre `shared-auth` (roles del rules-engine) y `shared-http`
 * (claim `country_code` del interceptor de tenant) para evitar duplicar
 * esta lógica byte-a-byte en ambas libs.
 */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) {
      return null;
    }
    const payloadSegment = parts[1];
    // base64url → base64
    const b64 = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '==='.slice((b64.length + 3) % 4);
    // Libs frontend: atob siempre disponible (browser + jsdom/test env).
    const decoded = atob(padded);
    // Unicode-safe decode (para caracteres no-ASCII en claims)
    const json = decodeURIComponent(
      decoded
        .split('')
        .map((c: string) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
    const parsed: unknown = JSON.parse(json);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}
