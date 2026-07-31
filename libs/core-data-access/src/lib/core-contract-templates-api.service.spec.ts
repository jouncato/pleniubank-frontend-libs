import { of } from 'rxjs';

import { CoreContractTemplatesApiService } from './core-contract-templates-api.service';

describe('CoreContractTemplatesApiService', () => {
  const apiConfig = {
    coreBaseUrl: 'http://localhost:8000',
    identityBaseUrl: 'http://localhost:8080',
  };

  it('arma query params de list con company_code, cursor y limit', () => {
    const http = {
      get: vi.fn().mockReturnValue(of({ data: [] })),
      post: vi.fn(),
    };
    const service = new CoreContractTemplatesApiService(http as never, apiConfig);

    service.list({ company_code: 'EMP_A', cursor: 'cursor_1', limit: 25 }).subscribe();

    expect(http.get).toHaveBeenCalledTimes(1);
    const [url, options] = http.get.mock.calls[0];
    expect(url).toBe('http://localhost:8000/api/v1/contract-templates');
    expect(options.params.get('company_code')).toBe('EMP_A');
    expect(options.params.get('cursor')).toBe('cursor_1');
    expect(options.params.get('limit')).toBe('25');
  });

  it('list solo exige company_code y omite opcionales vacios', () => {
    const http = {
      get: vi.fn().mockReturnValue(of({ data: [] })),
      post: vi.fn(),
    };
    const service = new CoreContractTemplatesApiService(http as never, apiConfig);

    service.list({ company_code: 'EMP_A' }).subscribe();

    const [, options] = http.get.mock.calls[0];
    expect(options.params.get('company_code')).toBe('EMP_A');
    expect(options.params.get('cursor')).toBeNull();
    expect(options.params.get('limit')).toBeNull();
  });

  it('arma query params de list con enterprise_id (ADR-008, Opción B) en vez de company_code', () => {
    const http = {
      get: vi.fn().mockReturnValue(of({ data: [] })),
      post: vi.fn(),
    };
    const service = new CoreContractTemplatesApiService(http as never, apiConfig);

    service.list({ enterprise_id: 'ent-1', cursor: 'cursor_1', limit: 25 }).subscribe();

    const [, options] = http.get.mock.calls[0];
    expect(options.params.get('enterprise_id')).toBe('ent-1');
    expect(options.params.get('company_code')).toBeNull();
  });

  it('create envia payload al endpoint base', () => {
    const http = {
      get: vi.fn(),
      post: vi.fn().mockReturnValue(of({ data: { id: 'tpl-1' } })),
    };
    const service = new CoreContractTemplatesApiService(http as never, apiConfig);
    const payload = {
      company_code: 'EMP_A',
      product_type: 'PAYROLL_ADVANCE',
      template_name: 'Plantilla base',
      config: { max_amount: 1000000 },
    };

    service.create(payload).subscribe();

    expect(http.post).toHaveBeenCalledWith(
      'http://localhost:8000/api/v1/contract-templates',
      payload,
    );
  });

  it('deactivate llama PATCH al endpoint /{id}/deactivate', () => {
    const http = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn().mockReturnValue(of({ data: { id: 'tpl-1', is_active: false } })),
    };
    const service = new CoreContractTemplatesApiService(http as never, apiConfig);

    service.deactivate('tpl-1').subscribe();

    expect(http.patch).toHaveBeenCalledWith(
      'http://localhost:8000/api/v1/contract-templates/tpl-1/deactivate',
      {},
    );
  });
});
