import { TestBed } from '@angular/core/testing';
import {
  HTTP_INTERCEPTORS,
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { tenantContextInterceptor } from './tenant-context.interceptor';
import { TenantContextService } from './tenant-context.service';
import { TENANT_HEADER_ENABLED } from './tenant-interceptor.config';
import { TENANT_INTERCEPTOR_EXCLUDE_URLS } from './tenant-interceptor-exclude-urls.token';

const TENANT_HEADER = 'X-Tenant-Country';

function makeJwtWithCountry(country: string): string {
  const b64url = (obj: Record<string, unknown>): string => {
    const json = JSON.stringify(obj);
    const b64 = btoa(
      encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_m, p: string) =>
        String.fromCharCode(parseInt(p, 16)),
      ),
    );
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
  return `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({ sub: 'u1', country_code: country })}.sig`;
}

function setupWithEnabled(
  enabled: boolean,
  excludes?: readonly string[],
): { http: HttpClient; ctrl: HttpTestingController } {
  TestBed.configureTestingModule({
    providers: [
      { provide: TENANT_HEADER_ENABLED, useValue: enabled },
      ...(excludes
        ? [{ provide: TENANT_INTERCEPTOR_EXCLUDE_URLS, useValue: excludes }]
        : []),
      provideHttpClient(withInterceptors([tenantContextInterceptor])),
      provideHttpClientTesting(),
    ],
  });
  return {
    http: TestBed.inject(HttpClient),
    ctrl: TestBed.inject(HttpTestingController),
  };
}

describe('tenantContextInterceptor', () => {
  it('flag OFF → no inyecta el header', () => {
    const { http, ctrl } = setupWithEnabled(false);
    http.get('/api/v1/loans').subscribe();
    const req = ctrl.expectOne('/api/v1/loans');
    expect(req.request.headers.has(TENANT_HEADER)).toBe(false);
    req.flush({});
    ctrl.verify();
  });

  it('flag ON + URL válida → inyecta X-Tenant-Country: CO', () => {
    const { http, ctrl } = setupWithEnabled(true);
    http.get('/api/v1/loans').subscribe();
    const req = ctrl.expectOne('/api/v1/loans');
    expect(req.request.headers.get(TENANT_HEADER)).toBe('CO');
    req.flush({});
    ctrl.verify();
  });

  it('flag ON + URL excluida (default /auth/) → no inyecta', () => {
    const { http, ctrl } = setupWithEnabled(true);
    http.post('/api/v1/auth/login', {}).subscribe();
    const req = ctrl.expectOne('/api/v1/auth/login');
    expect(req.request.headers.has(TENANT_HEADER)).toBe(false);
    req.flush({});
    ctrl.verify();
  });

  it('flag ON + URL excluida (default /health) → no inyecta', () => {
    const { http, ctrl } = setupWithEnabled(true);
    http.get('/api/v1/health').subscribe();
    const req = ctrl.expectOne('/api/v1/health');
    expect(req.request.headers.has(TENANT_HEADER)).toBe(false);
    req.flush({});
    ctrl.verify();
  });

  it('flag ON + header ya presente → no sobreescribe', () => {
    const { http, ctrl } = setupWithEnabled(true);
    http.get('/api/v1/loans', { headers: { [TENANT_HEADER]: 'FOO' } }).subscribe();
    const req = ctrl.expectOne('/api/v1/loans');
    expect(req.request.headers.get(TENANT_HEADER)).toBe('FOO');
    req.flush({});
    ctrl.verify();
  });

  it('flag ON + service en CO + JWT con country_code no soportado → default CO', () => {
    const { http, ctrl } = setupWithEnabled(true);
    http
      .get('/api/v1/loans', {
        headers: { Authorization: `Bearer ${makeJwtWithCountry('MX')}` },
      })
      .subscribe();
    const req = ctrl.expectOne('/api/v1/loans');
    expect(req.request.headers.get(TENANT_HEADER)).toBe('CO');
    req.flush({});
    ctrl.verify();
  });

  it('excludes personalizados reemplazan los defaults', () => {
    const { http, ctrl } = setupWithEnabled(true, ['/api/v1/custom-excluded']);
    http.get('/api/v1/custom-excluded').subscribe();
    const r1 = ctrl.expectOne('/api/v1/custom-excluded');
    expect(r1.request.headers.has(TENANT_HEADER)).toBe(false);
    r1.flush({});
    // /auth/ ya no debe estar excluido
    http.get('/api/v1/auth/login').subscribe();
    const r2 = ctrl.expectOne('/api/v1/auth/login');
    expect(r2.request.headers.get(TENANT_HEADER)).toBe('CO');
    r2.flush({});
    ctrl.verify();
  });

  it('service en CO + sin Authorization → default CO', () => {
    const { http, ctrl } = setupWithEnabled(true);
    TestBed.inject(TenantContextService); // service available
    http.get('/api/v1/loans').subscribe();
    const req = ctrl.expectOne('/api/v1/loans');
    expect(req.request.headers.get(TENANT_HEADER)).toBe('CO');
    req.flush({});
    ctrl.verify();
  });
});

// Referencia usada en setupWithEnabled; silencia warnings de tree-shake.
void HTTP_INTERCEPTORS;
