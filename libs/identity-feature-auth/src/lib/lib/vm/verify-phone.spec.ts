import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { IdentityAuthApiService } from '@pleniu/identity-data-access';
import { SessionStore } from '@pleniu/shared-auth';

import { VerifyPhoneVm } from './verify-phone';

describe('VerifyPhoneVm', () => {
  let service: VerifyPhoneVm;
  let router: { navigate: ReturnType<typeof vi.fn> };
  let sessionStore: { getRegistrationId: ReturnType<typeof vi.fn>; clear: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    router = { navigate: vi.fn() };
    sessionStore = { getRegistrationId: vi.fn(() => 'r1'), clear: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        VerifyPhoneVm,
        { provide: Router, useValue: router },
        {
          provide: IdentityAuthApiService,
          useValue: {
            verifyPhone: () =>
              of({
                registration_id: 'r1',
                email_verified: true,
                phone_verified: true,
                identity_verified: true,
                is_active: true,
              }),
            resendRegistrationPhoneOtp: () => of({ status: 'sent' }),
          },
        },
        { provide: SessionStore, useValue: sessionStore },
      ],
    });
    service = TestBed.inject(VerifyPhoneVm);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('clears temporary session and redirects to login when registration completes', () => {
    service.submit('123456');

    expect(sessionStore.clear).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/onboarding/party/access/login']);
  });
});
