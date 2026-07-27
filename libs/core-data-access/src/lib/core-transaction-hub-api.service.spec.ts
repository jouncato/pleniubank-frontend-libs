import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_CONFIG } from '@pleniu/shared-http';

import { CoreTransactionHubApiService } from './core-transaction-hub-api.service';

const mockApiConfig = {
  coreBaseUrl: 'http://localhost:8000',
  coreAdminApiPrefix: '/api/v1',
};

describe('CoreTransactionHubApiService', () => {
  let service: CoreTransactionHubApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: mockApiConfig },
      ],
    });
    service = TestBed.inject(CoreTransactionHubApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('list', () => {
    it('should call GET /hub/transactions with no filters', () => {
      service.list({}).subscribe((response) => {
        expect(response.data.items).toEqual([]);
        expect(response.data.partial).toBe(false);
      });

      const req = httpTesting.expectOne('http://localhost:8000/api/v1/hub/transactions');
      expect(req.request.method).toBe('GET');
      req.flush({
        data: { items: [], source_errors: {}, partial: false },
        meta: {},
      });
    });

    it('should append array filters as repeated params', () => {
      service.list({
        domain: ['ACCOUNT', 'LENDING'],
        source_system: ['CORE_ACCOUNT'],
        status: ['COMPLETED'],
        limit: 10,
      }).subscribe();

      const req = httpTesting.expectOne((r) => {
        const params = r.params;
        return (
          r.url === 'http://localhost:8000/api/v1/hub/transactions' &&
          params.getAll('domain')?.join(',') === 'ACCOUNT,LENDING' &&
          params.get('source_system') === 'CORE_ACCOUNT' &&
          params.get('status') === 'COMPLETED' &&
          params.get('limit') === '10'
        );
      });
      expect(req.request.method).toBe('GET');
      req.flush({ data: { items: [], source_errors: {}, partial: false }, meta: {} });
    });

    it('should handle partial response with source_errors', () => {
      service.list({}).subscribe((response) => {
        expect(response.data.partial).toBe(true);
        expect(response.data.source_errors['PAYMENTHUB']).toContain('timeout');
      });

      const req = httpTesting.expectOne('http://localhost:8000/api/v1/hub/transactions');
      req.flush({
        data: {
          items: [
            {
              transaction_id: '550e8400-e29b-41d4-a716-446655440001',
              source_system: 'CORE_ACCOUNT',
              source_entity_id: 'pib-001',
              domain: 'ACCOUNT',
              transaction_type: 'POSTING_BATCH',
              status: 'COMPLETED',
              source_status: 'COMMITTED',
              amount: '1000.00',
              currency: 'COP',
              principal_party_id: null,
              counterparty_id: null,
              product_code: null,
              product_type: null,
              created_at: '2025-06-15T10:00:00Z',
              updated_at: null,
              correlation_id: null,
              metadata: {},
            },
          ],
          source_errors: { PAYMENTHUB: 'PaymentHubError: Connection timeout after 5s' },
          partial: true,
        },
        meta: { cursor: null, has_more: false },
      });
    });
  });

  describe('detail', () => {
    it('should call GET /hub/transactions/{id} with an encoded segment', () => {
      const txId = 'transaction/with space';

      service.detail(txId).subscribe((response) => {
        expect(response.data.transaction_id).toBe(txId);
        expect(response.data.timeline.length).toBe(2);
      });

      const req = httpTesting.expectOne(
        'http://localhost:8000/api/v1/hub/transactions/transaction%2Fwith%20space',
      );
      expect(req.request.method).toBe('GET');
      req.flush({
        data: {
          transaction_id: txId,
          source_system: 'CORE_ACCOUNT',
          source_entity_id: 'pib-001',
          domain: 'ACCOUNT',
          transaction_type: 'POSTING_BATCH',
          status: 'COMPLETED',
          source_status: 'COMMITTED',
          amount: '1000.00',
          currency: 'COP',
          principal_party_id: null,
          counterparty_id: null,
          product_code: null,
          product_type: null,
          created_at: '2025-06-15T10:00:00Z',
          updated_at: '2025-06-15T10:05:00Z',
          correlation_id: null,
          metadata: {},
          timeline: [
            { timestamp: '2025-06-15T10:00:00Z', event_type: 'created', description: 'Created', source: 'CORE_ACCOUNT' },
            { timestamp: '2025-06-15T10:05:00Z', event_type: 'updated', description: 'Status changed', source: 'CORE_ACCOUNT' },
          ],
        },
        meta: {},
      });
    });
  });
});
