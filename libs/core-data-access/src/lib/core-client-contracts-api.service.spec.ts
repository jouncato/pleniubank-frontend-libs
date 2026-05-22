import { of } from 'rxjs';

import { CoreClientContractsApiService } from './core-client-contracts-api.service';

describe('CoreClientContractsApiService', () => {
  const apiConfig = {
    coreBaseUrl: 'http://localhost:8000',
    identityBaseUrl: 'http://localhost:8080',
  };

  const mockHttp = () => ({
    get: vi.fn().mockReturnValue(of({ data: [] })),
    post: vi.fn().mockReturnValue(of({ data: {} })),
    patch: vi.fn().mockReturnValue(of({ data: {} })),
    delete: vi.fn().mockReturnValue(of({ data: {} })),
  });

  it('list() GET al endpoint /client-contracts con company_code', () => {
    const http = mockHttp();
    const service = new CoreClientContractsApiService(http as never, apiConfig);

    service.list({ company_code: 'ACME_01' }).subscribe();

    expect(http.get).toHaveBeenCalledTimes(1);
    const [url, options] = http.get.mock.calls[0];
    expect(url).toContain('/client-contracts');
    expect(options.params.get('company_code')).toBe('ACME_01');
  });

  it('listAllowedCompanyCodes() GET al endpoint /company-codes', () => {
    const http = mockHttp();
    const service = new CoreClientContractsApiService(http as never, apiConfig);

    service.listAllowedCompanyCodes().subscribe();

    expect(http.get).toHaveBeenCalledTimes(1);
    const [url] = http.get.mock.calls[0];
    expect(url).toContain('/company-codes');
  });

  it('listEligibilitySummary() GET al endpoint /eligibility-summary con company_code', () => {
    const http = mockHttp();
    const service = new CoreClientContractsApiService(http as never, apiConfig);

    service.listEligibilitySummary('BETA_CO').subscribe();

    expect(http.get).toHaveBeenCalledTimes(1);
    const [url, options] = http.get.mock.calls[0];
    expect(url).toContain('/eligibility-summary');
    expect(options.params.get('company_code')).toBe('BETA_CO');
  });

  it('create() POST al endpoint /client-contracts', () => {
    const http = mockHttp();
    const service = new CoreClientContractsApiService(http as never, apiConfig);
    const payload = {
      customer_id: 'cust-1',
      company_code: 'ACME_01',
      template_contract_id: 'tmpl-1',
      terms: {},
    };

    service.create(payload as never).subscribe();

    expect(http.post).toHaveBeenCalledTimes(1);
    const [url, body] = http.post.mock.calls[0];
    expect(url).toContain('/client-contracts');
    expect(body).toEqual(payload);
  });

  it('patch() PATCH al endpoint /client-contracts/{id}', () => {
    const http = mockHttp();
    const service = new CoreClientContractsApiService(http as never, apiConfig);
    const contractId = 'contract-uuid-1';
    const payload = { status: 'SUSPENDED' };

    service.patch(contractId, payload as never).subscribe();

    expect(http.patch).toHaveBeenCalledTimes(1);
    const [url, body] = http.patch.mock.calls[0];
    expect(url).toContain(`/client-contracts/${contractId}`);
    expect(body).toEqual(payload);
  });
});
