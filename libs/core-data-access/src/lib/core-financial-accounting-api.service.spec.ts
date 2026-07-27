import { provideHttpClient } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import {
  APP_FEATURE_FLAGS,
  DEFAULT_APP_FEATURE_FLAGS,
  FeatureFlagService,
} from '@pleniu/shared-auth';
import { API_CONFIG } from '@pleniu/shared-http';

import { CoreMutationPreflightError } from './core-mutation-preflight';
import { CoreFinancialAccountingApiService } from './core-financial-accounting-api.service';

describe('CoreFinancialAccountingApiService', () => {
  let service: CoreFinancialAccountingApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { coreBaseUrl: 'http://localhost:8000', coreAdminApiPrefix: '/api/v1' } },
        { provide: APP_FEATURE_FLAGS, useValue: { ...DEFAULT_APP_FEATURE_FLAGS, financialAccounting: true } },
      ],
    });
    service = TestBed.inject(CoreFinancialAccountingApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('encodes country and account identifiers in detail paths', () => {
    service.get('CO/1', 'AS ?#').subscribe();

    const request = httpTesting.expectOne(
      'http://localhost:8000/api/v1/chart-of-accounts/CO%2F1/AS%20%3F%23',
    );
    expect(request.request.method).toBe('GET');
    request.flush({ data: {}, meta: {} });
  });

  it('blocks financial mutations before emitting HTTP when the flag is disabled', () => {
    TestBed.inject(FeatureFlagService).setFlags({ financialAccounting: false });
    let failure: unknown;

    service
      .create('CO', {
        account_code: '1000',
        account_name: 'Cash',
        account_class: 'ASSET',
        account_level: 1,
      })
      .subscribe({ error: (error) => (failure = error) });

    expect(failure).toBeInstanceOf(CoreMutationPreflightError);
    expect((failure as CoreMutationPreflightError).code).toBe('FEATURE_DISABLED');
    httpTesting.expectNone('http://localhost:8000/api/v1/chart-of-accounts/CO');
  });

  it('preserves authoritative Core errors after preflight passes', () => {
    let failure: unknown;

    service
      .activate('CO', '1000')
      .subscribe({ error: (error) => (failure = error) });

    const request = httpTesting.expectOne('http://localhost:8000/api/v1/chart-of-accounts/CO/1000/activate');
    request.flush(
      { errors: [{ code: 'CONFLICT', message: 'Account state changed' }], meta: { correlation_id: 'cid-1' } },
      { status: 409, statusText: 'Conflict' },
    );

    expect(failure).toBeInstanceOf(HttpErrorResponse);
    expect((failure as HttpErrorResponse).status).toBe(409);
  });
});
