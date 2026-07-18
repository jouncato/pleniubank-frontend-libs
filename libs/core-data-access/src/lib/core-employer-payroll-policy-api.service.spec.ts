import { of } from 'rxjs';

import { CoreEmployerPayrollPolicyApiService } from './core-employer-payroll-policy-api.service';

describe('CoreEmployerPayrollPolicyApiService', () => {
  const apiConfig = {
    coreBaseUrl: 'http://localhost:8000',
    identityBaseUrl: 'http://localhost:8080',
  };

  const mockHttp = () => ({
    get: vi.fn().mockReturnValue(of({ data: {} })),
    post: vi.fn().mockReturnValue(of({ data: {} })),
    patch: vi.fn().mockReturnValue(of({ data: {} })),
  });

  it('activate() POST /employers/:id/payroll-advance-product', () => {
    const http = mockHttp();
    const service = new CoreEmployerPayrollPolicyApiService(http as never, apiConfig);
    const body = { max_advance_pct: 25, max_concurrent: 1, terms_version: 'v1' };

    service.activate('emp-1', body).subscribe();

    expect(http.post).toHaveBeenCalledTimes(1);
    const [url, sentBody] = http.post.mock.calls[0];
    expect(url).toContain('/employers/emp-1/payroll-advance-product');
    expect(sentBody).toEqual(body);
  });

  it('get() GET /employers/:id/payroll-advance-product', () => {
    const http = mockHttp();
    const service = new CoreEmployerPayrollPolicyApiService(http as never, apiConfig);

    service.get('emp-1').subscribe();

    expect(http.get).toHaveBeenCalledTimes(1);
    const [url] = http.get.mock.calls[0];
    expect(url).toContain('/employers/emp-1/payroll-advance-product');
  });

  it('update() PATCH /employers/:id/payroll-advance-product', () => {
    const http = mockHttp();
    const service = new CoreEmployerPayrollPolicyApiService(http as never, apiConfig);
    const body = { max_advance_pct: 20 };

    service.update('emp-1', body).subscribe();

    expect(http.patch).toHaveBeenCalledTimes(1);
    const [url, sentBody] = http.patch.mock.calls[0];
    expect(url).toContain('/employers/emp-1/payroll-advance-product');
    expect(sentBody).toEqual(body);
  });

  it('usa el base público (no admin) — employers_router está montado en _public_routers en Core', () => {
    const http = mockHttp();
    const scopedApiConfig = {
      coreBaseUrl: 'http://localhost:8000',
      identityBaseUrl: 'http://localhost:8080',
      corePublicApiPrefix: '/api/v1/public',
      coreAdminApiPrefix: '/api/v1/admin',
    };
    const service = new CoreEmployerPayrollPolicyApiService(http as never, scopedApiConfig);

    service.get('emp-1').subscribe();

    const [url] = http.get.mock.calls[0];
    expect(url).toContain('/api/v1/public/employers/emp-1/payroll-advance-product');
    expect(url).not.toContain('/admin/');
  });
});
