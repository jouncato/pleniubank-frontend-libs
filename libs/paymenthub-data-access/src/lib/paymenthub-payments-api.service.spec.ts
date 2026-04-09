import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG } from '@pleniu/shared-http';

import { PaymentHubAuthService } from './paymenthub-auth.service';
import { PaymentHubContext } from './paymenthub-context.service';
import { PaymentHubHttpService } from './paymenthub-http.service';
import { PaymentHubPaymentsApiService } from './paymenthub-payments-api.service';

describe('PaymentHubPaymentsApiService', () => {
  let service: PaymentHubPaymentsApiService;
  let httpMock: HttpTestingController;

  const apiConfig = {
    identityBaseUrl: 'http://id',
    coreBaseUrl: 'http://core',
    paymentHubBaseUrl: 'http://ph.test',
    paymentHubClientId: 'c',
    paymentHubClientSecret: 's',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        PaymentHubHttpService,
        PaymentHubAuthService,
        PaymentHubContext,
        PaymentHubPaymentsApiService,
        { provide: API_CONFIG, useValue: apiConfig },
      ],
    });
    service = TestBed.inject(PaymentHubPaymentsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getPayment usa Bearer tras oauth', () => {
    const pid = '550e8400-e29b-41d4-a716-446655440000';
    service.getPayment(pid).subscribe((p) => expect(p.status).toBe('PENDING'));

    const tok = httpMock.expectOne('http://ph.test/oauth/token');
    tok.flush({ access_token: 'at', expires_in: 3600 });

    const get = httpMock.expectOne(`http://ph.test/v1/payments/${pid}`);
    expect(get.request.headers.get('Authorization')).toBe('Bearer at');
    get.flush({
      paymentId: pid,
      amount: '1',
      currency: 'COP',
      debtor: { name: 'a', accountId: '1' },
      creditor: { name: 'b', accountId: '2' },
      paymentType: 'P2P',
      country: 'CO',
      status: 'PENDING',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    });
  });
});
