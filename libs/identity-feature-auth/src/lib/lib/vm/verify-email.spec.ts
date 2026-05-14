import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { IdentityAuthApiService } from '@pleniu/identity-data-access';
import { SessionStore } from '@pleniu/shared-auth';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { VerifyEmailVm } from './verify-email';

describe('VerifyEmailVm', () => {
  let service: VerifyEmailVm;
  let router: { navigate: ReturnType<typeof vi.fn> };
  let sessionStore: { getRegistrationId: ReturnType<typeof vi.fn>; clear: ReturnType<typeof vi.fn> };
  let api: { verifyEmail: ReturnType<typeof vi.fn>; resendEmailOtp: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    router = { navigate: vi.fn() };
    sessionStore = { getRegistrationId: vi.fn(() => 'r1'), clear: vi.fn() };
    api = { verifyEmail: vi.fn(), resendEmailOtp: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        VerifyEmailVm,
        { provide: Router, useValue: router },
        { provide: IdentityAuthApiService, useValue: api },
        { provide: SessionStore, useValue: sessionStore },
      ],
    });
    service = TestBed.inject(VerifyEmailVm);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('clears temporary session and redirects to login when registration completes', () => {
    api.verifyEmail.mockReturnValue(
      of({
        registration_id: 'r1',
        email_verified: true,
        phone_verified: false,
        identity_verified: true,
        is_active: true,
        access_token: 'token',
      }),
    );

    service.submit('123456');

    expect(sessionStore.clear).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/onboarding/party/access/login']);
  });
});
