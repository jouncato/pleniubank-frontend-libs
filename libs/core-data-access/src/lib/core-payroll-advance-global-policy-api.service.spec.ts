import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_CONFIG } from '@pleniu/shared-http';

import { CorePayrollAdvanceGlobalPolicyApiService } from './core-payroll-advance-global-policy-api.service';

describe('CorePayrollAdvanceGlobalPolicyApiService', () => {
  let service: CorePayrollAdvanceGlobalPolicyApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { coreBaseUrl: 'http://localhost:8000', coreAdminApiPrefix: '/api/v1/admin' } },
      ],
    });
    service = TestBed.inject(CorePayrollAdvanceGlobalPolicyApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('proposes a change through the Core admin endpoint', () => {
    service.propose({ effective_from: '2026-08-01T00:00:00Z', reason: 'Annual review' }).subscribe();

    const request = httpTesting.expectOne(
      'http://localhost:8000/api/v1/admin/payroll-advance-global-policy-change-requests',
    );

    expect(request.request.method).toBe('POST');
    request.flush({ data: {}, meta: {}, errors: [] });
  });

  it('lists requests and versions with query parameters', () => {
    service.list({ status: 'PENDING_APPROVAL', country_code: 'CO', limit: 25 }).subscribe();
    const requests = httpTesting.expectOne((candidate) => {
      return candidate.url.endsWith('/payroll-advance-global-policy-change-requests')
        && candidate.params.get('status') === 'PENDING_APPROVAL'
        && candidate.params.get('country_code') === 'CO'
        && candidate.params.get('limit') === '25';
    });
    expect(requests.request.method).toBe('GET');
    requests.flush({ data: [], meta: {}, errors: [] });

    service.listVersions({ country_code: 'CO', limit: 10 }).subscribe();
    const versions = httpTesting.expectOne((candidate) => {
      return candidate.url.endsWith('/payroll-advance-global-policy/versions')
        && candidate.params.get('country_code') === 'CO'
        && candidate.params.get('limit') === '10';
    });
    expect(versions.request.method).toBe('GET');
    versions.flush({ data: [], meta: {}, errors: [] });
  });

  it('approves and rejects encoded request ids', () => {
    service.approve('request 1', { reason: 'Approved' }).subscribe();
    const approve = httpTesting.expectOne(
      'http://localhost:8000/api/v1/admin/payroll-advance-global-policy-change-requests/request%201/approve',
    );
    expect(approve.request.method).toBe('POST');
    approve.flush({ data: {}, meta: {}, errors: [] });

    service.reject('request 1', { reason: 'Rejected' }).subscribe();
    const reject = httpTesting.expectOne(
      'http://localhost:8000/api/v1/admin/payroll-advance-global-policy-change-requests/request%201/reject',
    );
    expect(reject.request.method).toBe('POST');
    reject.flush({ data: {}, meta: {}, errors: [] });
  });
});
