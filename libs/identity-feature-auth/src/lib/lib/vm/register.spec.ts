import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { IdentityAuthApiService } from '@pleniu/identity-data-access';
import { RegisterRequest } from 'identity-domain';
import { of, throwError } from 'rxjs';
import { SessionStore } from '@pleniu/shared-auth';
import { RegisterVm } from './register';

const registerPayload: RegisterRequest = {
  email: 'user@example.com',
  phone: '3001234567',
  password: 'StrongPass!123',
  full_name: 'User Name',
  document_type: 'CC',
  document_number: '123456789',
  consent: true,
};

describe('RegisterVm', () => {
  const router = { navigate: vi.fn().mockResolvedValue(true) };
  const api = { register: vi.fn() };
  const sessionStore = { setRegistrationId: vi.fn() };

  beforeEach(() => {
    TestBed.resetTestingModule();
    router.navigate.mockClear();
    api.register.mockReset();
    sessionStore.setRegistrationId.mockClear();

    TestBed.configureTestingModule({
      providers: [
        RegisterVm,
        { provide: Router, useValue: router },
        { provide: IdentityAuthApiService, useValue: api },
        { provide: SessionStore, useValue: sessionStore },
      ],
    });
  });

  it('stores registration id and routes to verify-contact hub on success (envelope)', () => {
    api.register.mockReturnValue(of({ data: { registration_id: 'r1' } }));
    const vm = TestBed.inject(RegisterVm);

    vm.submit(registerPayload);

    expect(sessionStore.setRegistrationId).toHaveBeenCalledWith('r1');
    expect(router.navigate).toHaveBeenCalledWith(['/onboarding/party/customer/verify-contact'], {
      state: { registrationId: 'r1' },
    });
    expect(vm.state()).toBe('success');
  });

  it('stores registration id when Identity returns flat RegisterResponse (no data wrapper)', () => {
    api.register.mockReturnValue(of({ registration_id: 'r2' }));
    const vm = TestBed.inject(RegisterVm);

    vm.submit(registerPayload);

    expect(sessionStore.setRegistrationId).toHaveBeenCalledWith('r2');
    expect(router.navigate).toHaveBeenCalledWith(['/onboarding/party/customer/verify-contact'], {
      state: { registrationId: 'r2' },
    });
    expect(vm.state()).toBe('success');
  });

  it('maps 429 responses to rate_limited state', () => {
    api.register.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 429,
            error: { errors: [{ code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' }] },
          }),
      ),
    );
    const vm = TestBed.inject(RegisterVm);

    vm.submit(registerPayload);

    expect(vm.state()).toBe('rate_limited');
    expect(vm.errorMessage()).toContain('Demasiados intentos');
  });

  it('shows Spanish message on 409 when backend says Document already registered', () => {
    api.register.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: {
              errors: [{ code: 'CONFLICT', message: 'Document already registered' }],
            },
          }),
      ),
    );
    const vm = TestBed.inject(RegisterVm);

    vm.submit(registerPayload);

    expect(vm.state()).toBe('error');
    expect(vm.errorMessage()).toBe('Ya existe una cuenta con este número de documento.');
  });

  it('shows Spanish message on 409 when backend says Email already registered', () => {
    api.register.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: {
              errors: [{ code: 'CONFLICT', message: 'Email already registered' }],
            },
          }),
      ),
    );
    const vm = TestBed.inject(RegisterVm);

    vm.submit(registerPayload);

    expect(vm.state()).toBe('error');
    expect(vm.errorMessage()).toBe('Ya existe una cuenta con este correo electrónico.');
  });

  it('uses fallback copy on 409 when envelope has no usable message', () => {
    api.register.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { errors: [] },
          }),
      ),
    );
    const vm = TestBed.inject(RegisterVm);

    vm.submit(registerPayload);

    expect(vm.state()).toBe('error');
    expect(vm.errorMessage()).toBe(
      'Ya existe un registro con la información ingresada.',
    );
  });
});

