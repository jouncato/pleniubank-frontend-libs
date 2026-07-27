import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_CONFIG } from '@pleniu/shared-http';

import { CoreContractExceptionsApiService } from './core-contract-exceptions-api.service';

describe('CoreContractExceptionsApiService', () => {
  let service: CoreContractExceptionsApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { coreBaseUrl: 'http://localhost:8000', coreAdminApiPrefix: '/api/v1/admin' } },
      ],
    });
    service = TestBed.inject(CoreContractExceptionsApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('requests an exception through the Core admin contract endpoint', () => {
    service.requestException('contract 1', {
      exception_type: 'RATE_OVERRIDE',
      justification: 'Approved business exception',
      exception_details: { rate: 0.1 },
    }).subscribe();

    const request = httpTesting.expectOne(
      'http://localhost:8000/api/v1/admin/client-contracts/contract%201/exception-request',
    );

    expect(request.request.method).toBe('POST');
    request.flush({ data: {}, meta: {}, errors: [] });
  });

  it('lists exceptions with encoded query parameters', () => {
    service.listExceptions({ contractId: 'contract-1', status: 'PENDING', limit: 10, offset: 20 }).subscribe();

    const request = httpTesting.expectOne((candidate) => {
      return candidate.url === 'http://localhost:8000/api/v1/admin/contract-exceptions'
        && candidate.params.get('contract_id') === 'contract-1'
        && candidate.params.get('status') === 'PENDING'
        && candidate.params.get('limit') === '10'
        && candidate.params.get('offset') === '20';
    });

    expect(request.request.method).toBe('GET');
    request.flush({ data: [], meta: {}, errors: [] });
  });

  it('approves and executes an exception through Core', () => {
    service.approveException('exception 1', { action: 'APPROVE', approval_notes: 'Reviewed' }).subscribe();
    const approve = httpTesting.expectOne(
      'http://localhost:8000/api/v1/admin/contract-exceptions/exception%201/approve',
    );
    expect(approve.request.method).toBe('PATCH');
    approve.flush({ data: {}, meta: {}, errors: [] });

    service.executeException('exception 1', { execution_notes: 'Executed by operations' }).subscribe();
    const execute = httpTesting.expectOne(
      'http://localhost:8000/api/v1/admin/contract-exceptions/exception%201/execute',
    );
    expect(execute.request.method).toBe('POST');
    execute.flush({ data: {}, meta: {}, errors: [] });
  });
});
