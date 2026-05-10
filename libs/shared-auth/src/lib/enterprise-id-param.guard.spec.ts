import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { ParamMap } from '@angular/router';

import { enterpriseIdMatchesSessionGuard } from './enterprise-id-param.guard';
import { SessionStore } from './session-store.service';

function makeParamMap(params: Record<string, string>): ParamMap {
  return {
    get: (key: string) => params[key] ?? null,
    getAll: (key: string) => (params[key] ? [params[key]] : []),
    has: (key: string) => key in params,
    keys: Object.keys(params),
  };
}

describe('enterpriseIdMatchesSessionGuard', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), SessionStore],
    });
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  it('allows access when route enterpriseId matches session enterprise_id', () => {
    const store = TestBed.inject(SessionStore);
    store.setUserToken('token');
    store.setClaims({ enterprise_id: 'ENT-001' });

    const result = TestBed.runInInjectionContext(() =>
      enterpriseIdMatchesSessionGuard(
        { paramMap: makeParamMap({ enterpriseId: 'ENT-001' }) } as never,
        {} as never,
      ),
    );
    expect(result).toBe(true);
  });

  it('redirects to forbidden when route enterpriseId does not match session enterprise_id', () => {
    const store = TestBed.inject(SessionStore);
    const router = TestBed.inject(Router);
    store.setUserToken('token');
    store.setClaims({ enterprise_id: 'ENT-001' });

    const result = TestBed.runInInjectionContext(() =>
      enterpriseIdMatchesSessionGuard(
        { paramMap: makeParamMap({ enterpriseId: 'ENT-002' }) } as never,
        {} as never,
      ),
    );
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/auth/forbidden']);
  });

  it('redirects to forbidden when route has no enterpriseId param', () => {
    const store = TestBed.inject(SessionStore);
    const router = TestBed.inject(Router);
    store.setUserToken('token');
    store.setClaims({ enterprise_id: 'ENT-001' });

    const result = TestBed.runInInjectionContext(() =>
      enterpriseIdMatchesSessionGuard(
        { paramMap: makeParamMap({}) } as never,
        {} as never,
      ),
    );
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/auth/forbidden']);
  });

  it('redirects to forbidden when session has no enterprise_id', () => {
    const store = TestBed.inject(SessionStore);
    const router = TestBed.inject(Router);
    store.setUserToken('token');
    store.setClaims({ role: 'customer' });

    const result = TestBed.runInInjectionContext(() =>
      enterpriseIdMatchesSessionGuard(
        { paramMap: makeParamMap({ enterpriseId: 'ENT-001' }) } as never,
        {} as never,
      ),
    );
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/auth/forbidden']);
  });

  it('redirects to forbidden when there are no claims', () => {
    const router = TestBed.inject(Router);

    const result = TestBed.runInInjectionContext(() =>
      enterpriseIdMatchesSessionGuard(
        { paramMap: makeParamMap({ enterpriseId: 'ENT-001' }) } as never,
        {} as never,
      ),
    );
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/auth/forbidden']);
  });
});
