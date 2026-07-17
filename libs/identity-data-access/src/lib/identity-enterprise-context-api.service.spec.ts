import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_CONFIG } from '@pleniu/shared-http';

import { IdentityEnterpriseContextApiService } from './identity-enterprise-context-api.service';

const mockApiConfig = { identityBaseUrl: 'http://localhost:8010' };

describe('IdentityEnterpriseContextApiService', () => {
  let service: IdentityEnterpriseContextApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: mockApiConfig },
      ],
    });
    service = TestBed.inject(IdentityEnterpriseContextApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('switchContext() llama POST /auth/switch-context con body vacío por defecto', () => {
    service.switchContext().subscribe();
    const req = httpTesting.expectOne('http://localhost:8010/api/v1/auth/switch-context');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({ data: {} });
  });

  it('switchContext(body) reenvía el body provisto', () => {
    service.switchContext({ enterprise_id: 'ent-1', sub_enterprise_id: 'sub-1' }).subscribe();
    const req = httpTesting.expectOne('http://localhost:8010/api/v1/auth/switch-context');
    expect(req.request.body).toEqual({ enterprise_id: 'ent-1', sub_enterprise_id: 'sub-1' });
    req.flush({ data: {} });
  });
});
