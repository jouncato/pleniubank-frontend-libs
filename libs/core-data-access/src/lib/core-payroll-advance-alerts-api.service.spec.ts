import { of } from 'rxjs';

import { CorePayrollAdvanceAlertsApiService } from './core-payroll-advance-alerts-api.service';

describe('CorePayrollAdvanceAlertsApiService', () => {
  const apiConfig = {
    coreBaseUrl: 'http://localhost:8000',
    identityBaseUrl: 'http://localhost:8080',
  };

  const mockHttp = () => ({
    get: vi.fn().mockReturnValue(of({ data: [] })),
    post: vi.fn(),
    patch: vi.fn().mockReturnValue(of({ data: {} })),
  });

  it('list() GET /payroll-advance-alerts sin filtros no envía query params', () => {
    const http = mockHttp();
    const service = new CorePayrollAdvanceAlertsApiService(http as never, apiConfig);

    service.list().subscribe();

    expect(http.get).toHaveBeenCalledTimes(1);
    const [url, options] = http.get.mock.calls[0];
    expect(url).toContain('/payroll-advance-alerts');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params = (options as any).params;
    expect(params.get('status')).toBeNull();
  });

  it('list() envía status/severity/alert_type/employer_id/limit cuando se proveen', () => {
    const http = mockHttp();
    const service = new CorePayrollAdvanceAlertsApiService(http as never, apiConfig);

    service
      .list({
        status: 'OPEN',
        severity: 'CRITICAL',
        alert_type: 'PAYROLL_ADVANCE_PERCENTAGE_EXCEEDED',
        employer_id: 'emp-1',
        limit: 25,
      })
      .subscribe();

    const [, options] = http.get.mock.calls[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params = (options as any).params;
    expect(params.get('status')).toBe('OPEN');
    expect(params.get('severity')).toBe('CRITICAL');
    expect(params.get('alert_type')).toBe('PAYROLL_ADVANCE_PERCENTAGE_EXCEEDED');
    expect(params.get('employer_id')).toBe('emp-1');
    expect(params.get('limit')).toBe('25');
  });

  it('getById() GET /payroll-advance-alerts/:id', () => {
    const http = mockHttp();
    const service = new CorePayrollAdvanceAlertsApiService(http as never, apiConfig);

    service.getById('alert-1').subscribe();

    const [url] = http.get.mock.calls[0];
    expect(url).toContain('/payroll-advance-alerts/alert-1');
  });

  it('updateStatus() PATCH /payroll-advance-alerts/:id/status con body', () => {
    const http = mockHttp();
    const service = new CorePayrollAdvanceAlertsApiService(http as never, apiConfig);
    const body = { status: 'IN_REVIEW' as const, reason: 'Analista asignado' };

    service.updateStatus('alert-1', body).subscribe();

    expect(http.patch).toHaveBeenCalledTimes(1);
    const [url, sentBody] = http.patch.mock.calls[0];
    expect(url).toContain('/payroll-advance-alerts/alert-1/status');
    expect(sentBody).toEqual(body);
  });

  it('usa el base admin — payroll_advance_alerts_router está montado en _admin_routers en Core', () => {
    const http = mockHttp();
    const scopedApiConfig = {
      coreBaseUrl: 'http://localhost:8000',
      identityBaseUrl: 'http://localhost:8080',
      corePublicApiPrefix: '/api/v1/public',
      coreAdminApiPrefix: '/api/v1/admin',
    };
    const service = new CorePayrollAdvanceAlertsApiService(http as never, scopedApiConfig);

    service.list().subscribe();

    const [url] = http.get.mock.calls[0];
    expect(url).toContain('/api/v1/admin/payroll-advance-alerts');
  });
});
