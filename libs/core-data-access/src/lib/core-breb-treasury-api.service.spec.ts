import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { APP_FEATURE_FLAGS, DEFAULT_APP_FEATURE_FLAGS, FeatureFlagService } from '@pleniu/shared-auth';
import { API_CONFIG } from '@pleniu/shared-http';

import { CoreMutationPreflightError } from './core-mutation-preflight';

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
        { provide: APP_FEATURE_FLAGS, useValue: { ...DEFAULT_APP_FEATURE_FLAGS, treasuryReconciliation: true } },
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

  it('blocks reconciliation before HTTP when the feature flag is disabled', () => {
    TestBed.inject(FeatureFlagService).setFlags({ treasuryReconciliation: false });
    let failure: unknown;

    service.runReconciliation('CO', '2026-07-26').subscribe({ error: (error) => (failure = error) });

    expect(failure).toBeInstanceOf(CoreMutationPreflightError);
    expect((failure as CoreMutationPreflightError).code).toBe('FEATURE_DISABLED');
    httpTesting.expectNone('http://localhost:8000/api/v1/paymenthub/rails/breb/reconciliation');
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
