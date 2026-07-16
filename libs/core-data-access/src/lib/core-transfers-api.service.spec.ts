import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_CONFIG } from '@pleniu/shared-http';

import { CoreTransfersApiService } from './core-transfers-api.service';

const mockApiConfig = {
  coreBaseUrl: 'http://localhost:8000',
  corePublicApiPrefix: '/api/v1/public',
};

const SAMPLE_TRANSFER = {
  id: 'tr-1',
  source_account_id: 'acc-1',
  destination_account_id: 'acc-2',
  source_customer_id: 'cust-1',
  destination_customer_id: 'cust-2',
  amount: '10000.00',
  currency: 'COP',
  status: 'COMPLETED',
  posting_batch_id: 'batch-1',
  created_at: '2026-07-15T00:00:00Z',
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
            destination: { account_id: 'acc-2' },
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
      expect(req.request.body.destination).toEqual({ account_id: 'acc-2' });
      req.flush({ data: SAMPLE_TRANSFER });
    });

    it('acepta destino por llave Bre-B (sin account_id)', () => {
      service
        .create(
          {
            source_account_id: 'acc-1',
            destination: { key_type: 'CELULAR', key_value: '3001234567' },
            amount: '5000.00',
          },
          'idem-key-2',
        )
        .subscribe();

      const req = httpTesting.expectOne('http://localhost:8000/api/v1/public/transfers');
      expect(req.request.body.destination).toEqual({ key_type: 'CELULAR', key_value: '3001234567' });
      req.flush({ data: SAMPLE_TRANSFER });
    });
  });

  describe('list', () => {
    it('aplica filtros como query params y devuelve un array plano', () => {
      service.list({ account_id: 'acc-1', cursor: '2026-07-01T00:00:00Z', limit: 10 }).subscribe((response) => {
        expect(response.data.length).toBe(1);
        expect(response.meta?.has_more).toBe(false);
      });

      const req = httpTesting.expectOne((r) => {
        const p = r.params;
        return (
          r.url === 'http://localhost:8000/api/v1/public/transfers' &&
          p.get('account_id') === 'acc-1' &&
          p.get('cursor') === '2026-07-01T00:00:00Z' &&
          p.get('limit') === '10'
        );
      });
      expect(req.request.method).toBe('GET');
      req.flush({ data: [SAMPLE_TRANSFER], meta: { cursor: null, has_more: false } });
    });
  });

  describe('get', () => {
    it('llama GET /transfers/{id}', () => {
      service.get('tr-1').subscribe((response) => {
        expect(response.data.source_customer_id).toBe('cust-1');
      });
      const req = httpTesting.expectOne('http://localhost:8000/api/v1/public/transfers/tr-1');
      expect(req.request.method).toBe('GET');
      req.flush({ data: SAMPLE_TRANSFER });
    });
  });
});
