import { describe, expect, it } from 'vitest';
import { ApiHttpError } from './api-error';
import { mapApiErrorToUserMessage } from './error-message.mapper';

function makeError(status: number, code: string): ApiHttpError {
  return new ApiHttpError(status, [{ code, message: 'raw message' }]);
}

describe('mapApiErrorToUserMessage()', () => {
  it('returns friendly message for INVALID_CREDENTIALS', () => {
    const msg = mapApiErrorToUserMessage(makeError(401, 'INVALID_CREDENTIALS'));
    expect(msg).toBe('Correo o contraseña incorrectos');
  });

  it('returns friendly message for USER_INACTIVE', () => {
    const msg = mapApiErrorToUserMessage(makeError(403, 'USER_INACTIVE'));
    expect(msg).toBe('Tu cuenta no está activa. Completa la verificación.');
  });

  it('returns friendly message for ACCOUNT_LOCKED', () => {
    const msg = mapApiErrorToUserMessage(makeError(403, 'ACCOUNT_LOCKED'));
    expect(msg).toBe('Tu cuenta está bloqueada. Contacta soporte.');
  });

  it('returns friendly message for TOKEN_EXPIRED', () => {
    const msg = mapApiErrorToUserMessage(makeError(401, 'TOKEN_EXPIRED'));
    expect(msg).toBe('Tu sesión expiró. Vuelve a iniciar sesión.');
  });

  it('returns friendly message for INVALID_TOKEN', () => {
    const msg = mapApiErrorToUserMessage(makeError(401, 'INVALID_TOKEN'));
    expect(msg).toBe('Sesión inválida. Inicia sesión de nuevo.');
  });

  it('returns friendly message for CONFLICT', () => {
    const msg = mapApiErrorToUserMessage(makeError(409, 'CONFLICT'));
    expect(msg).toBe('No fue posible completar la operación por conflicto de datos.');
  });

  it('returns friendly message for VALIDATION_ERROR', () => {
    const msg = mapApiErrorToUserMessage(makeError(422, 'VALIDATION_ERROR'));
    expect(msg).toBe('Revisa los campos marcados e intenta de nuevo.');
  });

  it('returns friendly message for NOT_FOUND', () => {
    const msg = mapApiErrorToUserMessage(makeError(404, 'NOT_FOUND'));
    expect(msg).toBe('El recurso solicitado no existe o expiró.');
  });

  it('returns connection error message for status 0 with unknown code', () => {
    const msg = mapApiErrorToUserMessage(makeError(0, 'NETWORK_ERROR'));
    expect(msg).toBe('Error de conexión. Verifica tu red e intenta de nuevo.');
  });

  it('returns rate limit message for status 429 with unknown code', () => {
    const msg = mapApiErrorToUserMessage(makeError(429, 'UNKNOWN_CODE'));
    expect(msg).toBe('Demasiados intentos. Espera unos minutos.');
  });

  it('returns not available message for status 501 with unknown code', () => {
    const msg = mapApiErrorToUserMessage(makeError(501, 'UNKNOWN_CODE'));
    expect(msg).toBe('Esta funcionalidad aún no está disponible.');
  });

  it('returns generic fallback message for unrecognized code and status', () => {
    const msg = mapApiErrorToUserMessage(makeError(500, 'INTERNAL_SERVER_ERROR'));
    expect(msg).toBe('Ocurrió un error inesperado.');
  });

  it('returns generic fallback message for 400 with unrecognized code', () => {
    const msg = mapApiErrorToUserMessage(makeError(400, 'SOME_UNKNOWN_CODE'));
    expect(msg).toBe('Ocurrió un error inesperado.');
  });

  it('returns connection error message when status is 0 even with missing code', () => {
    const error = new ApiHttpError(0, []);
    const msg = mapApiErrorToUserMessage(error);
    expect(msg).toBe('Error de conexión. Verifica tu red e intenta de nuevo.');
  });
});
