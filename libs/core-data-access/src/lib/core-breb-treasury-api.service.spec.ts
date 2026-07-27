import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_CONFIG } from '@pleniu/shared-http';

import { CoreBrebTreasuryApiService } from './core-breb-treasury-api.service';

describe('CoreBrebTreasuryApiService', () => {
  let service: CoreBrebTreasuryApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { coreBaseUrl: 'http://localhost:8000', coreAdminApiPrefix: '/api/v1' } },
      ],
    });
    service = TestBed.inject(CoreBrebTreasuryApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('gets the Bre-B suspense position from Core GL reporting', () => {
    service.getPosition().subscribe();

    const request = httpTesting.expectOne('http://localhost:8000/api/v1/gl-reporting/treasury/breb-position');

    expect(request.request.method).toBe('GET');
    request.flush({ data: {}, meta: {} });
  });

  it('runs reconciliation through the Core PaymentHub proxy', () => {
    service.runReconciliation('CO', '2026-07-26').subscribe();

    const request = httpTesting.expectOne('http://localhost:8000/api/v1/paymenthub/rails/breb/reconciliation');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ country: 'CO', cycle_date: '2026-07-26' });
    request.flush({ country: 'CO', cycleDate: '2026-07-26', results: [] });
  });

  it('gets reconciliation exceptions with country and cycle date params', () => {
    service.listReconciliationExceptions('CO', '2026-07-26').subscribe();

    const request = httpTesting.expectOne((candidate) => {
      return candidate.url === 'http://localhost:8000/api/v1/paymenthub/rails/breb/reconciliation/exceptions'
        && candidate.params.get('country') === 'CO'
        && candidate.params.get('cycle_date') === '2026-07-26';
    });

    expect(request.request.method).toBe('GET');
    request.flush({ country: 'CO', cycleDate: '2026-07-26', exceptions: [] });
  });
});
