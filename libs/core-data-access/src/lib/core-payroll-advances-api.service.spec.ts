import { of } from 'rxjs';

import { CorePayrollAdvancesApiService } from './core-payroll-advances-api.service';

describe('CorePayrollAdvancesApiService', () => {
  const apiConfig = {
    coreBaseUrl: 'http://localhost:8000',
    identityBaseUrl: 'http://localhost:8082',
  };

  const mockHttp = () => ({
    get: vi.fn().mockReturnValue(of({ data: {} })),
    post: vi.fn().mockReturnValue(of({ data: {} })),
  });

  it('register() POST al endpoint /payroll-advances', () => {
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

  it('getById() GET al endpoint /payroll-advances/:id', () => {
    const http = mockHttp();
    const service = new CorePayrollAdvancesApiService(http as never, apiConfig);

    service.getById('advance-uuid-1').subscribe();

    expect(http.get).toHaveBeenCalledTimes(1);
    const [url] = http.get.mock.calls[0];
    expect(url).toContain('/payroll-advances/advance-uuid-1');
  });

  it('listByCustomer() GET con customer_id como query param', () => {
    const http = mockHttp();
    const service = new CorePayrollAdvancesApiService(http as never, apiConfig);

    service.listByCustomer('cust-abc').subscribe();

    expect(http.get).toHaveBeenCalledTimes(1);
    const [url, options] = http.get.mock.calls[0];
    expect(url).toContain('/payroll-advances');
    expect((options as { params: Record<string, string> }).params).toMatchObject({ customer_id: 'cust-abc' });
  });
});
