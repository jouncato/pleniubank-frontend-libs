import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { LoginRequest } from 'identity-domain';
import { IdentityAuthApiService } from 'identity-data-access';
import { of, throwError } from 'rxjs';
import { PORTAL_APP, SessionStore } from 'shared-auth';

import { AuthRateLimitService } from './auth-rate-limit.service';
import { LoginVm } from './login';

describe('LoginVm', () => {
  const payload: LoginRequest = {
    email: 'test@example.com',
    password: 'secret',
  };

  function createRateLimitError() {
    return new HttpErrorResponse({
      status: 429,
      error: { errors: [{ code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' }] },
    });
  }

  function setup(options?: {
    role?: 'customer' | 'admin';
    enterpriseId?: string | undefined;
    portal?: 'customer' | 'backoffice';
    loginImpl?: () => unknown;
    validateImpl?: () => unknown;
  }) {
    TestBed.resetTestingModule();
    sessionStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-29T10:00:00.000Z'));

    const role = options?.role ?? 'customer';
    const enterpriseId = options?.enterpriseId;
    const portal = options?.portal ?? 'customer';

    const navigateByUrl = vi.fn(() => Promise.resolve(true));
    const sessionStore = {
      setUserToken: vi.fn(),
      setRefreshToken: vi.fn(),
      setAdminToken: vi.fn(),
      setClaims: vi.fn(),
      clear: vi.fn(),
    };
    const identityApi = {
      login: vi.fn(
        options?.loginImpl ??
          (() =>
            of({
              data: {
                access_token: 'a',
                refresh_token: 'r',
                admin_access_token: role === 'admin' ? 'admin-token' : null,
              },
            })),
      ),
      validate: vi.fn(
        options?.validateImpl ??
          (() =>
            of({
              data: {
                claims: {
                  role,
                  email: 'test@example.com',
                  enterprise_id: enterpriseId,
                },
              },
            })),
      ),
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        LoginVm,
        AuthRateLimitService,
        { provide: Router, useValue: { navigateByUrl } },
        { provide: IdentityAuthApiService, useValue: identityApi },
        { provide: SessionStore, useValue: sessionStore },
        { provide: PORTAL_APP, useValue: portal },
      ],
    });

    return {
      service: TestBed.inject(LoginVm),
      navigateByUrl,
      identityApi,
    };
  }

  afterEach(() => {
    sessionStorage.clear();
    vi.useRealTimers();
  });

  it('should be created', () => {
    const { service } = setup();
    expect(service).toBeTruthy();
  });

  it('usa returnUrl cuando es valida (/app/*)', () => {
    const { service, navigateByUrl } = setup();

    service.login(payload, '/app/accounts?tab=overview');

    expect(navigateByUrl).toHaveBeenCalledWith('/app/accounts?tab=overview');
  });

  it('usa returnUrl cuando es valida (/admin/*)', () => {
    const { service, navigateByUrl } = setup({ role: 'admin', portal: 'backoffice' });

    service.login(payload, '/admin/users');

    expect(navigateByUrl).toHaveBeenCalledWith('/admin/users');
  });

  it('hace fallback al dashboard por defecto cuando returnUrl es externa', () => {
    const { service, navigateByUrl } = setup();

    service.login(payload, 'https://evil.example/phishing');

    expect(navigateByUrl).toHaveBeenCalledWith('/app/dashboard');
  });

  it('hace fallback al dashboard por defecto cuando returnUrl usa esquema peligroso', () => {
    const { service, navigateByUrl } = setup();

    service.login(payload, 'javascript:alert(1)');

    expect(navigateByUrl).toHaveBeenCalledWith('/app/dashboard');
  });

  it('hace fallback a /app/accounts para usuarios enterprise si returnUrl es invalida', () => {
    const { service, navigateByUrl } = setup({ enterpriseId: 'ent-123' });

    service.login(payload, '/onboarding/party/access/login');

    expect(navigateByUrl).toHaveBeenCalledWith('/app/accounts');
  });

  it('activa rate_limited y countdown tras recibir 429', () => {
    const { service } = setup({
      loginImpl: () => throwError(() => createRateLimitError()),
    });

    service.login(payload);

    expect(service.state()).toBe('rate_limited');
    expect(service.isRateLimited).toBe(true);
    expect(service.remainingSeconds).toBe(60);
    expect(service.rateLimitMessage).toContain('60 segundos');
  });

  it('bloquea submits mientras el cooldown sigue activo', () => {
    const { service, identityApi } = setup({
      loginImpl: () => throwError(() => createRateLimitError()),
    });

    service.login(payload);
    service.login(payload);

    expect(identityApi.login).toHaveBeenCalledTimes(1);
  });

  it('eleva a 120 segundos ante un segundo 429 consecutivo', () => {
    const { service } = setup({
      loginImpl: () => throwError(() => createRateLimitError()),
    });

    service.login(payload);
    vi.advanceTimersByTime(60_000);
    expect(service.isRateLimited).toBe(false);

    service.login(payload);

    expect(service.state()).toBe('rate_limited');
    expect(service.remainingSeconds).toBe(120);
  });

  it('resetea el streak tras un login exitoso', () => {
    const { service, identityApi } = setup({
      loginImpl: vi
        .fn()
        .mockImplementationOnce(() => throwError(() => createRateLimitError()))
        .mockImplementation(() =>
          of({
            data: {
              access_token: 'a',
              refresh_token: 'r',
              admin_access_token: null,
            },
          }),
        ),
    });

    service.login(payload);
    vi.advanceTimersByTime(60_000);
    service.login(payload);

    identityApi.login.mockImplementationOnce(() => throwError(() => createRateLimitError()));
    service.login(payload);

    expect(service.remainingSeconds).toBe(60);
  });

  it('resetea el streak ante un error no 429', () => {
    const { service } = setup({
      loginImpl: vi
        .fn()
        .mockImplementationOnce(() => throwError(() => createRateLimitError()))
        .mockImplementationOnce(
          () =>
            throwError(
              () =>
                new HttpErrorResponse({
                  status: 401,
                  error: { errors: [{ code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' }] },
                }),
            ),
        )
        .mockImplementation(() => throwError(() => createRateLimitError())),
    });

    service.login(payload);
    vi.advanceTimersByTime(60_000);
    service.login(payload);
    service.login(payload);

    expect(service.state()).toBe('rate_limited');
    expect(service.remainingSeconds).toBe(60);
  });

  it('muestra mensaje del API en 401 cuando errors[0].message esta presente', () => {
    const { service } = setup({
      loginImpl: () =>
        throwError(
          () =>
            new HttpErrorResponse({
              status: 401,
              error: {
                errors: [{ code: 'INVALID_CREDENTIALS', message: 'Texto devuelto por Identity.' }],
              },
            }),
        ),
    });

    service.login(payload);

    expect(service.state()).toBe('error');
    expect(service.errorMessage()).toBe('Texto devuelto por Identity.');
  });

  it('usa copy por defecto en 401 sin mensaje usable del sobre', () => {
    const { service } = setup({
      loginImpl: () =>
        throwError(
          () =>
            new HttpErrorResponse({
              status: 401,
              error: { errors: [{ code: 'INVALID_CREDENTIALS', message: '' }] },
            }),
        ),
    });

    service.login(payload);

    expect(service.state()).toBe('error');
    expect(service.errorMessage()).toBe('Correo o contrasena incorrectos.');
  });
});
