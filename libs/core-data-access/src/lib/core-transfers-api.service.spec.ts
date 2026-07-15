import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_CONFIG } from '@pleniu/shared-http';

import { CoreTransfersApiService } from './core-transfers-api.service';

const mockApiConfig = {
  coreBaseUrl: 'http://localhost:8000',
  corePublicApiPrefix: '/api/v1/public',
};

describe('CoreTransfersApiService', () => {
  let service: CoreTransfersApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: mockApiConfig },
      ],
    });
    service = TestBed.inject(CoreTransfersApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('create', () => {
    it('envía X-Idempotency-Key y el payload de destino por cuenta', () => {
      service
        .create(
          {
            source_account_id: 'acc-1',
            destination: { type: 'account', account_id: 'acc-2' },
            amount: '10000.00',
          },
          'idem-key-1',
        )
        .subscribe((response) => {
          expect(response.data.id).toBe('tr-1');
        });

      const req = httpTesting.expectOne('http://localhost:8000/api/v1/public/transfers');
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('X-Idempotency-Key')).toBe('idem-key-1');
      expect(req.request.body.destination).toEqual({ type: 'account', account_id: 'acc-2' });
      req.flush({
        data: {
          id: 'tr-1',
          source_account_id: 'acc-1',
          destination_account_id: 'acc-2',
          amount: '10000.00',
          currency: 'COP',
          status: 'COMPLETED',
          direction: 'SENT',
          counterparty_masked_name: null,
          initiated_by: 'CUSTOMER',
          country_code: 'CO',
          created_at: '2026-07-15T00:00:00Z',
        },
      });
    });

    it('acepta destino por llave Bre-B', () => {
      service
        .create(
          {
            source_account_id: 'acc-1',
            destination: { type: 'breb_key', key_type: 'CELULAR', key_value: '3001234567' },
            amount: '5000.00',
          },
          'idem-key-2',
        )
        .subscribe();

      const req = httpTesting.expectOne('http://localhost:8000/api/v1/public/transfers');
      expect(req.request.body.destination).toEqual({
        type: 'breb_key',
        key_type: 'CELULAR',
        key_value: '3001234567',
      });
      req.flush({ data: {} });
    });
  });

  describe('list', () => {
    it('aplica filtros como query params', () => {
      service.list({ account_id: 'acc-1', direction: 'RECEIVED', cursor: 'c1', limit: 10 }).subscribe();

      const req = httpTesting.expectOne((r) => {
        const p = r.params;
        return (
          r.url === 'http://localhost:8000/api/v1/public/transfers' &&
          p.get('account_id') === 'acc-1' &&
          p.get('direction') === 'RECEIVED' &&
          p.get('cursor') === 'c1' &&
          p.get('limit') === '10'
        );
      });
      expect(req.request.method).toBe('GET');
      req.flush({ data: { items: [], next_cursor: null } });
    });
  });

  describe('get', () => {
    it('llama GET /transfers/{id}', () => {
      service.get('tr-1').subscribe();
      const req = httpTesting.expectOne('http://localhost:8000/api/v1/public/transfers/tr-1');
      expect(req.request.method).toBe('GET');
      req.flush({ data: {} });
    });
  });

  describe('resolveDestination', () => {
    it('envía key_type y key_value como query params', () => {
      service.resolveDestination('CELULAR', '3001234567').subscribe((response) => {
        expect(response.data.masked_holder_name).toContain('*');
      });

      const req = httpTesting.expectOne((r) =>
        r.url === 'http://localhost:8000/api/v1/public/transfers/resolve-destination' &&
        r.params.get('key_type') === 'CELULAR' &&
        r.params.get('key_value') === '3001234567',
      );
      expect(req.request.method).toBe('GET');
      req.flush({ data: { account_id: 'acc-9', masked_holder_name: 'J*** P***' } });
    });
  });
});
