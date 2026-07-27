import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { APP_FEATURE_FLAGS, DEFAULT_APP_FEATURE_FLAGS, FeatureFlagService } from '@pleniu/shared-auth';
import { API_CONFIG } from '@pleniu/shared-http';

import { CoreMutationPreflightError } from './core-mutation-preflight';

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
        { provide: APP_FEATURE_FLAGS, useValue: { ...DEFAULT_APP_FEATURE_FLAGS, treasuryLiquidity: true } },
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

  it('encodes custody identifiers in detail paths', () => {
    service.getCustodyPosition('custody/id ?#').subscribe();

    const request = httpTesting.expectOne((candidate) => candidate.url === 'http://localhost:8000/api/v1/master-custody-accounts/custody%2Fid%20%3F%23/positions');
    expect(request.request.method).toBe('GET');
    request.flush({ data: {}, meta: {} });
  });

  it('blocks treasury mutations before HTTP when the feature flag is disabled', () => {
    TestBed.inject(FeatureFlagService).setFlags({ treasuryLiquidity: false });
    let failure: unknown;

    service.createSubLedgerAssignment({
      account_id: 'account-1',
      custody_master_id: 'custody-1',
      ledger_kind: 'USER_WALLET',
    }).subscribe({ error: (error) => (failure = error) });

    expect(failure).toBeInstanceOf(CoreMutationPreflightError);
    expect((failure as CoreMutationPreflightError).code).toBe('FEATURE_DISABLED');
    httpTesting.expectNone('http://localhost:8000/api/v1/sub-ledgers');
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
