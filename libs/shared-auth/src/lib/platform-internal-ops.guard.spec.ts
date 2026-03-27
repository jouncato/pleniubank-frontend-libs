import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';

import { platformInternalOpsGuard } from './platform-internal-ops.guard';
import { SessionStore } from './session-store.service';

describe('platformInternalOpsGuard', () => {
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
    const result = TestBed.runInInjectionContext(() =>
      platformInternalOpsGuard({} as never, {} as never),
    );
    expect(result).toBe(true);
  });

  it('permite employee', () => {
    const store = TestBed.inject(SessionStore);
    store.setClaims({ role: 'employee' });
    const result = TestBed.runInInjectionContext(() =>
      platformInternalOpsGuard({} as never, {} as never),
    );
    expect(result).toBe(true);
  });

  it('rechaza auditor', () => {
    const store = TestBed.inject(SessionStore);
    store.setClaims({ role: 'auditor' });
    const router = TestBed.inject(Router);
    const result = TestBed.runInInjectionContext(() =>
      platformInternalOpsGuard({} as never, {} as never),
    );
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/auth/forbidden']);
  });
});
