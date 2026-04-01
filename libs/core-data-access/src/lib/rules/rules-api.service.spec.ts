import { of } from 'rxjs';

import { RulesApiService } from './rules-api.service';

describe('RulesApiService', () => {
  const apiConfig = {
    coreBaseUrl: 'http://localhost:8000',
    identityBaseUrl: 'http://localhost:8082',
    rulesEngineBaseUrl: 'http://localhost:8095',
  };

  it('lanza si falta rulesEngineBaseUrl', () => {
    const http = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() };
    expect(() => new RulesApiService(http as never, { ...apiConfig, rulesEngineBaseUrl: undefined })).toThrow(
      /rulesEngineBaseUrl/,
    );
  });

  it('getRuleSets llama /api/v1/rulesets', () => {
    const http = {
      get: vi.fn().mockReturnValue(of({ data: [] })),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };
    const service = new RulesApiService(http as never, apiConfig);

    service.getRuleSets().subscribe();

    expect(http.get).toHaveBeenCalledWith('http://localhost:8095/api/v1/rulesets');
  });

  it('getRules codifica rulesetCode', () => {
    const http = {
      get: vi.fn().mockReturnValue(of({ data: [] })),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };
    const service = new RulesApiService(http as never, apiConfig);

    service.getRules('CREDIT_APPROVAL').subscribe();

    expect(http.get).toHaveBeenCalledWith('http://localhost:8095/api/v1/rulesets/CREDIT_APPROVAL/rules');
  });

  it('updateRule envia PUT con codigos de regla', () => {
    const http = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn().mockReturnValue(of({ data: {} })),
      delete: vi.fn(),
    };
    const service = new RulesApiService(http as never, apiConfig);

    service.updateRule('CREDIT_APPROVAL', 'RB-PER-009', { priority: 2 }).subscribe();

    expect(http.put).toHaveBeenCalledWith(
      'http://localhost:8095/api/v1/rulesets/CREDIT_APPROVAL/rules/RB-PER-009',
      { priority: 2 },
    );
  });

  it('getEvaluations pasa filtros como query params', () => {
    const http = {
      get: vi.fn().mockReturnValue(of({ data: [] })),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };
    const service = new RulesApiService(http as never, apiConfig);

    service
      .getEvaluations({
        ruleset_code: 'CREDIT_APPROVAL',
        decision: 'REJECTED',
        page: 1,
        size: 50,
      })
      .subscribe();

    expect(http.get).toHaveBeenCalledTimes(1);
    const [, opts] = http.get.mock.calls[0];
    expect(opts.params.get('ruleset_code')).toBe('CREDIT_APPROVAL');
    expect(opts.params.get('decision')).toBe('REJECTED');
    expect(opts.params.get('page')).toBe('1');
    expect(opts.params.get('size')).toBe('50');
  });

  it('deleteRule llama DELETE', () => {
    const http = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn().mockReturnValue(of(undefined)),
    };
    const service = new RulesApiService(http as never, apiConfig);

    service.deleteRule('X', 'R1').subscribe();

    expect(http.delete).toHaveBeenCalledWith('http://localhost:8095/api/v1/rulesets/X/rules/R1');
  });

  it('normaliza trailing slash en rulesEngineBaseUrl', () => {
    const http = {
      get: vi.fn().mockReturnValue(of({ data: {} })),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };
    const service = new RulesApiService(http as never, {
      ...apiConfig,
      rulesEngineBaseUrl: 'http://localhost:8095/',
    });

    service.getEvaluation('abc-123').subscribe();

    expect(http.get).toHaveBeenCalledWith('http://localhost:8095/api/v1/evaluations/abc-123');
  });
});
