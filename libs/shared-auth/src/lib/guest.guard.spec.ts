import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router } from '@angular/router';
import { guestGuard } from './guest.guard';
import { PORTAL_APP, PortalAppKind } from './portal-app.token';
import { SessionStore } from './session-store.service';

function makeRoute(returnUrl?: string): ActivatedRouteSnapshot {
  return {
    queryParamMap: {
      get: (key: string) => (key === 'returnUrl' ? (returnUrl ?? null) : null),
    },
  } as unknown as ActivatedRouteSnapshot;
}

function configureTest(portal: PortalAppKind): Router {
  TestBed.resetTestingModule();
  sessionStorage.clear();
  TestBed.configureTestingModule({
    providers: [provideRouter([]), SessionStore, { provide: PORTAL_APP, useValue: portal }],
  });
  const router = TestBed.inject(Router);
  vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  return router;
}

describe('guestGuard', () => {
  it('permits access when there is no authenticated session', () => {
    configureTest('customer');
    const result = TestBed.runInInjectionContext(() => guestGuard(makeRoute(), {} as never));
    expect(result).toBe(true);
  });

  it('redirects customer sessions to dashboard when no returnUrl', () => {
    const router = configureTest('customer');
    const store = TestBed.inject(SessionStore);
    store.setUserToken('token');

    const result = TestBed.runInInjectionContext(() => guestGuard(makeRoute(), {} as never));
    expect(result).toBe(false);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/app/dashboard');
  });

  it('redirects backoffice sessions to admin dashboard when no returnUrl', () => {
    const router = configureTest('backoffice');
    const store = TestBed.inject(SessionStore);
    store.setUserToken('token');

    const result = TestBed.runInInjectionContext(() => guestGuard(makeRoute(), {} as never));
    expect(result).toBe(false);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/admin/dashboard');
  });

  it('honors a valid returnUrl when the session is already active', () => {
    const router = configureTest('backoffice');
    const store = TestBed.inject(SessionStore);
    store.setUserToken('token');

    const result = TestBed.runInInjectionContext(() =>
      guestGuard(makeRoute('/admin/help-tooltips'), {} as never),
    );
    expect(result).toBe(false);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/admin/help-tooltips');
  });

  it('ignores an unsafe returnUrl and falls back to dashboard', () => {
    const router = configureTest('backoffice');
    const store = TestBed.inject(SessionStore);
    store.setUserToken('token');

    const result = TestBed.runInInjectionContext(() =>
      guestGuard(makeRoute('https://evil.com'), {} as never),
    );
    expect(result).toBe(false);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/admin/dashboard');
  });
});
