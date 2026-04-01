import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthRegisterForm } from './auth-register-form';
import { RegisterVm } from '../../vm/register';

describe('AuthRegisterForm', () => {
  let component: AuthRegisterForm;
  let fixture: ComponentFixture<AuthRegisterForm>;
  const vm = {
    state: signal<'idle' | 'submitting' | 'success' | 'error' | 'rate_limited'>('idle'),
    errorMessage: signal<string | null>(null),
    submit: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthRegisterForm],
      providers: [provideRouter([]), { provide: RegisterVm, useValue: vm }],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthRegisterForm);
    component = fixture.componentInstance;
    vm.submit.mockReset();
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('submits the backend-compatible payload when form is valid', () => {
    component.form.setValue({
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      phone: '3001234567',
      documentType: 'CC',
      documentNumber: '123456789',
      password: 'StrongPass!123',
      confirmPassword: 'StrongPass!123',
      acceptedTerms: true,
    });

    component.submit();

    expect(vm.submit).toHaveBeenCalledWith({
      email: 'jane@example.com',
      phone: '3001234567',
      password: 'StrongPass!123',
      full_name: 'Jane Doe',
      document_type: 'CC',
      document_number: '123456789',
      consent: true,
    });
  });

  it('stops submit when passwords do not match', () => {
    component.form.setValue({
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      phone: '3001234567',
      documentType: 'CC',
      documentNumber: '123456789',
      password: 'StrongPass!123',
      confirmPassword: 'StrongPass!124',
      acceptedTerms: true,
    });

    component.submit();

    expect(vm.submit).not.toHaveBeenCalled();
    expect(component.form.controls.confirmPassword.hasError('mismatch')).toBe(true);
  });
});
