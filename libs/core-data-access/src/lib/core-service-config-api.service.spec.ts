import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_CONFIG } from '@pleniu/shared-http';

import { CoreServiceConfigApiService } from './core-service-config-api.service';

describe('CoreServiceConfigApiService', () => {
  let service: CoreServiceConfigApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { coreBaseUrl: 'http://localhost:8000', coreAdminApiPrefix: '/api/v1/admin' } },
      ],
    });
    service = TestBed.inject(CoreServiceConfigApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('reads a service configuration from Core', () => {
    service.get('breb').subscribe();

    const request = httpTesting.expectOne('http://localhost:8000/api/v1/admin/service-config/breb');

    expect(request.request.method).toBe('GET');
    request.flush({ data: {}, meta: {}, errors: [] });
  });

  it('saves and toggles a service configuration through Core', () => {
    service.save('aml', { api_url: 'https://aml.example' }).subscribe();
    const save = httpTesting.expectOne('http://localhost:8000/api/v1/admin/service-config/aml');
    expect(save.request.method).toBe('PUT');
    save.flush({ data: {}, meta: {}, errors: [] });

    service.toggle('aml', true).subscribe();
    const toggle = httpTesting.expectOne('http://localhost:8000/api/v1/admin/service-config/aml/toggle');
    expect(toggle.request.method).toBe('PATCH');
    expect(toggle.request.body).toEqual({ is_active: true });
    toggle.flush({ data: {}, meta: {}, errors: [] });
  });

  it('tests connectivity through Core', () => {
    service.test('smtp').subscribe();

    const request = httpTesting.expectOne('http://localhost:8000/api/v1/admin/service-config/smtp/test');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({});
    request.flush({ data: {}, meta: {}, errors: [] });
  });
});
