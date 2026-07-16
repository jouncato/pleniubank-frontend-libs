import { ApiHttpError } from './api-error';
import { mapApiErrorToUserMessage } from './error-message.mapper';

function errorWithCode(code: string): ApiHttpError {
  return new ApiHttpError(422, [{ code, message: 'x' }]);
}

describe('mapApiErrorToUserMessage — b2c-data-access codes', () => {
  const cases: Array<[string, RegExp]> = [
    ['TRANSFER_LIMIT_EXCEEDED', /límite de transferencias/i],
    ['BREB_KEY_NOT_RESOLVABLE', /no pudimos encontrar una cuenta/i],
    ['INSUFFICIENT_FUNDS', /saldo suficiente/i],
    ['ACCOUNT_CLOSED', /cuenta está cerrada/i],
    ['ACCOUNT_BALANCE_NOT_ZERO', /saldo cero/i],
    ['ACTIVE_OBLIGATIONS_PREVENT_CLOSURE', /obligaciones activas/i],
    ['EXTERNAL_DESTINATION_NOT_SUPPORTED', /cuentas o llaves externas/i],
    ['CROSS_TENANT_TRANSFER_NOT_ALLOWED', /no es posible transferir/i],
    ['STATEMENT_RANGE_EXCEEDED', /rango de fechas/i],
    ['IDEMPOTENCY_KEY_REUSED', /ya procesamos esta operación/i],
    ['NOT_ELIGIBLE', /no fue posible completar la solicitud/i],
    ['OTP_LOCKED', /intentos permitidos/i],
    ['RATE_LIMIT_EXCEEDED', /demasiados intentos/i],
  ];

  it.each(cases)('mapea %s a un mensaje específico', (code, pattern) => {
    const message = mapApiErrorToUserMessage(errorWithCode(code));
    expect(message).toMatch(pattern);
  });

  it('no revela detalle adicional en errores genéricos anti-enumeración', () => {
    const notEligible = mapApiErrorToUserMessage(errorWithCode('NOT_ELIGIBLE'));
    expect(notEligible).not.toMatch(/existe|registrad[oa]|otro usuario|otra cuenta/i);
  });

  it('código desconocido cae al mensaje genérico', () => {
    const message = mapApiErrorToUserMessage(errorWithCode('SOME_UNMAPPED_CODE'));
    expect(message).toBe('Ocurrió un error inesperado.');
  });

  /**
   * `virtual-account-data-access` (tarea 2.3): `BREB_KEY_NOT_ELIGIBLE` (rechazo
   * anti-enumeración del registro de llaves self-service) y `BREB_KEY_NOT_FOUND`
   * (delete de llave inexistente/ya inactiva) NO se añaden explícitamente al
   * mapper: el fallback genérico ya produce un mensaje que no revela detalle,
   * igual que `NOT_ELIGIBLE`. Se documenta con este test para que una futura
   * regresión accidental (p. ej. alguien añade un mensaje enriquecido) sea
   * detectada.
   */
  it('BREB_KEY_NOT_ELIGIBLE y BREB_KEY_NOT_FOUND caen al mensaje genérico (sin código explícito en el mapper)', () => {
    const notEligible = mapApiErrorToUserMessage(errorWithCode('BREB_KEY_NOT_ELIGIBLE'));
    const notFound = mapApiErrorToUserMessage(errorWithCode('BREB_KEY_NOT_FOUND'));

    expect(notEligible).toBe('Ocurrió un error inesperado.');
    expect(notFound).toBe('Ocurrió un error inesperado.');
    expect(notEligible).not.toMatch(/existe|registrad[oa]|otro usuario|otra cuenta|llave/i);
  });
});
