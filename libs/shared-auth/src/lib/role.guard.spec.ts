import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';

import { roleGuard } from './role.guard';
import { SessionStore } from './session-store.service';

describe('roleGuard', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), SessionStore],
    });
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  it('allows access when no requiredRole is specified in route data', () => {
    const result = TestBed.runInInjectionContext(() =>
      roleGuard({ data: {} } as never, {} as never),
    );
    expect(result).toBe(true);
  });

  it('allows access when user has the required role', () => {
    const store = TestBed.inject(SessionStore);
    store.setUserToken('token');
    store.setClaims({ role: 'admin' });

    const result = TestBed.runInInjectionContext(() =>
      roleGuard({ data: { requiredRole: 'admin' } } as never, {} as never),
    );
    expect(result).toBe(true);
  });

  it('redirects to forbidden when user does not have the required role', () => {
    const store = TestBed.inject(SessionStore);
    const router = TestBed.inject(Router);
    store.setUserToken('token');
    store.setClaims({ role: 'customer' });

    const result = TestBed.runInInjectionContext(() =>
      roleGuard({ data: { requiredRole: 'admin' } } as never, {} as never),
    );
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/auth/forbidden']);
  });

  it('redirects to forbidden when there are no claims', () => {
    const router = TestBed.inject(Router);
    const store = TestBed.inject(SessionStore);
    store.setUserToken('token');

    const result = TestBed.runInInjectionContext(() =>
      roleGuard({ data: { requiredRole: 'admin' } } as never, {} as never),
    );
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/auth/forbidden']);
  });
});
