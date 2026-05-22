import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_CONFIG } from '@pleniu/shared-http';
import {
  IdentityAuthApiService,
  unwrapRefreshResponse,
  unwrapValidateResponse,
} from './identity-data-access';

describe('unwrapRefreshResponse / unwrapValidateResponse (FE-OBS-002)', () => {
  it('unwrapRefreshResponse accepts plain body', () => {
    const body = { access_token: 'a', refresh_token: 'r' };
    expect(unwrapRefreshResponse(body)).toEqual(body);
  });

  it('unwrapRefreshResponse unwraps envelope', () => {
    const inner = { access_token: 'a' };
    expect(unwrapRefreshResponse({ data: inner })).toEqual(inner);
  });

  it('unwrapValidateResponse accepts plain body with nested claims', () => {
    const body = { claims: { email: 'x@y.com', sub: 'u' } };
    expect(unwrapValidateResponse(body as never)).toEqual({
      claims: { user_id: 'u', email: 'x@y.com' },
    });
  });

  it('unwrapValidateResponse maps flat Identity ValidateTokenResponse', () => {
    const body = {
      user_id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'c@example.com',
      full_name: 'Cliente Demo',
      role: 'customer',
      enterprise_id: null,
      customer_id: '660e8400-e29b-41d4-a716-446655440001',
      phone_verified: false,
      email_verified: true,
      identity_verified: true,
    };
    expect(unwrapValidateResponse(body as never)).toEqual({
      claims: {
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'c@example.com',
        full_name: 'Cliente Demo',
        role: 'customer',
        enterprise_id: undefined,
        customer_id: '660e8400-e29b-41d4-a716-446655440001',
        phone_verified: false,
        email_verified: true,
        identity_verified: true,
      },
    });
  });

  it('unwrapValidateResponse unwraps envelope', () => {
    const inner = { claims: { email: 'x@y.com' } };
    expect(unwrapValidateResponse({ data: inner } as never)).toEqual({
      claims: { email: 'x@y.com' },
    });
  });
});

describe('IdentityAuthApiService', () => {
  let httpMock: HttpTestingController;
  let service: IdentityAuthApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        IdentityAuthApiService,
        {
          provide: API_CONFIG,
          useValue: { identityBaseUrl: 'http://localhost:8080', coreBaseUrl: 'http://localhost:8000' },
        },
      ],
    });
    service = TestBed.inject(IdentityAuthApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('reads identity health checks for dynamic flags', () => {
    service.getHealth().subscribe((body) => {
      expect(body.checks?.['delegated_subject']).toBe('on');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/health');
    expect(req.request.method).toBe('GET');
    req.flush({
      status: 'ok',
      service: 'identity',
      version: 'test',
      checks: { delegated_subject: 'on' },
    });
  });
});
