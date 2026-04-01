import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { OtpChallenge } from './otp-challenge';
import { VerifyEmailVm } from '../../vm/verify-email';
import { VerifyPhoneVm } from '../../vm/verify-phone';

describe('OtpChallenge', () => {
  let component: OtpChallenge;
  let fixture: ComponentFixture<OtpChallenge>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OtpChallenge],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { data: { channel: 'email' }, routeConfig: { path: 'verify-email' } } },
        },
        {
          provide: VerifyEmailVm,
          useValue: {
            state: () => 'idle',
            errorMessage: () => null,
            resendSecondsLeft: () => 0,
            submit: () => {},
            resendEmail: () => {},
          },
        },
        { provide: VerifyPhoneVm, useValue: { state: 'idle', errorMessage: null, submit: () => {} } },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(OtpChallenge);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
