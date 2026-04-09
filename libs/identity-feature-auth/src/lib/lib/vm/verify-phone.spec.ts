import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { IdentityAuthApiService } from '@pleniu/identity-data-access';
import { SessionStore } from '@pleniu/shared-auth';

import { VerifyPhoneVm } from './verify-phone';

describe('VerifyPhoneVm', () => {
  let service: VerifyPhoneVm;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        VerifyPhoneVm,
        { provide: Router, useValue: { navigate: () => Promise.resolve(true) } },
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
        { provide: SessionStore, useValue: { getRegistrationId: () => 'r1' } },
      ],
    });
    service = TestBed.inject(VerifyPhoneVm);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
