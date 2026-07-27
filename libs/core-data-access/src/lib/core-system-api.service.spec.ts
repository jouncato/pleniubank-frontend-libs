import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_CONFIG } from '@pleniu/shared-http';

import { CoreSystemApiService } from './core-system-api.service';

describe('CoreSystemApiService', () => {
  let service: CoreSystemApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { coreBaseUrl: 'http://localhost:8000', coreAdminApiPrefix: '/api/v1/admin' } },
      ],
    });
    service = TestBed.inject(CoreSystemApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('gets the system overview from the admin boundary', () => {
    service.overview().subscribe();

    const request = httpTesting.expectOne('http://localhost:8000/api/v1/admin/system/overview');

    expect(request.request.method).toBe('GET');
    request.flush({ data: {}, meta: {}, errors: [] });
  });

  it('queries metrics through the Core system endpoint', () => {
    service.queryMetrics('up').subscribe();

    const request = httpTesting.expectOne('http://localhost:8000/api/v1/admin/system/metrics/query');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ query: 'up' });
    request.flush({ data: {}, meta: {}, errors: [] });
  });

  it('writes config using HttpParams and the Core envelope', () => {
    service.putConfig('backoffice-portal', { feature: true }, 'enable feature', 'qa').subscribe();

    const request = httpTesting.expectOne((candidate) => {
      return candidate.url === 'http://localhost:8000/api/v1/admin/system/config/backoffice-portal'
        && candidate.params.get('environment') === 'qa';
    });

    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ config_json: { feature: true }, reason: 'enable feature' });
    request.flush({ data: {}, meta: {}, errors: [] });
  });
});
