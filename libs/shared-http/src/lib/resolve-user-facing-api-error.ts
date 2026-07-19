import type { ApiHttpError } from './api-error';

/**
 * Catálogo central de códigos de error API conocidos → mensaje curado en español.
 * Migrado tal cual desde `mapApiErrorToUserMessage` (ver `error-message.mapper.ts`,
 * ahora deprecado): ningún texto fue modificado, solo trasladado.
 *
 * NO añadas un nuevo `switch (code)` / mapa paralelo en otro archivo: agrega la
 * entrada aquí. `scripts/check-error-mapper-regressions.sh` falla el build si
 * detecta un mapeador de errores local fuera de este archivo.
 */
const KNOWN_ERROR_CODE_MESSAGES: Readonly<Record<string, string>> = {
  INVALID_CREDENTIALS: 'Correo o contraseña incorrectos',
  USER_INACTIVE: 'Tu cuenta no está activa. Completa la verificación.',
  ACCOUNT_LOCKED: 'Tu cuenta está bloqueada. Contacta soporte.',
  TOKEN_EXPIRED: 'Tu sesión expiró. Vuelve a iniciar sesión.',
  INVALID_TOKEN: 'Sesión inválida. Inicia sesión de nuevo.',
  CONFLICT: 'No fue posible completar la operación por conflicto de datos.',
  VALIDATION_ERROR: 'Revisa los campos marcados e intenta de nuevo.',
  NOT_FOUND: 'El recurso solicitado no existe o expiró.',
  TRANSFER_LIMIT_EXCEEDED:
    'Superaste el límite de transferencias permitido. Intenta con un monto menor o más tarde.',
  BREB_KEY_NOT_RESOLVABLE:
    'No pudimos encontrar una cuenta asociada a ese dato. Verifícalo e intenta de nuevo.',
  INSUFFICIENT_FUNDS: 'No tienes saldo suficiente para esta operación.',
  ACCOUNT_CLOSED: 'Esta cuenta está cerrada y no admite esta operación.',
  ACCOUNT_BALANCE_NOT_ZERO: 'Debes dejar la cuenta en saldo cero antes de cerrarla.',
  ACTIVE_OBLIGATIONS_PREVENT_CLOSURE: 'Tienes obligaciones activas que impiden esta operación.',
  EXTERNAL_DESTINATION_NOT_SUPPORTED: 'Esta operación no admite cuentas o llaves externas.',
  CROSS_TENANT_TRANSFER_NOT_ALLOWED: 'No es posible transferir a esa cuenta desde tu país.',
  STATEMENT_RANGE_EXCEEDED:
    'El rango de fechas solicitado es muy amplio. Prueba con un período más corto.',
  IDEMPOTENCY_KEY_REUSED: 'Ya procesamos esta operación. Actualiza la pantalla para ver el resultado.',
  NOT_ELIGIBLE: 'No fue posible completar la solicitud con los datos indicados.',
  OTP_LOCKED: 'Superaste los intentos permitidos. Espera unos minutos e inténtalo de nuevo.',
  RATE_LIMIT_EXCEEDED: 'Demasiados intentos. Espera un momento antes de volver a intentarlo.',
};

const GENERIC_FALLBACK_MESSAGE = 'Ocurrió un error inesperado.';

/** Mensaje de respaldo cuando no hay código conocido, según `status` HTTP. */
function statusFallbackMessage(status: number): string {
  if (status === 0) {
    return 'Error de conexión. Verifica tu red e intenta de nuevo.';
  }
  if (status === 429) {
    return 'Demasiados intentos. Espera unos minutos.';
  }
  if (status === 501) {
    return 'Esta funcionalidad aún no está disponible.';
  }
  return GENERIC_FALLBACK_MESSAGE;
}

export interface ResolveUserFacingApiErrorContext {
  /** Usado en lugar del mensaje genérico por defecto cuando el código no está en el catálogo central. */
  fallback?: string;
  /**
   * Override puntual para un código específico, con prioridad sobre el catálogo
   * central (permite que un flujo use una frase distinta para el mismo código sin
   * duplicar el catálogo — ej. login quiere "Tu cuenta esta bloqueada." en vez del
   * "Tu cuenta está bloqueada. Contacta soporte." genérico del catálogo para
   * ACCOUNT_LOCKED).
   */
  overrides?: Partial<Record<string, string>>;
}

/**
 * API canónica única para convertir un `ApiHttpError` en un mensaje seguro y
 * apto para mostrar al usuario final.
 *
 * Orden de resolución:
 * 1. `context.overrides[code]`, si existe.
 * 2. Catálogo central (`KNOWN_ERROR_CODE_MESSAGES`), si `code` es conocido.
 * 3. `context.fallback`, si fue provisto.
 * 4. Fallback por `status` HTTP (0/429/501) y, si ninguno aplica, el mensaje
 *    genérico.
 *
 * Nunca devuelve el mensaje crudo del backend ni el `correlationId` del error:
 * ambos solo sirven para diagnóstico/soporte, no para UI.
 */
export function resolveUserFacingApiError(
  error: ApiHttpError,
  context?: ResolveUserFacingApiErrorContext,
): string {
  const code = error.errors[0]?.code;

  if (code) {
    const override = context?.overrides?.[code];
    if (override) {
      return override;
    }

    const known = KNOWN_ERROR_CODE_MESSAGES[code];
    if (known) {
      return known;
    }
  }

  if (context?.fallback) {
    return context.fallback;
  }

  return statusFallbackMessage(error.status);
}
