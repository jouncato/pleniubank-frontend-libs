import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { throwError, of } from 'rxjs';
import { vi } from 'vitest';
import { IdentityAuthApiService } from 'identity-data-access';

import { ForgotPasswordVm } from './forgot-password';

describe('ForgotPasswordVm', () => {
  let vm: ForgotPasswordVm;
  let api: {
    forgotPassword: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    api = {
      forgotPassword: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        ForgotPasswordVm,
        { provide: IdentityAuthApiService, useValue: api },
      ],
    });
    vm = TestBed.inject(ForgotPasswordVm);
  });

  it('debe completar recuperación en éxito', () => {
    api.forgotPassword.mockReturnValue(
      of({
        data: {
          status: 'accepted',
          message: 'Si la cuenta existe, enviamos instrucciones.',
          method: 'otp',
          debug_reset_code: '123456',
        },
      }),
    );

    vm.submit({ email: 'cliente@example.com', method: 'otp' });

    expect(vm.state).toBe('success');
    expect(vm.successMessage).toContain('instrucciones');
    expect(vm.debugResetCode).toBe('123456');
    expect(vm.submittedEmail).toBe('cliente@example.com');
  });

  it('debe mapear error 429', () => {
    api.forgotPassword.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 429,
            error: { errors: [{ code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' }] },
          }),
      ),
    );

    vm.submit({ email: 'cliente@example.com', method: 'link' });

    expect(vm.state).toBe('error');
    expect(vm.errorMessage).toContain('Demasiados intentos');
  });
});
