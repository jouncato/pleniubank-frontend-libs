import { of } from 'rxjs';

import { CoreLoansApiService } from './core-loans-api.service';

describe('CoreLoansApiService', () => {
  const apiConfig = {
    coreBaseUrl: 'http://localhost:8000',
    identityBaseUrl: 'http://localhost:8080',
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
    expect(url).toBe('http://localhost:8000/api/v1/lending-arrangements');
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

    expect(http.post).toHaveBeenCalledWith('http://localhost:8000/api/v1/lending-arrangements/simulate', payload);
  });

  it('getById deriva employer_id de party_roles (role=EMPLOYER)', () => {
    // Bug found via live audit: Core's LendingArrangementResponse nunca tuvo un
    // campo plano `employer_id` -- el empleador viaja en `party_roles`. Antes
    // del fix, `raw.employer_id` siempre era undefined y "Empresa empleadora"
    // se veía vacío para cualquier préstamo, no solo los de anticipo de nómina.
    const http = {
      get: vi.fn().mockReturnValue(
        of({
          data: {
            arrangement_id: 'loan-1',
            customer_id: 'cust-1',
            principal_amount: '500000',
            party_roles: [
              { party_id: 'cust-1', party_type: 'NATURAL_PERSON', role: 'BORROWER' },
              { party_id: 'sub-ent-1', party_type: 'LEGAL_ENTITY', role: 'EMPLOYER' },
            ],
          },
        }),
      ),
      post: vi.fn(),
      put: vi.fn(),
    };
    const service = new CoreLoansApiService(http as never, apiConfig);

    let result: { employer_id: string } | undefined;
    service.getById('loan-1').subscribe((env) => {
      result = env.data;
    });

    expect(result?.employer_id).toBe('sub-ent-1');
  });

  it('getById deja employer_id vacio cuando no hay rol EMPLOYER en party_roles', () => {
    const http = {
      get: vi.fn().mockReturnValue(
        of({
          data: {
            arrangement_id: 'loan-1',
            customer_id: 'cust-1',
            principal_amount: '500000',
            party_roles: [{ party_id: 'cust-1', party_type: 'NATURAL_PERSON', role: 'BORROWER' }],
          },
        }),
      ),
      post: vi.fn(),
      put: vi.fn(),
    };
    const service = new CoreLoansApiService(http as never, apiConfig);

    let result: { employer_id: string } | undefined;
    service.getById('loan-1').subscribe((env) => {
      result = env.data;
    });

    expect(result?.employer_id).toBe('');
  });

  it('update envia status y parametros a /loans/:id', () => {
    const http = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn().mockReturnValue(of({ data: { id: 'loan-1' } })),
    };
    const service = new CoreLoansApiService(http as never, apiConfig);
    const payload = {
      version: 2,
      status: 'ACTIVE',
      amount: '200000',
      instance_parameters: { term_months: 18 },
    };

    service.update('loan-1', payload).subscribe();

    expect(http.put).toHaveBeenCalledWith('http://localhost:8000/api/v1/lending-arrangements/loan-1', payload);
  });
});
