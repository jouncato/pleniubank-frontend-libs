import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_CONFIG } from '@pleniu/shared-http';

import { CoreCreditApprovalApiService } from './core-credit-approval-api.service';

describe('CoreCreditApprovalApiService', () => {
  let service: CoreCreditApprovalApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { coreBaseUrl: 'http://localhost:8000' } },
      ],
    });
    service = TestBed.inject(CoreCreditApprovalApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('allows approval evaluation without application_id', () => {
    service.evaluate({
      product_type: 'PAYROLL_ADVANCE',
      requested_amount: 500000,
      requested_payment: 50000,
      requested_term_months: 12,
    }).subscribe();

    const request = httpTesting.expectOne('http://localhost:8000/api/v1/credit-approvals/evaluate');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      product_type: 'PAYROLL_ADVANCE',
      requested_amount: 500000,
      requested_payment: 50000,
      requested_term_months: 12,
    });
    request.flush({ data: { decision: 'APPROVED' }, meta: {}, errors: [] });
  });
});
