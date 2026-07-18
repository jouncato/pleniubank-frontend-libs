import { of } from 'rxjs';

import { CorePayrollAdvanceManualReviewApiService } from './core-payroll-advance-manual-review-api.service';

describe('CorePayrollAdvanceManualReviewApiService', () => {
  const apiConfig = {
    coreBaseUrl: 'http://localhost:8000',
    identityBaseUrl: 'http://localhost:8080',
  };

  const mockHttp = () => ({
    get: vi.fn().mockReturnValue(of({ data: [] })),
    post: vi.fn().mockReturnValue(of({ data: {} })),
  });

  it('list() GET /payroll-advance-manual-review-cases con filtros', () => {
    const http = mockHttp();
    const service = new CorePayrollAdvanceManualReviewApiService(http as never, apiConfig);

    service.list({ status: 'ASSIGNED', employer_id: 'emp-1', limit: 10 }).subscribe();

    expect(http.get).toHaveBeenCalledTimes(1);
    const [url, options] = http.get.mock.calls[0];
    expect(url).toContain('/payroll-advance-manual-review-cases');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params = (options as any).params;
    expect(params.get('status')).toBe('ASSIGNED');
    expect(params.get('employer_id')).toBe('emp-1');
    expect(params.get('limit')).toBe('10');
  });

  it('getById() GET /payroll-advance-manual-review-cases/:id', () => {
    const http = mockHttp();
    const service = new CorePayrollAdvanceManualReviewApiService(http as never, apiConfig);

    service.getById('case-1').subscribe();

    const [url] = http.get.mock.calls[0];
    expect(url).toContain('/payroll-advance-manual-review-cases/case-1');
  });

  it('assign() POST /:id/assign con assigned_to', () => {
    const http = mockHttp();
    const service = new CorePayrollAdvanceManualReviewApiService(http as never, apiConfig);

    service.assign('case-1', { assigned_to: 'analyst-1' }).subscribe();

    expect(http.post).toHaveBeenCalledTimes(1);
    const [url, body] = http.post.mock.calls[0];
    expect(url).toContain('/payroll-advance-manual-review-cases/case-1/assign');
    expect(body).toEqual({ assigned_to: 'analyst-1' });
  });

  it('approve() POST /:id/approve con reason', () => {
    const http = mockHttp();
    const service = new CorePayrollAdvanceManualReviewApiService(http as never, apiConfig);

    service.approve('case-1', { reason: 'Cumple límite diario revisado' }).subscribe();

    const [url, body] = http.post.mock.calls[0];
    expect(url).toContain('/payroll-advance-manual-review-cases/case-1/approve');
    expect(body).toEqual({ reason: 'Cumple límite diario revisado' });
  });

  it('reject() POST /:id/reject con reason', () => {
    const http = mockHttp();
    const service = new CorePayrollAdvanceManualReviewApiService(http as never, apiConfig);

    service.reject('case-1', { reason: 'Excede porcentaje efectivo' }).subscribe();

    const [url, body] = http.post.mock.calls[0];
    expect(url).toContain('/payroll-advance-manual-review-cases/case-1/reject');
    expect(body).toEqual({ reason: 'Excede porcentaje efectivo' });
  });
});
