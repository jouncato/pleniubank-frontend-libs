import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { throwError, of } from 'rxjs';
import { vi } from 'vitest';
import { IdentityAuthApiService } from 'identity-data-access';

import { ResetPasswordVm } from './reset-password';

describe('ResetPasswordVm', () => {
  let vm: ResetPasswordVm;
  let api: {
    resetPassword: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    api = {
      resetPassword: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        ResetPasswordVm,
        { provide: IdentityAuthApiService, useValue: api },
      ],
    });
    vm = TestBed.inject(ResetPasswordVm);
  });

  it('debe quedar en success cuando backend confirma reset', () => {
    api.resetPassword.mockReturnValue(of({ data: { status: 'password_reset', sessions_revoked: true } }));

    vm.submit({
      email: 'cliente@example.com',
      new_password: 'StrongPass!123',
      code: '123456',
    });

    expect(vm.state).toBe('success');
    expect(vm.successMessage).toContain('actualizada');
  });

  it('debe mapear credential expirada', () => {
    api.resetPassword.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 422,
            error: { errors: [{ code: 'RESET_CREDENTIAL_EXPIRED', message: 'expired' }] },
          }),
      ),
    );

    vm.submit({
      email: 'cliente@example.com',
      new_password: 'StrongPass!123',
      token: 'token',
    });

    expect(vm.state).toBe('error');
    expect(vm.errorMessage).toContain('expiró');
  });

  it('debe mapear error de red', () => {
    api.resetPassword.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 0,
            error: null,
          }),
      ),
    );

    vm.submit({
      email: 'cliente@example.com',
      new_password: 'StrongPass!123',
      code: '123456',
    });

    expect(vm.state).toBe('error');
    expect(vm.errorMessage).toContain('conexión');
  });
});
