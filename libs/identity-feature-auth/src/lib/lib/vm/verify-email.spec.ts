import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { IdentityAuthApiService } from '@pleniu/identity-data-access';
import { SessionStore } from '@pleniu/shared-auth';

import { VerifyEmailVm } from './verify-email';

describe('VerifyEmailVm', () => {
  let service: VerifyEmailVm;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        VerifyEmailVm,
        { provide: Router, useValue: { navigate: () => Promise.resolve(true) } },
        {
          provide: IdentityAuthApiService,
          useValue: { verifyEmail: () => {}, resendEmailOtp: () => {} },
        },
        { provide: SessionStore, useValue: { getRegistrationId: () => 'r1' } },
      ],
    });
    service = TestBed.inject(VerifyEmailVm);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
