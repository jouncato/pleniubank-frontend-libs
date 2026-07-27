import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_CONFIG } from '@pleniu/shared-http';

import { CoreTreasuryLiquidityApiService } from './core-treasury-liquidity-api.service';

describe('CoreTreasuryLiquidityApiService — GL financial reporting', () => {
  let service: CoreTreasuryLiquidityApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { coreBaseUrl: 'http://localhost:8000', coreAdminApiPrefix: '/api/v1' } },
      ],
    });
    service = TestBed.inject(CoreTreasuryLiquidityApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('gets the GL trial balance for a period and country', () => {
    service.getGlTrialBalance('2026-07', 'CO').subscribe();

    const request = httpTesting.expectOne((candidate) => {
      return candidate.url === 'http://localhost:8000/api/v1/gl-reporting/trial-balance'
        && candidate.params.get('period') === '2026-07'
        && candidate.params.get('country') === 'CO';
    });

    expect(request.request.method).toBe('GET');
    request.flush({ data: { period: '2026-07', country_code: 'CO', total_debit: '0', total_credit: '0', is_balanced: true, accounts: [] }, meta: {} });
  });

  it('defaults the trial balance country to CO when not provided', () => {
    service.getGlTrialBalance('2026-07').subscribe();

    const request = httpTesting.expectOne((candidate) => candidate.params.get('country') === 'CO');
    request.flush({ data: {}, meta: {} });
  });

  it('gets the accounting periods for a country', () => {
    service.getAccountingPeriods('CO').subscribe();

    const request = httpTesting.expectOne((candidate) => {
      return candidate.url === 'http://localhost:8000/api/v1/gl-reporting/periods'
        && candidate.params.get('country') === 'CO';
    });

    expect(request.request.method).toBe('GET');
    request.flush({ data: [], meta: {} });
  });

  it('defaults the accounting periods country to CO when not provided', () => {
    service.getAccountingPeriods().subscribe();

    const request = httpTesting.expectOne((candidate) => candidate.params.get('country') === 'CO');
    request.flush({ data: [], meta: {} });
  });
});
