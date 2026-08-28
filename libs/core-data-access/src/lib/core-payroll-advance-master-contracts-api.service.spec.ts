import { of } from 'rxjs';

import { CorePayrollAdvanceMasterContractsApiService } from './core-payroll-advance-master-contracts-api.service';

describe('CorePayrollAdvanceMasterContractsApiService', () => {
  const apiConfig = {
    coreBaseUrl: 'http://localhost:8000',
    coreAdminApiPrefix: '/api/v1/admin',
    identityBaseUrl: 'http://localhost:8080',
  };

  const mockHttp = () => ({
    get: vi.fn().mockReturnValue(of({ data: {} })),
    post: vi.fn().mockReturnValue(of({ data: {} })),
    patch: vi.fn().mockReturnValue(of({ data: {} })),
  });

  /**
   * Auditoría 2026-08-11: Core exige X-Idempotency-Key en creación/aprobación/
   * asignación de contratos maestros (ver payroll_advance_master_contracts_router.py),
   * pero el servicio nunca lo enviaba -- confirmado en vivo, 422
   * {"loc":["header","X-Idempotency-Key"]} al asignar una unidad desde el
   * portal. Estos tests cubren los 3 métodos corregidos.
   */
  it('createContract() envía X-Idempotency-Key, distinta en cada llamada', () => {
    const http = mockHttp();
    const service = new CorePayrollAdvanceMasterContractsApiService(http as never, apiConfig);
    const payload = {
      global_model_id: 'model-1',
      enterprise_id: 'ent-1',
      approved_total_limit: 1000000,
      custody_account_id: 'custody-1',
    };

    service.createContract(payload).subscribe();
    service.createContract(payload).subscribe();

    expect(http.post).toHaveBeenCalledTimes(2);
    const key1 = http.post.mock.calls[0][2]?.headers?.get('X-Idempotency-Key');
    const key2 = http.post.mock.calls[1][2]?.headers?.get('X-Idempotency-Key');
    expect(key1).toBeTruthy();
    expect(key2).toBeTruthy();
    expect(key1).not.toBe(key2);
  });

  it('updateStatus() envía X-Idempotency-Key', () => {
    const http = mockHttp();
    const service = new CorePayrollAdvanceMasterContractsApiService(http as never, apiConfig);

    service.updateStatus('contract-1', 'ACTIVE', 'custody-1').subscribe();

    expect(http.patch).toHaveBeenCalledTimes(1);
    const [url, body, opts] = http.patch.mock.calls[0];
    expect(url).toContain('/contract-1/status');
    expect(body).toEqual({ status: 'ACTIVE', custody_account_id: 'custody-1' });
    expect(opts?.headers?.get('X-Idempotency-Key')).toBeTruthy();
  });

  it('assign() envía X-Idempotency-Key', () => {
    const http = mockHttp();
    const service = new CorePayrollAdvanceMasterContractsApiService(http as never, apiConfig);
    const payload = {
      master_contract_id: 'contract-1',
      enterprise_id: 'ent-1',
      sub_enterprise_id: 'sub-1',
      company_code: 'UNT-TEST',
    };

    service.assign('contract-1', payload).subscribe();

    expect(http.post).toHaveBeenCalledTimes(1);
    const [url, body, opts] = http.post.mock.calls[0];
    expect(url).toContain('/contract-1/assignments');
    expect(body).toEqual(payload);
    expect(opts?.headers?.get('X-Idempotency-Key')).toBeTruthy();
  });

  it('adjustCapacity() hace PATCH a /{id}/capacity con X-Idempotency-Key', () => {
    const http = mockHttp();
    const service = new CorePayrollAdvanceMasterContractsApiService(http as never, apiConfig);
    const payload = { new_approved_total_limit: 30000000, reason: 'Reducción por tesorería' };

    service.adjustCapacity('contract-1', payload).subscribe();

    expect(http.patch).toHaveBeenCalledTimes(1);
    const [url, body, opts] = http.patch.mock.calls[0];
    expect(url).toContain('/contract-1/capacity');
    expect(body).toEqual(payload);
    expect(opts?.headers?.get('X-Idempotency-Key')).toBeTruthy();
  });

  it('listPendingApprovals() consulta los pendientes directamente desde Core', () => {
    const http = mockHttp();
    const service = new CorePayrollAdvanceMasterContractsApiService(http as never, apiConfig);

    service.listPendingApprovals(25, 50).subscribe();

    expect(http.get).toHaveBeenCalledWith(
      'http://localhost:8000/api/v1/admin/payroll-advance-master-contracts/pending-approval',
      { params: expect.anything() },
    );
    const params = http.get.mock.calls[0][1].params;
    expect(params.get('limit')).toBe('25');
    expect(params.get('offset')).toBe('50');
  });

  it('updateAssignmentTerms() hace PATCH a /assignments/{id} con el body dado (auditoría 2026-08-11)', () => {
    const http = mockHttp();
    const service = new CorePayrollAdvanceMasterContractsApiService(http as never, apiConfig);
    const payload = { approved_sub_limit: 2000000, default_employee_amount: 500000 };

    service.updateAssignmentTerms('contract-1', 'assignment-1', payload).subscribe();

    expect(http.patch).toHaveBeenCalledTimes(1);
    const [url, body] = http.patch.mock.calls[0];
    expect(url).toContain('/contract-1/assignments/assignment-1');
    expect(url).not.toContain('/revoke');
    expect(body).toEqual(payload);
  });

  it('listCycleReports() serializa los filtros contractuales y de ciclo', () => {
    const http = mockHttp();
    const service = new CorePayrollAdvanceMasterContractsApiService(http as never, apiConfig);

    service
      .listCycleReports({
        enterprise_id: 'enterprise-1',
        master_contract_id: 'contract-1',
        master_contract_version_id: 'version-1',
        master_assignment_id: 'assignment-1',
        report_type: 'POST_CYCLE',
        status: 'REQUIRES_REVIEW',
        scheduled_cycle_date: '2026-08-31',
        limit: 200,
        offset: 20,
      })
      .subscribe();

    const [url, options] = http.get.mock.calls[0];
    expect(url).toBe('http://localhost:8000/api/v1/admin/payroll-advance-cycle-reports');
    expect(options.params.get('master_contract_version_id')).toBe('version-1');
    expect(options.params.get('master_assignment_id')).toBe('assignment-1');
    expect(options.params.get('report_type')).toBe('POST_CYCLE');
    expect(options.params.get('status')).toBe('REQUIRES_REVIEW');
  });

  it('getCycleReport() y downloadCycleReport() usan el endpoint de snapshots', () => {
    const http = mockHttp();
    const service = new CorePayrollAdvanceMasterContractsApiService(http as never, apiConfig);

    service.getCycleReport('report-1').subscribe();
    service.downloadCycleReport('report-1').subscribe();

    expect(http.get.mock.calls[0][0]).toContain('/payroll-advance-cycle-reports/report-1');
    expect(http.get.mock.calls[1][0]).toContain('/payroll-advance-cycle-reports/report-1/download.csv');
    expect(http.get.mock.calls[1][1]).toEqual({ responseType: 'blob' });
  });

  it('proposeCycleChange() y decideCycleChange() usan el workflow administrativo', () => {
    const http = mockHttp();
    const service = new CorePayrollAdvanceMasterContractsApiService(http as never, apiConfig);
    const proposal = {
      cutoff_day: 1,
      payment_day: 10,
      enterprise_due_day: 5,
      cycle_timezone: 'America/Bogota',
      cycle_denomination: 'COP',
      effective_from: '2026-09-01T00:00:00Z',
      change_reason: 'Cambio aprobado por operación',
    };

    service.proposeCycleChange('contract-1', proposal).subscribe();
    service.decideCycleChange('contract-1', 'request-1', {
      decision: 'approve',
      decision_reason: 'Validado por otro administrador',
    }).subscribe();

    expect(http.post.mock.calls[0][0]).toContain('/contract-1/cycle-change-requests');
    expect(http.post.mock.calls[0][1]).toEqual(proposal);
    expect(http.post.mock.calls[1][0]).toContain('/contract-1/cycle-change-requests/request-1/decide');
  });
});
