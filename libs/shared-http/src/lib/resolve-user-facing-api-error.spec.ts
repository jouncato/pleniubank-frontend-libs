import { ApiHttpError } from './api-error';
import { resolveUserFacingApiError } from './resolve-user-facing-api-error';

function errorWithCode(code: string, status = 422, correlationId?: string): ApiHttpError {
  return new ApiHttpError(status, [{ code, message: 'raw backend detail — nunca debe mostrarse' }], correlationId);
}

function errorWithoutErrors(status: number, correlationId?: string): ApiHttpError {
  return new ApiHttpError(status, [], correlationId);
}

const KNOWN_CODE_CASES: Array<[string, RegExp]> = [
  ['INVALID_CREDENTIALS', /correo o contraseña incorrectos/i],
  ['USER_INACTIVE', /no está activa/i],
  ['ACCOUNT_LOCKED', /bloqueada/i],
  ['TOKEN_EXPIRED', /sesión expiró/i],
  ['SESSION_REPLACED', /otro dispositivo/i],
  ['SESSION_REVOKED', /cerrada por seguridad/i],
  ['SESSION_REQUIRED', /actualizarse/i],
  ['INVALID_TOKEN', /sesión inválida/i],
  ['CONFLICT', /conflicto de datos/i],
  ['VALIDATION_ERROR', /revisa los campos marcados/i],
  ['NOT_FOUND', /no existe o expiró/i],
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
  ['CUSTOM_KEY_FORMAT_NOT_ALLOWED', /alias no es válido/i],
];

describe('resolveUserFacingApiError — catálogo central', () => {
  it.each(KNOWN_CODE_CASES)('mapea %s al mensaje curado del catálogo central', (code, pattern) => {
    const message = resolveUserFacingApiError(errorWithCode(code));
    expect(message).toMatch(pattern);
  });

  it('nunca devuelve el mensaje crudo del backend para un código conocido', () => {
    const message = resolveUserFacingApiError(errorWithCode('INVALID_CREDENTIALS'));
    expect(message).not.toMatch(/raw backend detail/i);
  });

  it('no revela detalle adicional en errores genéricos anti-enumeración', () => {
    const notEligible = resolveUserFacingApiError(errorWithCode('NOT_ELIGIBLE'));
    expect(notEligible).not.toMatch(/existe|registrad[oa]|otro usuario|otra cuenta/i);
  });
});

describe('resolveUserFacingApiError — overrides de contexto', () => {
  it('un override puntual tiene prioridad sobre el catálogo central para el mismo código', () => {
    const message = resolveUserFacingApiError(errorWithCode('ACCOUNT_LOCKED'), {
      overrides: { ACCOUNT_LOCKED: 'Tu cuenta esta bloqueada.' },
    });
    expect(message).toBe('Tu cuenta esta bloqueada.');
  });

  it('sin override para el código recibido, cae al catálogo central aunque haya otros overrides', () => {
    const message = resolveUserFacingApiError(errorWithCode('USER_INACTIVE'), {
      overrides: { ACCOUNT_LOCKED: 'Tu cuenta esta bloqueada.' },
    });
    expect(message).toMatch(/no está activa/i);
  });

  it('un código desconocido usa el fallback de contexto en vez del genérico', () => {
    const message = resolveUserFacingApiError(errorWithCode('SOME_UNMAPPED_CODE'), {
      fallback: 'No fue posible completar la solicitud. Intenta nuevamente.',
    });
    expect(message).toBe('No fue posible completar la solicitud. Intenta nuevamente.');
  });

  it('un override para un código no presente en el error no se aplica', () => {
    const message = resolveUserFacingApiError(errorWithCode('SOME_UNMAPPED_CODE'), {
      fallback: 'fallback de contexto',
      overrides: { ACCOUNT_LOCKED: 'no debería usarse' },
    });
    expect(message).toBe('fallback de contexto');
  });
});

describe('resolveUserFacingApiError — fallback seguro por status y genérico', () => {
  it('código desconocido sin fallback de contexto cae al mensaje genérico', () => {
    const message = resolveUserFacingApiError(errorWithCode('SOME_UNMAPPED_CODE', 400));
    expect(message).toBe('Ocurrió un error inesperado.');
  });

  it('status 0 (sin conexión) sin código ni fallback de contexto usa el mensaje de red', () => {
    const message = resolveUserFacingApiError(errorWithoutErrors(0));
    expect(message).toMatch(/error de conexión/i);
  });

  it('status 429 sin código conocido usa el mensaje de límite de intentos', () => {
    const message = resolveUserFacingApiError(errorWithoutErrors(429));
    expect(message).toMatch(/demasiados intentos/i);
  });

  it('status 501 sin código conocido usa el mensaje de funcionalidad no disponible', () => {
    const message = resolveUserFacingApiError(errorWithoutErrors(501));
    expect(message).toMatch(/no está disponible/i);
  });

  it('cuerpo de error vacío (sin errors[]) no lanza y cae al fallback seguro', () => {
    const error = new ApiHttpError(500, []);
    expect(() => resolveUserFacingApiError(error)).not.toThrow();
    expect(resolveUserFacingApiError(error)).toBe('Ocurrió un error inesperado.');
  });

  it('errors[0] sin código útil (string vacío) no lanza y cae al fallback seguro', () => {
    const error = new ApiHttpError(422, [{ code: '', message: 'x' }]);
    expect(() => resolveUserFacingApiError(error)).not.toThrow();
    expect(resolveUserFacingApiError(error)).toBe('Ocurrió un error inesperado.');
  });
});

describe('resolveUserFacingApiError — accesibilidad y localización', () => {
  it('devuelve texto plano legible (sin marcado HTML) para códigos conocidos y desconocidos', () => {
    const known = resolveUserFacingApiError(errorWithCode('INVALID_CREDENTIALS'));
    const unknown = resolveUserFacingApiError(errorWithCode('SOME_UNMAPPED_CODE'));
    for (const message of [known, unknown]) {
      expect(message).not.toMatch(/<[a-z][\s\S]*>/i);
      expect(message.trim().length).toBeGreaterThan(0);
    }
  });

  it('todos los mensajes del catálogo están en español (sin texto técnico en inglés)', () => {
    for (const [code] of KNOWN_CODE_CASES) {
      const message = resolveUserFacingApiError(errorWithCode(code));
      expect(message).not.toMatch(/\b(invalid|expired|error|failed|unauthorized|token)\b/i);
    }
  });
});

describe('resolveUserFacingApiError — correlation ID nunca visible al usuario', () => {
  it('el correlationId del error no aparece en el mensaje para un código conocido', () => {
    const correlationId = 'corr-id-12345-support-only';
    const message = resolveUserFacingApiError(errorWithCode('INVALID_CREDENTIALS', 401, correlationId));
    expect(message).not.toContain(correlationId);
  });

  it('el correlationId del error no aparece en el mensaje para un código desconocido (fallback)', () => {
    const correlationId = 'corr-id-67890-support-only';
    const message = resolveUserFacingApiError(errorWithCode('SOME_UNMAPPED_CODE', 400, correlationId));
    expect(message).not.toContain(correlationId);
  });

  it('el correlationId del error no aparece en el mensaje por fallback de status (network/rate limit)', () => {
    const correlationId = 'corr-id-network-support-only';
    const message = resolveUserFacingApiError(errorWithoutErrors(0, correlationId));
    expect(message).not.toContain(correlationId);
  });
});
