import { of } from 'rxjs';

import { CoreLoansApiService } from './core-loans-api.service';

describe('CoreLoansApiService', () => {
  const apiConfig = {
    coreBaseUrl: 'http://localhost:8000',
    identityBaseUrl: 'http://localhost:8082',
  };

  it('arma query params de list con employer_id y limit', () => {
    const http = {
      get: vi.fn().mockReturnValue(of({ data: [] })),
      post: vi.fn(),
      put: vi.fn(),
    };
    const service = new CoreLoansApiService(http as never, apiConfig);

    service.list({ employer_id: 'ent-1', limit: 50 }).subscribe();

    expect(http.get).toHaveBeenCalledTimes(1);
    const [url, options] = http.get.mock.calls[0];
    expect(url).toBe('http://localhost:8000/api/v1/loans');
    expect(options.params.get('employer_id')).toBe('ent-1');
    expect(options.params.get('limit')).toBe('50');
  });

  it('simulate envia payload a /loans/simulate', () => {
    const http = {
      get: vi.fn(),
      post: vi.fn().mockReturnValue(of({ data: { schedule: {} } })),
      put: vi.fn(),
    };
    const service = new CoreLoansApiService(http as never, apiConfig);
    const payload = {
      contract_type: 'PAYROLL_ADVANCE',
      contract_id: null,
      parameters: { amount: '1000000', term_months: 12 },
    };

    service.simulate(payload).subscribe();

    expect(http.post).toHaveBeenCalledWith('http://localhost:8000/api/v1/loans/simulate', payload);
  });
});
