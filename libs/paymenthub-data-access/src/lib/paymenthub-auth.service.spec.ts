import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG } from '@pleniu/shared-http';

import { PaymentHubAuthService } from './paymenthub-auth.service';
import { PaymentHubHttpService } from './paymenthub-http.service';

describe('PaymentHubAuthService', () => {
  let service: PaymentHubAuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        PaymentHubHttpService,
        PaymentHubAuthService,
        {
          provide: API_CONFIG,
          useValue: {
            identityBaseUrl: 'http://id',
            coreBaseUrl: 'http://core',
            paymentHubBaseUrl: 'http://ph.test',
            paymentHubClientId: 'mock-client',
            paymentHubClientSecret: 'mock-secret',
            paymentHubOAuthScope: 'payments:read',
          },
        },
      ],
    });
    service = TestBed.inject(PaymentHubAuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('obtiene token via form-urlencoded y lo cachea', () => {
    service.ensureAccessToken().subscribe((t) => expect(t).toBe('tok-1'));
    const req = httpMock.expectOne('http://ph.test/oauth/token');
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Content-Type')).toBe('application/x-www-form-urlencoded');
    expect(req.request.body).toContain('client_id=mock-client');
    expect(req.request.body).toContain('grant_type=client_credentials');
    expect(req.request.body).toMatch(/scope=payments[:%]read/);
    req.flush({ access_token: 'tok-1', expires_in: 3600, token_type: 'Bearer' });

    service.ensureAccessToken().subscribe((t) => expect(t).toBe('tok-1'));
    httpMock.expectNone('http://ph.test/oauth/token');
  });
});

describe('PaymentHubAuthService sin OAuth completo', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        PaymentHubHttpService,
        PaymentHubAuthService,
        {
          provide: API_CONFIG,
          useValue: {
            identityBaseUrl: 'http://id',
            coreBaseUrl: 'http://core',
            paymentHubBaseUrl: 'http://ph.test',
          },
        },
      ],
    });
  });

  it('emite error si faltan client_id / secret', () => {
    const s = TestBed.inject(PaymentHubAuthService);
    s.ensureAccessToken().subscribe({
      error: (e: Error) => {
        expect(e.message).toContain('paymentHubClientId');
      },
    });
  });
});
