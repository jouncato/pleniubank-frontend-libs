import { TestBed } from '@angular/core/testing';
import { RulesSessionService, type RulesRole } from './rules-session.service';
import { SessionStore } from './session-store.service';
import { SESSION_STRATEGY } from './session-strategy.token';

/**
 * Crea un JWT de prueba (sin firma válida — solo para leer el payload en cliente).
 * Formato: `header.payload.signature` con base64url.
 */
function makeJwt(payload: Record<string, unknown>): string {
  const b64url = (obj: Record<string, unknown>): string => {
    const json = JSON.stringify(obj);
    // btoa en test env (jsdom/node >= 16): disponible
    const b64 = btoa(
      encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_m, p: string) =>
        String.fromCharCode(parseInt(p, 16)),
      ),
    );
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
  const header = b64url({ alg: 'HS256', typ: 'JWT' });
  const body = b64url(payload);
  return `${header}.${body}.signature`;
}

describe('RulesSessionService', () => {
  let service: RulesSessionService;
  let store: SessionStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SessionStore,
        { provide: SESSION_STRATEGY, useValue: 'bearerToken' as const },
      ],
    });
    service = TestBed.inject(RulesSessionService);
    store = TestBed.inject(SessionStore);
  });

  describe('jerarquía de roles (matriz 4×4)', () => {
    const ROLES: RulesRole[] = [
      'rules:viewer',
      'rules:author',
      'rules:approver',
      'rules:admin',
    ];

    // Matriz esperada: la fila es el rol que tiene el usuario,
    // la columna es el rol requerido. true = debe pasar.
    const EXPECTED: Record<RulesRole, Record<RulesRole, boolean>> = {
      'rules:viewer': {
        'rules:viewer': true,
        'rules:author': false,
        'rules:approver': false,
        'rules:admin': false,
      },
      'rules:author': {
        'rules:viewer': true,
        'rules:author': true,
        'rules:approver': false,
        'rules:admin': false,
      },
      'rules:approver': {
        'rules:viewer': true,
        'rules:author': true,
        'rules:approver': true,
        'rules:admin': false,
      },
      'rules:admin': {
        'rules:viewer': true,
        'rules:author': true,
        'rules:approver': true,
        'rules:admin': true,
      },
    };

    for (const held of ROLES) {
      for (const required of ROLES) {
        const expected = EXPECTED[held][required];
        it(`'${held}' hasRulesRole('${required}') === ${expected}`, () => {
          store.setAdminToken(makeJwt({ sub: 'u1', roles: [held] }));
          expect(service.hasRulesRole(required)).toBe(expected);
        });
      }
    }
  });

  it('devuelve false si no hay admin token', () => {
    store.setAdminToken(null);
    expect(service.hasRulesRole('rules:viewer')).toBe(false);
  });

  it('devuelve false si el token no contiene claim roles[]', () => {
    store.setAdminToken(makeJwt({ sub: 'u1' }));
    expect(service.hasRulesRole('rules:viewer')).toBe(false);
  });

  it('devuelve false si roles no es un array', () => {
    store.setAdminToken(makeJwt({ sub: 'u1', roles: 'rules:admin' }));
    expect(service.hasRulesRole('rules:admin')).toBe(false);
  });

  it('ignora elementos no-string dentro de roles[]', () => {
    store.setAdminToken(
      makeJwt({ sub: 'u1', roles: [123, null, 'rules:author'] as unknown[] }),
    );
    expect(service.hasRulesRole('rules:author')).toBe(true);
    expect(service.hasRulesRole('rules:approver')).toBe(false);
  });

  it('token malformado no lanza — retorna []', () => {
    store.setAdminToken('not-a-jwt');
    expect(service.hasRulesRole('rules:viewer')).toBe(false);
  });

  it('múltiples roles: toma el de mayor nivel', () => {
    store.setAdminToken(
      makeJwt({ sub: 'u1', roles: ['rules:viewer', 'rules:approver'] }),
    );
    expect(service.hasRulesRole('rules:approver')).toBe(true);
    expect(service.hasRulesRole('rules:admin')).toBe(false);
  });

  it('rol desconocido en el token es ignorado', () => {
    store.setAdminToken(
      makeJwt({ sub: 'u1', roles: ['some:other:role', 'rules:viewer'] }),
    );
    expect(service.hasRulesRole('rules:viewer')).toBe(true);
    expect(service.hasRulesRole('rules:author')).toBe(false);
  });

  it('getRolesFromAdminToken expone lista cruda de roles string', () => {
    store.setAdminToken(makeJwt({ sub: 'u1', roles: ['rules:admin', 'x'] }));
    expect(service.getRolesFromAdminToken()).toEqual(['rules:admin', 'x']);
  });
});
