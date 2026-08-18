import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';

import { customerGuard } from './customer.guard';
import { SessionStore } from './session-store.service';

describe('customerGuard', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), SessionStore],
    });
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  it.each(['user', 'customer', 'enterprise_principal', 'enterprise_admin', 'enterprise_operator'])(
    'permite acceso a un usuario con role %s',
    (role) => {
      const store = TestBed.inject(SessionStore);
      store.setClaims({ role });

      const result = TestBed.runInInjectionContext(() =>
        customerGuard({} as never, { url: '/app/dashboard' } as never),
      );
      expect(result).toBe(true);
    },
  );

  // Regresión (hallazgo de seguridad en vivo, 2026-08-17): una cuenta admin
  // podía autenticar normalmente en el portal de cliente porque authGuard
  // solo valida sesión, nunca rol. customerGuard debe rechazar CUALQUIER rol
  // de staff, sin excepción -- allow-list, no block-list, para que un rol de
  // staff nuevo quede bloqueado por defecto.
  it.each([
    'admin',
    'employee',
    'sre',
    'devops',
    'risk_officer',
    'compliance_officer',
    'legal_admin',
    'auditor',
  ])('rechaza a un usuario staff con role %s y redirige a forbidden', (role) => {
    const store = TestBed.inject(SessionStore);
    store.setClaims({ role });
    const router = TestBed.inject(Router);

    const result = TestBed.runInInjectionContext(() =>
      customerGuard({} as never, { url: '/app/dashboard' } as never),
    );
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/auth/forbidden']);
  });

  it('sin claims hidratados (error transitorio) deja pasar -- el backend valida cada llamada real', () => {
    const result = TestBed.runInInjectionContext(() =>
      customerGuard({} as never, { url: '/app/dashboard' } as never),
    );
    expect(result).toBe(true);
  });
});
