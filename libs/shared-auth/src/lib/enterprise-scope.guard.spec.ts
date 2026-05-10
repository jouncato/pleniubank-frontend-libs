import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';

import {
  enterpriseScopeGuard,
  enterprisePrincipalScopeGuard,
  personalScopeGuard,
} from './enterprise-scope.guard';
import { SessionStore } from './session-store.service';

describe('enterpriseScopeGuard', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), SessionStore],
    });
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  it('allows access when claims have enterprise_id', () => {
    const store = TestBed.inject(SessionStore);
    store.setUserToken('token');
    store.setClaims({ enterprise_id: 'ENT-001' });

    const result = TestBed.runInInjectionContext(() =>
      enterpriseScopeGuard({} as never, {} as never),
    );
    expect(result).toBe(true);
  });

  it('redirects to forbidden when claims have no enterprise_id', () => {
    const store = TestBed.inject(SessionStore);
    const router = TestBed.inject(Router);
    store.setUserToken('token');
    store.setClaims({ role: 'customer' });

    const result = TestBed.runInInjectionContext(() =>
      enterpriseScopeGuard({} as never, {} as never),
    );
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/auth/forbidden']);
  });

  it('redirects to forbidden when there are no claims', () => {
    const router = TestBed.inject(Router);

    const result = TestBed.runInInjectionContext(() =>
      enterpriseScopeGuard({} as never, {} as never),
    );
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/auth/forbidden']);
  });
});

describe('enterprisePrincipalScopeGuard', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), SessionStore],
    });
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  it('allows access for enterprise_principal with enterprise_id', () => {
    const store = TestBed.inject(SessionStore);
    store.setUserToken('token');
    store.setClaims({ enterprise_id: 'ENT-001', role: 'enterprise_principal' });

    const result = TestBed.runInInjectionContext(() =>
      enterprisePrincipalScopeGuard({} as never, {} as never),
    );
    expect(result).toBe(true);
  });

  it('allows access for enterprise_admin with enterprise_id', () => {
    const store = TestBed.inject(SessionStore);
    store.setUserToken('token');
    store.setClaims({ enterprise_id: 'ENT-001', role: 'enterprise_admin' });

    const result = TestBed.runInInjectionContext(() =>
      enterprisePrincipalScopeGuard({} as never, {} as never),
    );
    expect(result).toBe(true);
  });

  it('redirects to forbidden for customer role even with enterprise_id', () => {
    const store = TestBed.inject(SessionStore);
    const router = TestBed.inject(Router);
    store.setUserToken('token');
    store.setClaims({ enterprise_id: 'ENT-001', role: 'customer' });

    const result = TestBed.runInInjectionContext(() =>
      enterprisePrincipalScopeGuard({} as never, {} as never),
    );
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/auth/forbidden']);
  });

  it('redirects to forbidden when enterprise_principal has no enterprise_id', () => {
    const store = TestBed.inject(SessionStore);
    const router = TestBed.inject(Router);
    store.setUserToken('token');
    store.setClaims({ role: 'enterprise_principal' });

    const result = TestBed.runInInjectionContext(() =>
      enterprisePrincipalScopeGuard({} as never, {} as never),
    );
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/auth/forbidden']);
  });

  it('redirects to forbidden when there are no claims', () => {
    const router = TestBed.inject(Router);

    const result = TestBed.runInInjectionContext(() =>
      enterprisePrincipalScopeGuard({} as never, {} as never),
    );
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/auth/forbidden']);
  });
});

describe('personalScopeGuard', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), SessionStore],
    });
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  it('allows access when claims have customer_id', () => {
    const store = TestBed.inject(SessionStore);
    store.setUserToken('token');
    store.setClaims({ customer_id: 'CUST-001' });

    const result = TestBed.runInInjectionContext(() =>
      personalScopeGuard({} as never, {} as never),
    );
    expect(result).toBe(true);
  });

  it('redirects to dashboard when claims have no customer_id', () => {
    const store = TestBed.inject(SessionStore);
    const router = TestBed.inject(Router);
    store.setUserToken('token');
    store.setClaims({ role: 'enterprise_admin' });

    const result = TestBed.runInInjectionContext(() =>
      personalScopeGuard({} as never, {} as never),
    );
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/app/dashboard']);
  });

  it('redirects to dashboard when customer_id is blank whitespace', () => {
    const store = TestBed.inject(SessionStore);
    const router = TestBed.inject(Router);
    store.setUserToken('token');
    store.setClaims({ customer_id: '   ' });

    const result = TestBed.runInInjectionContext(() =>
      personalScopeGuard({} as never, {} as never),
    );
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/app/dashboard']);
  });

  it('redirects to dashboard when there are no claims', () => {
    const router = TestBed.inject(Router);

    const result = TestBed.runInInjectionContext(() =>
      personalScopeGuard({} as never, {} as never),
    );
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/app/dashboard']);
  });
});
