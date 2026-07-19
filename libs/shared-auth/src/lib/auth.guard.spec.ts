import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { Observable, firstValueFrom, isObservable, of, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiHttpError } from '@pleniu/shared-http';

import { authGuard } from './auth.guard';
import { AUTH_VALIDATE_HANDLER, AuthValidateHandler } from './auth-validate.token';
import { PORTAL_APP } from './portal-app.token';
import { SESSION_CLAIMS_TTL_MS, SessionClaims, SessionStore } from './session-store.service';
import { SESSION_STRATEGY } from './session-strategy.token';

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

  function setup(
    validateSource: Observable<any>,
    options: { strategy?: 'sessionStorage' | 'httpOnlyCookie' } = {},
  ) {
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
        { provide: SESSION_STRATEGY, useValue: options.strategy ?? 'sessionStorage' },
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

  it('si validate falla con ApiHttpError 401 limpia sesión', async () => {
    const authError = new ApiHttpError(401, [{ code: 'UNAUTHORIZED', message: 'No autenticado' }]);
    setup(throwError(() => authError));

    const store = TestBed.inject(SessionStore);
    store.setUserToken('t');

    await runGuard('/app/x');
    expect(store.userToken()).toBeNull();
  });

  it('si validate falla con error transitorio (status 0) conserva la sesión y retorna true', async () => {
    const transientError = new ApiHttpError(0, [{ code: 'NETWORK_ERROR', message: 'Sin conexión' }]);
    setup(throwError(() => transientError));

    const store = TestBed.inject(SessionStore);
    store.setUserToken('t');
    store.setClaims({ role: 'customer' });
    vi.advanceTimersByTime(SESSION_CLAIMS_TTL_MS + 1);

    const result = await runGuard('/app/x');
    expect(result).toBe(true);
    expect(store.userToken()).not.toBeNull();
  });

  it('si validate falla con error transitorio sin claims previos retorna true y conserva token', async () => {
    const transientError = new ApiHttpError(0, [{ code: 'NETWORK_ERROR', message: 'Sin conexión' }]);
    setup(throwError(() => transientError));

    const store = TestBed.inject(SessionStore);
    store.setUserToken('t');
    // No claims set — simulates fresh reload with no prior validate

    const result = await runGuard('/app/x');
    expect(result).toBe(true);
    expect(store.userToken()).not.toBeNull();
  });

  it('modo httpOnlyCookie sin claims llama validate en vez de redirigir de inmediato', async () => {
    const callSpy = setup(of({ data: { claims: { role: 'customer' } } }), {
      strategy: 'httpOnlyCookie',
    });

    const router = TestBed.inject(Router);
    // userToken() siempre es null en modo cookie (SessionStore.useCookies); no debe bastar
    // para redirigir sin antes preguntarle al servidor si la cookie HttpOnly sigue siendo válida.
    const result = await runGuard('/app/x');

    expect(callSpy).toHaveBeenCalledTimes(1);
    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('modo httpOnlyCookie sin sesión real redirige a login tras validate fallido', async () => {
    const authError = new ApiHttpError(401, [{ code: 'UNAUTHORIZED', message: 'No autenticado' }]);
    setup(throwError(() => authError), { strategy: 'httpOnlyCookie' });

    const router = TestBed.inject(Router);

    const result = await runGuard('/app/secret');
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/onboarding/party/access/login'], {
      queryParams: { returnUrl: '/app/secret' },
    });
  });
});

