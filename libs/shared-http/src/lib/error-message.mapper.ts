import { ApiHttpError } from './api-error';

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
