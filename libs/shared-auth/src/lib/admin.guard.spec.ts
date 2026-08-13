import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';

import { adminGuard } from './admin.guard';
import { PORTAL_APP } from './portal-app.token';
import { SessionStore } from './session-store.service';

describe('adminGuard', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), SessionStore, { provide: PORTAL_APP, useValue: 'backoffice' as const }],
    });
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  it('permite acceso con userToken, adminToken y role admin', () => {
    const store = TestBed.inject(SessionStore);
    store.setUserToken('u');
    store.setAdminToken('a');
    store.setClaims({ role: 'admin' });

    const result = TestBed.runInInjectionContext(() =>
      adminGuard({} as never, { url: '/admin/x' } as never),
    );
    expect(result).toBe(true);
  });

  it('sin userToken redirige a login', () => {
    const store = TestBed.inject(SessionStore);
    store.setAdminToken('a');
    store.setClaims({ role: 'admin' });
    const router = TestBed.inject(Router);

    const result = TestBed.runInInjectionContext(() =>
      adminGuard({} as never, { url: '/admin/x' } as never),
    );
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/staff/access/login'], {
      queryParams: { returnUrl: '/admin/x' },
    });
  });

  it('sin adminToken redirige a forbidden', () => {
    const store = TestBed.inject(SessionStore);
    store.setUserToken('u');
    store.setClaims({ role: 'admin' });
    const router = TestBed.inject(Router);

    const result = TestBed.runInInjectionContext(() =>
      adminGuard({} as never, { url: '/admin/x' } as never),
    );
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/auth/forbidden']);
  });

  it('password_must_change redirige a cambio de contrasena', () => {
    const store = TestBed.inject(SessionStore);
    store.setUserToken('u');
    store.setAdminToken('a');
    store.setClaims({ role: 'admin', password_must_change: true });
    const router = TestBed.inject(Router);

    const result = TestBed.runInInjectionContext(() =>
      adminGuard({} as never, { url: '/admin/x' } as never),
    );
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/staff/access/change-password'], {
      queryParams: { returnUrl: '/admin/x' },
    });
  });

  it('rol distinto de admin redirige a forbidden', () => {
    const store = TestBed.inject(SessionStore);
    store.setUserToken('u');
    store.setAdminToken('a');
    store.setClaims({ role: 'customer' });
    const router = TestBed.inject(Router);

    const result = TestBed.runInInjectionContext(() =>
      adminGuard({} as never, { url: '/admin/x' } as never),
    );
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/auth/forbidden']);
  });

  // Verificación en vivo 2026-08-12: `employee`/`risk_officer`/`compliance_officer`
  // son roles staff creables desde "Nuevo staff" en el backoffice, y hay
  // pantallas reales (aprobación de la política global de Anticipo de
  // nómina) que EXIGEN risk_officer/compliance_officer -- pero quedaban
  // fuera de la whitelist de este guard de nivel superior, así que ese staff
  // nunca lograba pasar de la pantalla de login pese a tener credenciales
  // válidas.
  it.each(['employee', 'risk_officer', 'compliance_officer'])(
    'permite acceso a un usuario staff con role %s',
    (role) => {
      const store = TestBed.inject(SessionStore);
      store.setUserToken('u');
      store.setAdminToken('a');
      store.setClaims({ role });

      const result = TestBed.runInInjectionContext(() =>
        adminGuard({} as never, { url: '/admin/x' } as never),
      );
      expect(result).toBe(true);
    },
  );
});

