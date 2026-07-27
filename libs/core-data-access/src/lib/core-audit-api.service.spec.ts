import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_CONFIG } from '@pleniu/shared-http';

import { CoreAuditApiService } from './core-audit-api.service';

const mockApiConfig = {
  coreBaseUrl: 'http://localhost:8000',
  coreAdminApiPrefix: '/api/v1',
};

describe('CoreAuditApiService', () => {
  let service: CoreAuditApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: mockApiConfig },
      ],
    });
    service = TestBed.inject(CoreAuditApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('list sends filters, date range and cursor through shared HttpParams', () => {
    service.list({
      entity_type: 'Account',
      action: 'CREATE',
      created_by: 'staff-1',
      from_date: '2026-07-01',
      to_date: '2026-07-26',
      limit: 25,
      cursor: 'cursor-1',
    }).subscribe();

    const request = httpTesting.expectOne((candidate) => {
      return candidate.url === 'http://localhost:8000/api/v1/audit/logs'
        && candidate.params.get('entity_type') === 'Account'
        && candidate.params.get('action') === 'CREATE'
        && candidate.params.get('created_by') === 'staff-1'
        && candidate.params.get('from_date') === '2026-07-01'
        && candidate.params.get('to_date') === '2026-07-26'
        && candidate.params.get('limit') === '25'
        && candidate.params.get('cursor') === 'cursor-1';
    });

    expect(request.request.method).toBe('GET');
    request.flush({ data: [], meta: { cursor: null, has_more: false } });
  });

  it('getById requests the shared audit detail endpoint', () => {
    service.getById('audit-1').subscribe();

    const request = httpTesting.expectOne('http://localhost:8000/api/v1/audit/logs/audit-1');

    expect(request.request.method).toBe('GET');
    request.flush({ data: { id: 'audit-1' }, meta: {} });
  });
});
