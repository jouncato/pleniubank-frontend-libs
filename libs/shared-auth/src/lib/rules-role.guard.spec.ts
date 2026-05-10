import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';

import { rulesRoleGuard } from './rules-role.guard';
import { RulesSessionService } from './rules-session.service';
import { SessionStore } from './session-store.service';

describe('rulesRoleGuard', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), SessionStore, RulesSessionService],
    });
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  it('allows access when no rulesRole is specified in route data', () => {
    const result = TestBed.runInInjectionContext(() =>
      rulesRoleGuard({ data: {} } as never, {} as never),
    );
    expect(result).toBe(true);
  });

  it('allows access when user has the exact required rules role', () => {
    const svc = TestBed.inject(RulesSessionService);
    vi.spyOn(svc, 'hasRulesRole').mockReturnValue(true);

    const result = TestBed.runInInjectionContext(() =>
      rulesRoleGuard({ data: { rulesRole: 'rules:viewer' } } as never, {} as never),
    );
    expect(result).toBe(true);
  });

  it('returns UrlTree to /auth/forbidden when user lacks the required rules role', () => {
    const svc = TestBed.inject(RulesSessionService);
    vi.spyOn(svc, 'hasRulesRole').mockReturnValue(false);

    const result = TestBed.runInInjectionContext(() =>
      rulesRoleGuard({ data: { rulesRole: 'rules:admin' } } as never, {} as never),
    );
    expect(result).not.toBe(true);
    expect(result).not.toBe(false);
    // UrlTree returned
    expect(String(result)).toContain('forbidden');
  });
});
