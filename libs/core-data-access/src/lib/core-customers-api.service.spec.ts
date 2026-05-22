import { of } from 'rxjs';

import { CoreCustomersApiService } from './core-customers-api.service';

describe('CoreCustomersApiService', () => {
  const apiConfig = {
    coreBaseUrl: 'http://localhost:8000',
    identityBaseUrl: 'http://localhost:8080',
  };

  it('adds server-side search params to list', () => {
    const http = {
      get: vi.fn().mockReturnValue(of({ data: [] })),
      post: vi.fn(),
      put: vi.fn(),
    };
    const service = new CoreCustomersApiService(http as never, apiConfig);

    service.list({ q: 'Juan', document_number: '1234567890', limit: 10 }).subscribe();

    const [url, options] = http.get.mock.calls[0];
    expect(url).toBe('http://localhost:8000/api/v1/customers');
    expect(options.params.get('q')).toBe('Juan');
    expect(options.params.get('document_number')).toBe('1234567890');
    expect(options.params.get('limit')).toBe('10');
  });

  it('search delegates to list with the default typeahead limit', () => {
    const http = {
      get: vi.fn().mockReturnValue(of({ data: [] })),
      post: vi.fn(),
      put: vi.fn(),
    };
    const service = new CoreCustomersApiService(http as never, apiConfig);

    service.search({ query: 'Maria' }).subscribe();

    const [, options] = http.get.mock.calls[0];
    expect(options.params.get('q')).toBe('Maria');
    expect(options.params.get('limit')).toBe('10');
  });
});
