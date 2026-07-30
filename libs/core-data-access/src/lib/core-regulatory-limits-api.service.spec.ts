import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';

import { CoreRegulatoryLimitsApiService } from './core-regulatory-limits-api.service';
import { RegulatoryLimitsResponse } from '@pleniu/core-domain';

const MOCK_API_CONFIG: ApiConfig = {
  coreBaseUrl: 'http://localhost:8000',
  identityBaseUrl: 'http://localhost:8001',
  coreAdminApiPrefix: '/api/v1',
  corePublicApiPrefix: '/api/v1',
};

const MOCK_RESPONSE: RegulatoryLimitsResponse = {
  items: [
    {
      id: '00000000-0000-0000-0000-000000000001',
      param_key: 'max_salary_percentage',
      country_code: 'CO',
      min_value: null,
      max_value: 0.4,
      effective_from: '2026-01-01T00:00:00Z',
      effective_to: null,
      created_at: '2026-01-01T00:00:00Z',
      created_by: 'system_seed',
      updated_at: null,
      updated_by: null,
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      param_key: 'min_salary_percentage',
      country_code: 'CO',
      min_value: 0.05,
      max_value: null,
      effective_from: '2026-01-01T00:00:00Z',
      effective_to: null,
      created_at: '2026-01-01T00:00:00Z',
      created_by: 'system_seed',
      updated_at: null,
      updated_by: null,
    },
  ],
  country_code: 'CO',
};

describe('CoreRegulatoryLimitsApiService', () => {
  let service: CoreRegulatoryLimitsApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        CoreRegulatoryLimitsApiService,
        { provide: API_CONFIG, useValue: MOCK_API_CONFIG },
      ],
    });
    service = TestBed.inject(CoreRegulatoryLimitsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should call GET /admin/regulatory-limits with country_code param', () => {
    service.getRegulatoryLimits('CO').subscribe((response) => {
      expect(response.data).toEqual(MOCK_RESPONSE);
    });

    const req = httpMock.expectOne(
      'http://localhost:8000/api/v1/regulatory-limits?country_code=CO',
    );
    expect(req.request.method).toBe('GET');
    req.flush({
      data: MOCK_RESPONSE,
      meta: {},
      errors: [],
    } as ApiEnvelope<RegulatoryLimitsResponse>);
  });

  it('should default country_code to CO when no argument provided', () => {
    service.getRegulatoryLimits().subscribe();

    const req = httpMock.expectOne(
      'http://localhost:8000/api/v1/regulatory-limits?country_code=CO',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ data: MOCK_RESPONSE, meta: {}, errors: [] });
  });

  it('should POST /admin/regulatory-limits-change-requests to propose a change', () => {
    service
      .propose({
        effective_from: '2026-08-30T00:00:00Z',
        reason: 'ajuste',
        max_salary_percentage: 0.35,
      })
      .subscribe();

    const req = httpMock.expectOne(
      'http://localhost:8000/api/v1/regulatory-limits-change-requests',
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body.max_salary_percentage).toBe(0.35);
    req.flush({ data: {}, meta: {}, errors: [] });
  });

  it('should GET /admin/regulatory-limits-change-requests with filters', () => {
    service.list({ status: 'PENDING_APPROVAL', country_code: 'CO', limit: 50 }).subscribe();

    const req = httpMock.expectOne(
      'http://localhost:8000/api/v1/regulatory-limits-change-requests?status=PENDING_APPROVAL&country_code=CO&limit=50',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ data: [], meta: {}, errors: [] });
  });

  it('should GET a single change request by id', () => {
    service.get('req-1').subscribe();

    const req = httpMock.expectOne(
      'http://localhost:8000/api/v1/regulatory-limits-change-requests/req-1',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ data: {}, meta: {}, errors: [] });
  });

  it('should POST /approve with a reason', () => {
    service.approve('req-1', { reason: 'ok' }).subscribe();

    const req = httpMock.expectOne(
      'http://localhost:8000/api/v1/regulatory-limits-change-requests/req-1/approve',
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ reason: 'ok' });
    req.flush({ data: {}, meta: {}, errors: [] });
  });

  it('should POST /reject with a reason', () => {
    service.reject('req-1', { reason: 'no procede' }).subscribe();

    const req = httpMock.expectOne(
      'http://localhost:8000/api/v1/regulatory-limits-change-requests/req-1/reject',
    );
    expect(req.request.method).toBe('POST');
    req.flush({ data: {}, meta: {}, errors: [] });
  });
});
