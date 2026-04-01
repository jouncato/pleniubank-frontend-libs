import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { API_CONFIG } from 'shared-http';
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

  it('unwrapValidateResponse accepts plain body', () => {
    const body = { claims: { email: 'x@y.com', sub: 'u' } };
    expect(unwrapValidateResponse(body as never)).toEqual(body);
  });

  it('unwrapValidateResponse unwraps envelope', () => {
    const inner = { claims: { email: 'x@y.com' } };
    expect(unwrapValidateResponse({ data: inner } as never)).toEqual(inner);
  });
});

describe('IdentityAuthApiService', () => {
  it('should be created', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        IdentityAuthApiService,
        {
          provide: API_CONFIG,
          useValue: { identityBaseUrl: 'http://localhost:8082', coreBaseUrl: 'http://localhost:8000' },
        },
      ],
    });
    expect(TestBed.inject(IdentityAuthApiService)).toBeTruthy();
  });
});
