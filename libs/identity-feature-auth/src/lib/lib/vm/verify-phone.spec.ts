import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { IdentityAuthApiService } from 'identity-data-access';
import { SessionStore } from 'shared-auth';

import { VerifyPhoneVm } from './verify-phone';

describe('VerifyPhoneVm', () => {
  let service: VerifyPhoneVm;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        VerifyPhoneVm,
        { provide: Router, useValue: { navigate: () => Promise.resolve(true) } },
        { provide: IdentityAuthApiService, useValue: { verifyPhone: () => {} } },
        { provide: SessionStore, useValue: { getRegistrationId: () => 'r1' } },
      ],
    });
    service = TestBed.inject(VerifyPhoneVm);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
