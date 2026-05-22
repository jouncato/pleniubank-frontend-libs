import { of } from 'rxjs';

import { CoreScoringApiService } from './core-scoring-api.service';

describe('CoreScoringApiService', () => {
  const apiConfig = {
    coreBaseUrl: 'http://localhost:8000',
    identityBaseUrl: 'http://localhost:8080',
  };

  const mockHttp = () => ({
    post: vi.fn().mockReturnValue(of({ data: {} })),
  });

  it('getPayrollEligibility() POST al endpoint /credit-scores/payroll-eligibility', () => {
    const http = mockHttp();
    const service = new CoreScoringApiService(http as never, apiConfig);
    const payload = { customer_id: 'cust-1', salary_amount: 3000000, employment_tenure_months: 12 };

    service.getPayrollEligibility(payload).subscribe();

    expect(http.post).toHaveBeenCalledTimes(1);
    const [url, body] = http.post.mock.calls[0];
    expect(url).toContain('/credit-scores/payroll-eligibility');
    expect(body).toEqual(payload);
  });

  it('getPayrollEligibility() funciona sin campos opcionales', () => {
    const http = mockHttp();
    const service = new CoreScoringApiService(http as never, apiConfig);

    service.getPayrollEligibility({ customer_id: 'cust-2' }).subscribe();

    expect(http.post).toHaveBeenCalledTimes(1);
    const [, body] = http.post.mock.calls[0];
    expect(body).toMatchObject({ customer_id: 'cust-2' });
  });
});
