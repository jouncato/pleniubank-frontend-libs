import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_CONFIG } from '@pleniu/shared-http';

import { CoreScoringOutboxApiService } from './core-scoring-outbox-api.service';

describe('CoreScoringOutboxApiService', () => {
  let service: CoreScoringOutboxApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { coreBaseUrl: 'http://localhost:8000', coreAdminApiPrefix: '/api/v1' } },
      ],
    });
    service = TestBed.inject(CoreScoringOutboxApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('lists DEAD_LETTER events through the Core system proxy', () => {
    service.list().subscribe();

    const request = httpTesting.expectOne((candidate) => {
      return candidate.url === 'http://localhost:8000/api/v1/system/scoring/outbox'
        && candidate.params.get('status') === 'DEAD_LETTER'
        && candidate.params.get('limit') === '100'
        && candidate.params.get('offset') === '0';
    });

    expect(request.request.method).toBe('GET');
    request.flush({ data: [], meta: { total: 0, limit: 100, offset: 0 } });
  });

  it('retries an event through the Core system proxy', () => {
    service.retry('event/1').subscribe();

    const request = httpTesting.expectOne('http://localhost:8000/api/v1/system/scoring/outbox/event%2F1/retry');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({});
    request.flush({ id: 'event/1', status: 'PENDING', message: 'Event queued for retry' });
  });
});
