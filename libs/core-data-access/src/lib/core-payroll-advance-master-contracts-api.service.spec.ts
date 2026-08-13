import { of } from 'rxjs';

import { CorePayrollAdvanceMasterContractsApiService } from './core-payroll-advance-master-contracts-api.service';

describe('CorePayrollAdvanceMasterContractsApiService', () => {
  const apiConfig = {
    coreBaseUrl: 'http://localhost:8000',
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
});
