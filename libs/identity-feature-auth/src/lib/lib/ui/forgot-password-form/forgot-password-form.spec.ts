import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ForgotPasswordForm } from './forgot-password-form';
import { ForgotPasswordVm } from '../../vm/forgot-password';

describe('ForgotPasswordForm', () => {
  let component: ForgotPasswordForm;
  let fixture: ComponentFixture<ForgotPasswordForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForgotPasswordForm],
      providers: [
        provideRouter([]),
        {
          provide: ForgotPasswordVm,
          useValue: {
            state: 'idle',
            errorMessage: null,
            successMessage: null,
            debugResetCode: null,
            debugResetToken: null,
            submittedEmail: null,
            submittedMethod: 'otp',
            submit: () => {},
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
