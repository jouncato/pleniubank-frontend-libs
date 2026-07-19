import { ApiHttpError } from './api-error';

/**
 * @deprecated Usa `resolveUserFacingApiError` (`./resolve-user-facing-api-error`) en su
 * lugar. Este catálogo fue migrado tal cual a `resolveUserFacingApiError`; esta función
 * no admite overrides de contexto por llamada. Se mantiene por compatibilidad temporal —
 * no crear nuevos usos.
 */
export function mapApiErrorToUserMessage(error: ApiHttpError): string {
  const code = error.errors[0]?.code;

  switch (code) {
    case 'INVALID_CREDENTIALS':
      return 'Correo o contraseña incorrectos';
    case 'USER_INACTIVE':
      return 'Tu cuenta no está activa. Completa la verificación.';
    case 'ACCOUNT_LOCKED':
      return 'Tu cuenta está bloqueada. Contacta soporte.';
    case 'TOKEN_EXPIRED':
      return 'Tu sesión expiró. Vuelve a iniciar sesión.';
    case 'INVALID_TOKEN':
      return 'Sesión inválida. Inicia sesión de nuevo.';
    case 'CONFLICT':
      return 'No fue posible completar la operación por conflicto de datos.';
    case 'VALIDATION_ERROR':
      return 'Revisa los campos marcados e intenta de nuevo.';
    case 'NOT_FOUND':
      return 'El recurso solicitado no existe o expiró.';
    case 'TRANSFER_LIMIT_EXCEEDED':
      return 'Superaste el límite de transferencias permitido. Intenta con un monto menor o más tarde.';
    case 'BREB_KEY_NOT_RESOLVABLE':
      return 'No pudimos encontrar una cuenta asociada a ese dato. Verifícalo e intenta de nuevo.';
    case 'INSUFFICIENT_FUNDS':
      return 'No tienes saldo suficiente para esta operación.';
    case 'ACCOUNT_CLOSED':
      return 'Esta cuenta está cerrada y no admite esta operación.';
    case 'ACCOUNT_BALANCE_NOT_ZERO':
      return 'Debes dejar la cuenta en saldo cero antes de cerrarla.';
    case 'ACTIVE_OBLIGATIONS_PREVENT_CLOSURE':
      return 'Tienes obligaciones activas que impiden esta operación.';
    case 'EXTERNAL_DESTINATION_NOT_SUPPORTED':
      return 'Esta operación no admite cuentas o llaves externas.';
    case 'CROSS_TENANT_TRANSFER_NOT_ALLOWED':
      return 'No es posible transferir a esa cuenta desde tu país.';
    case 'STATEMENT_RANGE_EXCEEDED':
      return 'El rango de fechas solicitado es muy amplio. Prueba con un período más corto.';
    case 'IDEMPOTENCY_KEY_REUSED':
      return 'Ya procesamos esta operación. Actualiza la pantalla para ver el resultado.';
    case 'NOT_ELIGIBLE':
      return 'No fue posible completar la solicitud con los datos indicados.';
    case 'OTP_LOCKED':
      return 'Superaste los intentos permitidos. Espera unos minutos e inténtalo de nuevo.';
    case 'RATE_LIMIT_EXCEEDED':
      return 'Demasiados intentos. Espera un momento antes de volver a intentarlo.';
    default:
      if (error.status === 0) {
        return 'Error de conexión. Verifica tu red e intenta de nuevo.';
      }
      if (error.status === 429) {
        return 'Demasiados intentos. Espera unos minutos.';
      }
      if (error.status === 501) {
        return 'Esta funcionalidad aún no está disponible.';
      }
      return 'Ocurrió un error inesperado.';
  }
}
