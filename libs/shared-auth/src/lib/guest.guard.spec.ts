import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { guestGuard } from './guest.guard';
import { PORTAL_APP, PortalAppKind } from './portal-app.token';
import { SessionStore } from './session-store.service';

function configureTest(portal: PortalAppKind): Router {
  TestBed.resetTestingModule();
  sessionStorage.clear();
  TestBed.configureTestingModule({
    providers: [provideRouter([]), SessionStore, { provide: PORTAL_APP, useValue: portal }],
  });
  const router = TestBed.inject(Router);
  vi.spyOn(router, 'navigate').mockResolvedValue(true);
  return router;
}

describe('guestGuard', () => {
  it('permits access when there is no authenticated session', () => {
    configureTest('customer');
    const result = TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never));
    expect(result).toBe(true);
  });

  it('redirects customer sessions to dashboard', () => {
    const router = configureTest('customer');
    const store = TestBed.inject(SessionStore);
    store.setUserToken('token');

    const result = TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never));
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/app/dashboard']);
  });

  it('redirects backoffice sessions to admin dashboard', () => {
    const router = configureTest('backoffice');
    const store = TestBed.inject(SessionStore);
    store.setUserToken('token');

    const result = TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never));
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/admin/dashboard']);
  });
});
