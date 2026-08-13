import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { LoginRequest } from 'identity-domain';
import { IdentityAuthApiService } from '@pleniu/identity-data-access';
import { of, throwError } from 'rxjs';
import {
  PORTAL_APP,
  POST_LOGIN_CUSTOMER_PORTAL,
  SessionStore,
  SESSION_STRATEGY,
} from '@pleniu/shared-auth';

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
    /** B2C customer: si es false, LoginVm navega a /app/verify-phone tras validate. */
    phoneVerified?: boolean;
    portal?: 'customer' | 'backoffice' | 'public';
    postLoginPortal?: {
      customerPortalOrigin?: string;
      allowCrossOriginTokenHandoff?: boolean;
      b2cPath?: string;
      b2bPath?: string;
    };
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
    const phoneVerified = options?.phoneVerified ?? true;
    const postLoginCustomerPortal = {
      customerPortalOrigin: options?.postLoginPortal?.customerPortalOrigin ?? '',
      allowCrossOriginTokenHandoff: options?.postLoginPortal?.allowCrossOriginTokenHandoff ?? false,
      b2cPath: options?.postLoginPortal?.b2cPath ?? '/app/dashboard',
      b2bPath: options?.postLoginPortal?.b2bPath ?? '/app/dashboard',
    };

    const navigateByUrl = vi.fn(() => Promise.resolve(true));
    const navigate = vi.fn(() => Promise.resolve(true));
    const sessionStore = {
      setUserToken: vi.fn(),
      setRefreshToken: vi.fn(),
      setAdminToken: vi.fn(),
      clearTerminationReason: vi.fn(),
      setClaims: vi.fn(),
      clear: vi.fn(),
      userToken: vi.fn(() => 'access-token'),
      refreshToken: vi.fn(() => 'refresh-token'),
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
                  phone_verified: phoneVerified,
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
        { provide: Router, useValue: { navigateByUrl, navigate } },
        { provide: IdentityAuthApiService, useValue: identityApi },
        { provide: SessionStore, useValue: sessionStore },
        { provide: PORTAL_APP, useValue: portal },
        { provide: SESSION_STRATEGY, useValue: 'sessionStorage' },
        { provide: POST_LOGIN_CUSTOMER_PORTAL, useValue: postLoginCustomerPortal },
      ],
    });

    return {
      service: TestBed.inject(LoginVm),
      navigateByUrl,
      navigate,
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

  // Bug en vivo 2026-08-13: `role === 'admin'` como proxy de "es backoffice"
  // dejaba a risk_officer/compliance_officer/employee/sre/devops cayendo en
  // '/app/dashboard' -- ruta que no existe en backoffice-portal (solo tiene
  // '/backoffice/*', con '/admin' como alias) -- y rebotaban al login pese a
  // autenticar correctamente. Reproducido con Chrome DevTools contra un
  // risk_officer real.
  it('staff no-admin en backoffice (risk_officer) cae en /admin/dashboard, no en /app/dashboard', () => {
    const { service, navigateByUrl } = setup({
      portal: 'backoffice',
      validateImpl: () =>
        of({
          data: {
            claims: {
              role: 'risk_officer',
              email: 'risk.officer@example.com',
              enterprise_id: undefined,
              phone_verified: true,
            },
          },
        }),
    });

    service.login(payload);

    expect(navigateByUrl).toHaveBeenCalledWith('/admin/dashboard');
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

  it('customer B2C sin telefono verificado va a verify-phone y conserva returnUrl valida', () => {
    const { service, navigate, navigateByUrl } = setup({ phoneVerified: false });

    service.login(payload, '/app/personal/loans/list');

    expect(navigate).toHaveBeenCalledWith(['/app/verify-phone'], {
      queryParams: { returnUrl: '/app/personal/loans/list' },
    });
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it('enterprise_operator sin enterprise_id y sin telefono verificado NO va a verify-phone (backend rechaza phone-challenge para roles no customer)', () => {
    const { service, navigate, navigateByUrl } = setup({
      validateImpl: () =>
        of({
          data: {
            claims: {
              role: 'enterprise_operator',
              email: 'operator@example.com',
              enterprise_id: undefined,
              phone_verified: false,
            },
          },
        }),
    });

    service.login(payload, '/app/personal/loans/list');

    expect(navigate).not.toHaveBeenCalled();
    expect(navigateByUrl).toHaveBeenCalledWith('/app/personal/loans/list');
  });

  it('hace fallback a /app/dashboard para usuarios enterprise si returnUrl es invalida', () => {
    const { service, navigateByUrl } = setup({ enterpriseId: 'ent-123' });

    service.login(payload, '/onboarding/party/access/login');

    expect(navigateByUrl).toHaveBeenCalledWith('/app/dashboard');
  });

  it('portal publico con customerPortalOrigin redirige al customer B2C con location.assign', () => {
    const assign = vi.fn();
    vi.stubGlobal('location', { ...globalThis.location, assign: assign });
    const { service } = setup({
      portal: 'public',
      postLoginPortal: {
        customerPortalOrigin: 'http://localhost:4205',
        allowCrossOriginTokenHandoff: true,
      },
    });

    service.login(payload);

    expect(assign).toHaveBeenCalledWith('http://localhost:4205/app/dashboard');
    vi.unstubAllGlobals();
  });

  it('portal publico con customerPortalOrigin y enterprise redirige a ruta B2B en el customer', () => {
    const assign = vi.fn();
    vi.stubGlobal('location', { ...globalThis.location, assign: assign });
    const { service } = setup({
      portal: 'public',
      enterpriseId: 'ent-123',
      postLoginPortal: { customerPortalOrigin: 'http://localhost:4205' },
    });

    service.login(payload);

    expect(assign).toHaveBeenCalledWith('http://localhost:4205/app/dashboard');
    vi.unstubAllGlobals();
  });

  it('portal publico sin customerPortalOrigin y enterprise aterriza en dashboard', () => {
    const { service, navigateByUrl } = setup({
      portal: 'public',
      enterpriseId: 'ent-123',
      postLoginPortal: { customerPortalOrigin: '' },
    });

    service.login(payload);

    expect(navigateByUrl).toHaveBeenCalledWith('/app/dashboard');
  });

  it('portal publico con returnUrl /app valida compone URL en el customer', () => {
    const assign = vi.fn();
    vi.stubGlobal('location', { ...globalThis.location, assign: assign });
    const { service } = setup({
      portal: 'public',
      postLoginPortal: { customerPortalOrigin: 'http://localhost:4205' },
    });

    service.login(payload, '/app/personal/accounts/list');

    expect(assign).toHaveBeenCalledWith('http://localhost:4205/app/personal/accounts/list');
    vi.unstubAllGlobals();
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

  it('en 401/INVALID_CREDENTIALS ignora el mensaje crudo del backend y usa el override curado del contexto (resolveUserFacingApiError nunca expone texto crudo del API)', () => {
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
    expect(service.errorMessage()).toBe('Correo o contrasena incorrectos.');
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
