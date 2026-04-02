import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';

import { phoneVerifiedGuard } from './phone-verified.guard';
import { PORTAL_APP } from './portal-app.token';
import { SessionStore } from './session-store.service';

describe('phoneVerifiedGuard', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    sessionStorage.clear();
  });

  function configure(portal: string, claims: ReturnType<SessionStore['claims']>) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: PORTAL_APP, useValue: portal },
        { provide: SessionStore, useValue: { claims: () => claims } },
      ],
    });
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    return router;
  }

  it('permite otros portales', () => {
    configure('backoffice', { phone_verified: false });
    const result = TestBed.runInInjectionContext(() =>
      phoneVerifiedGuard({} as never, { url: '/app/personal/loans/list' } as never),
    );
    expect(result).toBe(true);
    expect(TestBed.inject(Router).navigate).not.toHaveBeenCalled();
  });

  it('permite sesion enterprise', () => {
    configure('customer', { enterprise_id: 'ent-1', phone_verified: false });
    const result = TestBed.runInInjectionContext(() =>
      phoneVerifiedGuard({} as never, { url: '/x' } as never),
    );
    expect(result).toBe(true);
  });

  it('permite customer con telefono verificado', () => {
    configure('customer', { phone_verified: true });
    const result = TestBed.runInInjectionContext(() =>
      phoneVerifiedGuard({} as never, { url: '/x' } as never),
    );
    expect(result).toBe(true);
  });

  it('redirige a verify-phone en customer B2C sin telefono', () => {
    const router = configure('customer', { phone_verified: false });
    const result = TestBed.runInInjectionContext(() =>
      phoneVerifiedGuard({} as never, { url: '/app/personal/loans/list' } as never),
    );
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/app/verify-phone'], {
      queryParams: { returnUrl: '/app/personal/loans/list' },
    });
  });

  it('redirige desde dashboard si B2C sin telefono', () => {
    const router = configure('customer', { phone_verified: false });
    const result = TestBed.runInInjectionContext(() =>
      phoneVerifiedGuard({} as never, { url: '/app/dashboard' } as never),
    );
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/app/verify-phone'], {
      queryParams: { returnUrl: '/app/dashboard' },
    });
  });
});
