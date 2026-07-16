import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_CONFIG } from '@pleniu/shared-http';

import { IdentityProfileApiService } from './identity-profile-api.service';

const mockApiConfig = { identityBaseUrl: 'http://localhost:8010' };

describe('IdentityProfileApiService', () => {
  let service: IdentityProfileApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: mockApiConfig },
      ],
    });
    service = TestBed.inject(IdentityProfileApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getMe() llama GET /auth/me y devuelve cuerpo plano', () => {
    service.getMe().subscribe((profile) => {
      expect(profile.document_number_masked).toContain('*');
      expect(profile.customer_id).toBe('cust-1');
    });
    const req = httpTesting.expectOne('http://localhost:8010/api/v1/auth/me');
    expect(req.request.method).toBe('GET');
    req.flush({
      user_id: 'u1',
      customer_id: 'cust-1',
      full_name: 'Ana Pérez',
      email: 'ana@example.com',
      phone: '3001234567',
      document_type: 'CC',
      document_number_masked: '***789',
      country_code: 'CO',
      email_verified: true,
      phone_verified: true,
      identity_verified: true,
      two_factor_enabled: false,
      kyc_status: 'verified',
    });
  });

  it('updateName() llama PATCH /auth/me con full_name', () => {
    service.updateName({ full_name: 'Ana María Pérez' }).subscribe();
    const req = httpTesting.expectOne('http://localhost:8010/api/v1/auth/me');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ full_name: 'Ana María Pérez' });
    req.flush({});
  });

  it('startPhoneChange() llama POST /auth/me/phone-change', () => {
    service.startPhoneChange({ current_password: 'x', new_phone: '3009876543' }).subscribe();
    const req = httpTesting.expectOne('http://localhost:8010/api/v1/auth/me/phone-change');
    expect(req.request.method).toBe('POST');
    req.flush({ status: 'challenge_sent', expires_in_seconds: 300 });
  });

  it('verifyPhoneChange() llama POST /auth/me/phone-change/verify', () => {
    service.verifyPhoneChange({ code: '123456' }).subscribe((res) => {
      expect(res.status).toBe('updated');
    });
    const req = httpTesting.expectOne('http://localhost:8010/api/v1/auth/me/phone-change/verify');
    expect(req.request.method).toBe('POST');
    req.flush({ status: 'updated' });
  });

  it('startEmailChange() llama POST /auth/me/email-change', () => {
    service.startEmailChange({ current_password: 'x', new_email: 'nuevo@example.com' }).subscribe();
    const req = httpTesting.expectOne('http://localhost:8010/api/v1/auth/me/email-change');
    expect(req.request.method).toBe('POST');
    req.flush({ status: 'challenge_sent', expires_in_seconds: 300 });
  });

  it('verifyEmailChangeOtp() devuelve el estado de confirmación pendiente', () => {
    service.verifyEmailChangeOtp({ code: '654321' }).subscribe((res) => {
      expect(res.status).toBe('confirmation_required');
      expect(res.confirmation_expires_in_seconds).toBe(900);
    });
    const req = httpTesting.expectOne('http://localhost:8010/api/v1/auth/me/email-change/verify');
    expect(req.request.method).toBe('POST');
    req.flush({ status: 'confirmation_required', confirmation_expires_in_seconds: 900 });
  });

  it('confirmEmailChange() llama POST /auth/me/email-change/confirm', () => {
    service.confirmEmailChange({ confirmation_token: 'tok-123' }).subscribe((res) => {
      expect(res.status).toBe('updated');
    });
    const req = httpTesting.expectOne('http://localhost:8010/api/v1/auth/me/email-change/confirm');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ confirmation_token: 'tok-123' });
    req.flush({ status: 'updated' });
  });

  describe('cierre de cuenta (b2c-account-closure)', () => {
    it('requestClosureChallenge() llama POST /auth/me/closure/challenge', () => {
      service.requestClosureChallenge().subscribe((res) => {
        expect(res.status).toBe('challenge_sent');
      });
      const req = httpTesting.expectOne('http://localhost:8010/api/v1/auth/me/closure/challenge');
      expect(req.request.method).toBe('POST');
      req.flush({ status: 'challenge_sent', data_erasure_separate: true, expires_in_seconds: 300 });
    });

    it('requestClosure() llama POST /auth/me/closure', () => {
      service.requestClosure({ current_password: 'x', code: '111111' }).subscribe();
      const req = httpTesting.expectOne('http://localhost:8010/api/v1/auth/me/closure');
      expect(req.request.method).toBe('POST');
      req.flush({ status: 'requested', data_erasure_separate: true });
    });

    it('getClosure() expone motivo de bloqueo tipado', () => {
      service.getClosure().subscribe((res) => {
        expect(res.reason).toBe('ACTIVE_OBLIGATIONS');
      });
      const req = httpTesting.expectOne('http://localhost:8010/api/v1/auth/me/closure');
      expect(req.request.method).toBe('GET');
      req.flush({ status: 'blocked', reason: 'ACTIVE_OBLIGATIONS', data_erasure_separate: true });
    });

    it('cancelClosure() llama DELETE /auth/me/closure', () => {
      service.cancelClosure().subscribe();
      const req = httpTesting.expectOne('http://localhost:8010/api/v1/auth/me/closure');
      expect(req.request.method).toBe('DELETE');
      req.flush({ status: 'cancelled', data_erasure_separate: true });
    });
  });
});
