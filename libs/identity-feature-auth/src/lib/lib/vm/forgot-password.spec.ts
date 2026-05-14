import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { IdentityAuthApiService } from '@pleniu/identity-data-access';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AuthRateLimitService } from './auth-rate-limit.service';
import { ForgotPasswordVm } from './forgot-password';

describe('ForgotPasswordVm', () => {
  let vm: ForgotPasswordVm;
  let api: {
    forgotPassword: ReturnType<typeof vi.fn>;
  };
  let router: {
    navigate: ReturnType<typeof vi.fn>;
  };

  function createRateLimitError() {
    return new HttpErrorResponse({
      status: 429,
      error: { errors: [{ code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' }] },
    });
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
    sessionStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-29T10:00:00.000Z'));
    api = {
      forgotPassword: vi.fn(),
    };
    router = {
      navigate: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        AuthRateLimitService,
        ForgotPasswordVm,
        { provide: IdentityAuthApiService, useValue: api },
        { provide: Router, useValue: router },
      ],
    });
    vm = TestBed.inject(ForgotPasswordVm);
  });

  afterEach(() => {
    sessionStorage.clear();
    vi.useRealTimers();
  });

  it('debe completar recuperacion en exito', () => {
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
    expect(vm.isRateLimited).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/auth/recovery-sent'], {
      state: { email: 'cliente@example.com' },
    });
  });

  it('debe mapear error 429', () => {
    api.forgotPassword.mockReturnValue(throwError(() => createRateLimitError()));

    vm.submit({ email: 'cliente@example.com', method: 'link' });

    expect(vm.state).toBe('rate_limited');
    expect(vm.isRateLimited).toBe(true);
    expect(vm.remainingSeconds).toBe(60);
    expect(vm.rateLimitMessage).toContain('60 segundos');
  });

  it('debe bloquear nuevos submits durante el cooldown', () => {
    api.forgotPassword.mockReturnValue(throwError(() => createRateLimitError()));

    vm.submit({ email: 'cliente@example.com', method: 'link' });
    vm.submit({ email: 'cliente@example.com', method: 'link' });

    expect(api.forgotPassword).toHaveBeenCalledTimes(1);
  });

  it('debe incrementar a 120 segundos en un segundo 429 consecutivo', () => {
    api.forgotPassword.mockReturnValue(throwError(() => createRateLimitError()));

    vm.submit({ email: 'cliente@example.com', method: 'link' });
    vi.advanceTimersByTime(60_000);
    vm.submit({ email: 'cliente@example.com', method: 'link' });

    expect(vm.remainingSeconds).toBe(120);
  });

  it('debe resetear el streak con un error no 429', () => {
    api.forgotPassword
      .mockReturnValueOnce(throwError(() => createRateLimitError()))
      .mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 0,
              error: { errors: [{ code: 'NETWORK_ERROR', message: 'Offline' }] },
            }),
        ),
      )
      .mockReturnValue(throwError(() => createRateLimitError()));

    vm.submit({ email: 'cliente@example.com', method: 'link' });
    vi.advanceTimersByTime(60_000);
    vm.submit({ email: 'cliente@example.com', method: 'link' });
    expect(vm.errorMessage).toContain('Error de conexion');
    vm.submit({ email: 'cliente@example.com', method: 'link' });

    expect(vm.remainingSeconds).toBe(60);
  });
});
