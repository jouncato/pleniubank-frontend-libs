import { of } from 'rxjs';

import { CorePayrollAdvancesApiService } from './core-payroll-advances-api.service';

describe('CorePayrollAdvancesApiService', () => {
  const apiConfig = {
    coreBaseUrl: 'http://localhost:8000',
    identityBaseUrl: 'http://localhost:8080',
  };

  const mockHttp = () => ({
    get: vi.fn().mockReturnValue(of({ data: {} })),
    post: vi.fn().mockReturnValue(of({ data: {} })),
    patch: vi.fn().mockReturnValue(of({ data: {} })),
  });

  it('register() POST /payroll-advances con body correcto', () => {
    const http = mockHttp();
    const service = new CorePayrollAdvancesApiService(http as never, apiConfig);
    const payload = {
      contract_id: 'contract-1',
      account_id: 'acc-1',
      product_id: 'prod-1',
      customer_id: 'cust-1',
      employer_id: 'emp-1',
      amount: 500000,
      customer_account_id: 'cust-acc-1',
      disbursement_source_account_id: 'src-acc-1',
    };

    service.register(payload).subscribe();

    expect(http.post).toHaveBeenCalledTimes(1);
    const [url, body] = http.post.mock.calls[0];
    expect(url).toContain('/payroll-advances');
    expect(body).toEqual(payload);
  });

  it('getById() GET /payroll-advances/:id', () => {
    const http = mockHttp();
    const service = new CorePayrollAdvancesApiService(http as never, apiConfig);

    service.getById('advance-uuid-1').subscribe();

    expect(http.get).toHaveBeenCalledTimes(1);
    const [url] = http.get.mock.calls[0];
    expect(url).toContain('/payroll-advances/advance-uuid-1');
  });

  it('list() GET /payroll-advances con HttpParams', () => {
    const http = mockHttp();
    const service = new CorePayrollAdvancesApiService(http as never, apiConfig);

    service.list({ status: 'DISBURSED', customer_id: 'cust-1', limit: 20 }).subscribe();

    expect(http.get).toHaveBeenCalledTimes(1);
    const [url, options] = http.get.mock.calls[0];
    expect(url).toContain('/payroll-advances');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params = (options as any).params;
    expect(params.get('status')).toBe('DISBURSED');
    expect(params.get('customer_id')).toBe('cust-1');
    expect(params.get('limit')).toBe('20');
  });

  it('disburse() POST /payroll-advances/:id/disburse con body', () => {
    const http = mockHttp();
    const service = new CorePayrollAdvancesApiService(http as never, apiConfig);

    service.disburse('adv-1', { payment_reference: 'PAY-REF-001' }).subscribe();

    expect(http.post).toHaveBeenCalledTimes(1);
    const [url, body] = http.post.mock.calls[0];
    expect(url).toContain('/payroll-advances/adv-1/disburse');
    expect(body).toEqual({ payment_reference: 'PAY-REF-001' });
  });

  it('repay() POST /payroll-advances/:id/repay con body completo', () => {
    const http = mockHttp();
    const service = new CorePayrollAdvancesApiService(http as never, apiConfig);
    const body = {
      account_id: 'acc-1',
      payment_source_account_id: 'src-acc-1',
      repayment_amount: 500000,
      repayment_is_full: true,
      denomination: 'COP',
    };

    service.repay('adv-1', body).subscribe();

    expect(http.post).toHaveBeenCalledTimes(1);
    const [url, sentBody] = http.post.mock.calls[0];
    expect(url).toContain('/payroll-advances/adv-1/repay');
    expect(sentBody).toEqual(body);
  });

  it('updateStatus() PATCH /payroll-advances/:id/status', () => {
    const http = mockHttp();
    const service = new CorePayrollAdvancesApiService(http as never, apiConfig);

    service.updateStatus('adv-1', { new_status: 'CANCELLED' }).subscribe();

    expect(http.patch).toHaveBeenCalledTimes(1);
    const [url, body] = http.patch.mock.calls[0];
    expect(url).toContain('/payroll-advances/adv-1/status');
    expect(body).toEqual({ new_status: 'CANCELLED' });
  });

  // OpenSpec centralize-payroll-advance-policy-co (fase 8, tarea 8.2/8.6).
  it('getEligibility() GET /payroll-advances/eligibility con customer_id obligatorio', () => {
    const http = mockHttp();
    const service = new CorePayrollAdvancesApiService(http as never, apiConfig);

    service.getEligibility({ customer_id: 'cust-1' }).subscribe();

    expect(http.get).toHaveBeenCalledTimes(1);
    const [url, options] = http.get.mock.calls[0];
    expect(url).toContain('/payroll-advances/eligibility');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params = (options as any).params;
    expect(params.get('customer_id')).toBe('cust-1');
    expect(params.get('employer_id')).toBeNull();
    expect(params.get('requested_amount')).toBeNull();
  });

  it('getEligibility() envía employer_id y requested_amount cuando se proveen', () => {
    const http = mockHttp();
    const service = new CorePayrollAdvancesApiService(http as never, apiConfig);

    service
      .getEligibility({ customer_id: 'cust-1', employer_id: 'emp-1', requested_amount: 500000 })
      .subscribe();

    const [, options] = http.get.mock.calls[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params = (options as any).params;
    expect(params.get('employer_id')).toBe('emp-1');
    expect(params.get('requested_amount')).toBe('500000');
  });

  it('simulate() acepta customer_id/employer_id aditivos sin romper el body previo', () => {
    const http = mockHttp();
    const service = new CorePayrollAdvancesApiService(http as never, apiConfig);
    const payload = {
      contract_id: 'contract-1',
      amount: 500000,
      customer_id: 'cust-1',
      employer_id: 'emp-1',
    };

    service.simulate(payload).subscribe();

    expect(http.post).toHaveBeenCalledTimes(1);
    const [url, body] = http.post.mock.calls[0];
    expect(url).toContain('/payroll-advances/simulate');
    expect(body).toEqual(payload);
  });

  it('simulate() sigue funcionando sin los campos canónicos aditivos (compatibilidad hacia atrás)', () => {
    const http = mockHttp();
    const service = new CorePayrollAdvancesApiService(http as never, apiConfig);
    const payload = { contract_id: 'contract-1', amount: 500000 };

    service.simulate(payload).subscribe();

    const [, body] = http.post.mock.calls[0];
    expect(body).toEqual(payload);
  });
});
