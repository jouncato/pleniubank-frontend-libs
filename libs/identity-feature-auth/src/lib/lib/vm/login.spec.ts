import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { IdentityAuthApiService } from 'identity-data-access';
import { PORTAL_APP, SessionStore } from 'shared-auth';
import { LoginRequest } from 'identity-domain';

import { LoginVm } from './login';

describe('LoginVm', () => {
  const payload: LoginRequest = {
    email: 'test@example.com',
    password: 'secret',
  };

  function setup(options?: {
    role?: 'customer' | 'admin';
    enterpriseId?: string | undefined;
    portal?: 'customer' | 'backoffice';
  }) {
    TestBed.resetTestingModule();
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
      login: vi.fn(() =>
        of({
          data: {
            access_token: 'a',
            refresh_token: 'r',
            admin_access_token: role === 'admin' ? 'admin-token' : null,
          },
        }),
      ),
      validate: vi.fn(() =>
        of({
          data: {
            claims: {
              role,
              email: 'test@example.com',
              enterprise_id: enterpriseId,
            },
          },
        }),
      ),
    };

    TestBed.configureTestingModule({
      providers: [
        LoginVm,
        { provide: Router, useValue: { navigateByUrl } },
        { provide: IdentityAuthApiService, useValue: identityApi },
        { provide: SessionStore, useValue: sessionStore },
        { provide: PORTAL_APP, useValue: portal },
      ],
    });
    return {
      service: TestBed.inject(LoginVm),
      navigateByUrl,
      sessionStore,
    };
  }

  it('should be created', () => {
    const { service } = setup();
    expect(service).toBeTruthy();
  });

  it('usa returnUrl cuando es válida (/app/*)', () => {
    const { service, navigateByUrl } = setup();

    service.login(payload, '/app/accounts?tab=overview');

    expect(navigateByUrl).toHaveBeenCalledWith('/app/accounts?tab=overview');
  });

  it('usa returnUrl cuando es válida (/admin/*)', () => {
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

  it('hace fallback a /app/accounts para usuarios enterprise si returnUrl es inválida', () => {
    const { service, navigateByUrl } = setup({ enterpriseId: 'ent-123' });

    service.login(payload, '/onboarding/party/access/login');

    expect(navigateByUrl).toHaveBeenCalledWith('/app/accounts');
  });
});
