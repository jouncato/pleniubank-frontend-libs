import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG } from '@pleniu/shared-http';

import { PaymentHubPaymentsApiService } from './paymenthub-payments-api.service';

describe('PaymentHubPaymentsApiService', () => {
  let service: PaymentHubPaymentsApiService;
  let httpMock: HttpTestingController;

  const apiConfig = {
    identityBaseUrl: 'http://id',
    coreBaseUrl: 'http://core',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
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

  it('getPayment llama al proxy de Core bajo /api/v1/paymenthub', () => {
    const pid = '550e8400-e29b-41d4-a716-446655440000';
    service.getPayment(pid).subscribe((p) => expect(p.status).toBe('PENDING'));

    const get = httpMock.expectOne(`http://core/api/v1/paymenthub/payments/${pid}`);
    expect(get.request.method).toBe('GET');
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

  it('listPayments aplica filtros como query params y desenvuelve `items`', () => {
    service.listPayments({ status: 'PENDING', country: 'CO', limit: 10 }).subscribe((list) => {
      expect(list.length).toBe(1);
    });

    const req = httpMock.expectOne(
      (r) => r.url === 'http://core/api/v1/paymenthub/payments',
    );
    expect(req.request.params.get('status')).toBe('PENDING');
    expect(req.request.params.get('country')).toBe('CO');
    expect(req.request.params.get('limit')).toBe('10');
    req.flush({
      items: [
        {
          paymentId: '1',
          amount: '1',
          currency: 'COP',
          debtor: { name: 'a', accountId: '1' },
          creditor: { name: 'b', accountId: '2' },
          paymentType: 'P2P',
          country: 'CO',
          status: 'PENDING',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      ],
    });
  });

  it('createPayment envia Idempotency-Key', () => {
    service
      .createPayment(
        {
          amount: '1',
          currency: 'COP',
          debtor: { name: 'a', accountId: '1' },
          creditor: { name: 'b', accountId: '2' },
          paymentType: 'P2P',
          country: 'CO',
        },
        'idem-1',
      )
      .subscribe();

    const req = httpMock.expectOne('http://core/api/v1/paymenthub/payments');
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Idempotency-Key')).toBe('idem-1');
    req.flush({
      paymentId: '1',
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

  it('cancelPayment envia Idempotency-Key al endpoint /cancel', () => {
    const pid = '1';
    service.cancelPayment(pid, 'idem-2').subscribe();

    const req = httpMock.expectOne(`http://core/api/v1/paymenthub/payments/${pid}/cancel`);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Idempotency-Key')).toBe('idem-2');
    req.flush({
      paymentId: pid,
      amount: '1',
      currency: 'COP',
      debtor: { name: 'a', accountId: '1' },
      creditor: { name: 'b', accountId: '2' },
      paymentType: 'P2P',
      country: 'CO',
      status: 'CANCELLED',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    });
  });

  it('simulatePayment llama al endpoint /simulate sin Idempotency-Key', () => {
    const pid = '1';
    service.simulatePayment(pid, { type: 'LATENCY' }).subscribe();

    const req = httpMock.expectOne(`http://core/api/v1/paymenthub/payments/${pid}/simulate`);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.has('Idempotency-Key')).toBe(false);
    req.flush({
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
