import { of } from 'rxjs';

import { CoreContractPoliciesApiService } from './core-contract-policies-api.service';

describe('CoreContractPoliciesApiService', () => {
  const apiConfig = {
    coreBaseUrl: 'http://localhost:8000',
    identityBaseUrl: 'http://localhost:8082',
  };

  it('listValues GET sin definition_id omite query param', () => {
    const http = {
      get: vi.fn().mockReturnValue(of({ data: [] })),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    };
    const service = new CoreContractPoliciesApiService(http as never, apiConfig);

    service.listValues(null).subscribe();

    expect(http.get).toHaveBeenCalledTimes(1);
    const [url, options] = http.get.mock.calls[0];
    expect(url).toContain('/values');
    expect(options.params.get('definition_id')).toBeNull();
  });

  it('listValues GET con definition_id envía query param', () => {
    const http = {
      get: vi.fn().mockReturnValue(of({ data: [] })),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    };
    const service = new CoreContractPoliciesApiService(http as never, apiConfig);
    const defId = 'def-uuid-1';

    service.listValues(defId).subscribe();

    const [, options] = http.get.mock.calls[0];
    expect(options.params.get('definition_id')).toBe(defId);
  });

  it('createValue POST al endpoint /values', () => {
    const http = {
      get: vi.fn(),
      post: vi.fn().mockReturnValue(of({ data: { id: 'val-1' } })),
      patch: vi.fn(),
      delete: vi.fn(),
    };
    const service = new CoreContractPoliciesApiService(http as never, apiConfig);
    const payload = {
      definition_id: 'def-1',
      level: 1,
      value: 500000,
    };

    service.createValue(payload).subscribe();

    expect(http.post).toHaveBeenCalledTimes(1);
    const [url, body] = http.post.mock.calls[0];
    expect(url).toContain('/values');
    expect(body).toEqual(payload);
  });

  it('patchValue PATCH al endpoint /values/{id}', () => {
    const http = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn().mockReturnValue(of({ data: { id: 'val-1' } })),
      delete: vi.fn(),
    };
    const service = new CoreContractPoliciesApiService(http as never, apiConfig);
    const valueId = 'val-uuid-1';
    const payload = { value: 750000 };

    service.patchValue(valueId, payload).subscribe();

    expect(http.patch).toHaveBeenCalledTimes(1);
    const [url, body] = http.patch.mock.calls[0];
    expect(url).toContain(`/values/${valueId}`);
    expect(body).toEqual(payload);
  });

  it('deleteValue DELETE al endpoint /values/{id}', () => {
    const http = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn().mockReturnValue(of({ data: { deleted: true } })),
    };
    const service = new CoreContractPoliciesApiService(http as never, apiConfig);
    const valueId = 'val-uuid-to-delete';

    service.deleteValue(valueId).subscribe();

    expect(http.delete).toHaveBeenCalledTimes(1);
    const [url] = http.delete.mock.calls[0];
    expect(url).toContain(`/values/${valueId}`);
  });
});
