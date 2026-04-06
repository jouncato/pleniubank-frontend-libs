import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { Observable, firstValueFrom, isObservable, of, throwError } from 'rxjs';
import { map } from 'rxjs/operators';

import { authGuard } from './auth.guard';
import { AUTH_VALIDATE_HANDLER, AuthValidateHandler } from './auth-validate.token';
import { PORTAL_APP } from './portal-app.token';
import { SESSION_CLAIMS_TTL_MS, SessionClaims, SessionStore } from './session-store.service';

function runGuard(url: string) {
  const r = TestBed.runInInjectionContext(() =>
    authGuard({} as never, { url } as never),
  );
  if (isObservable(r)) {
    return firstValueFrom(r);
  }
  return Promise.resolve(r);
}

describe('authGuard', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  function setup(validateSource: Observable<any>) {
    TestBed.resetTestingModule();
    sessionStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-01T12:00:00.000Z'));
    const callSpy = vi.fn<() => Observable<SessionClaims>>();
    callSpy.mockReturnValue(
      validateSource.pipe(map((r: any) => r.data.claims)),
    );
    const handler: AuthValidateHandler = () => callSpy();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        SessionStore,
        { provide: AUTH_VALIDATE_HANDLER, useValue: handler },
        { provide: PORTAL_APP, useValue: 'customer' as const },
      ],
    });
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    return callSpy;
  }

  it('omite validate si claims están frescos dentro del TTL', async () => {
    const callSpy = setup(of({ data: { claims: { role: 'customer' } } }));

    const store = TestBed.inject(SessionStore);
    store.setUserToken('t');
    store.setClaims({ role: 'customer' });

    const result = await runGuard('/app/x');
    expect(result).toBe(true);
    expect(callSpy).not.toHaveBeenCalled();
  });

  it('vuelve a validar si el TTL de claims expiró', async () => {
    const callSpy = setup(of({ data: { claims: { role: 'customer' } } }));

    const store = TestBed.inject(SessionStore);
    store.setUserToken('t');
    store.setClaims({ role: 'customer' });

    vi.advanceTimersByTime(SESSION_CLAIMS_TTL_MS + 1);

    const result = await runGuard('/app/x');
    expect(result).toBe(true);
    expect(callSpy).toHaveBeenCalledTimes(1);
  });

  it('sin token redirige a login', async () => {
    setup(of({ data: { claims: {} } }));

    const router = TestBed.inject(Router);

    const result = await runGuard('/app/secret');
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/onboarding/party/access/login'], {
      queryParams: { returnUrl: '/app/secret' },
    });
  });

  it('sin claims llama validate', async () => {
    const callSpy = setup(of({ data: { claims: { role: 'customer' } } }));

    const store = TestBed.inject(SessionStore);
    store.setUserToken('t');

    await runGuard('/app/x');
    expect(callSpy).toHaveBeenCalledTimes(1);
  });

  it('si validate falla limpia sesión', async () => {
    setup(throwError(() => new Error('401')));

    const store = TestBed.inject(SessionStore);
    store.setUserToken('t');

    await runGuard('/app/x');
    expect(store.userToken()).toBeNull();
  });
});

