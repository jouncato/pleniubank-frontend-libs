import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { SessionStore } from './session-store.service';
import { personalScopeGuard } from './enterprise-scope.guard';

describe('personalScopeGuard', () => {
  it('permite acceso cuando hay customer_id', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: SessionStore, useValue: { claims: () => ({ customer_id: 'c1' }) } },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });
    const ok = TestBed.runInInjectionContext(() =>
      personalScopeGuard({} as never, {} as never),
    );
    expect(ok).toBe(true);
  });

  it('redirige al dashboard sin customer_id', () => {
    const navigate = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        { provide: SessionStore, useValue: { claims: () => ({}) } },
        { provide: Router, useValue: { navigate } },
      ],
    });
    const ok = TestBed.runInInjectionContext(() =>
      personalScopeGuard({} as never, {} as never),
    );
    expect(ok).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/app/dashboard']);
  });
});
