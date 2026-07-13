import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';

import { jurisdictionAdminGuard } from './jurisdiction-admin.guard';
import { SessionStore } from './session-store.service';

describe('jurisdictionAdminGuard', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), SessionStore],
    });
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  it('permite admin', () => {
    const store = TestBed.inject(SessionStore);
    store.setClaims({ role: 'admin' });
    const result = TestBed.runInInjectionContext(() => jurisdictionAdminGuard({} as never, {} as never));
    expect(result).toBe(true);
  });

  it('permite legal_admin', () => {
    const store = TestBed.inject(SessionStore);
    store.setClaims({ role: 'legal_admin' });
    const result = TestBed.runInInjectionContext(() => jurisdictionAdminGuard({} as never, {} as never));
    expect(result).toBe(true);
  });

  it('rechaza otros roles', () => {
    const store = TestBed.inject(SessionStore);
    store.setClaims({ role: 'auditor' });
    const router = TestBed.inject(Router);
    const result = TestBed.runInInjectionContext(() => jurisdictionAdminGuard({} as never, {} as never));
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/auth/forbidden']);
  });
});
