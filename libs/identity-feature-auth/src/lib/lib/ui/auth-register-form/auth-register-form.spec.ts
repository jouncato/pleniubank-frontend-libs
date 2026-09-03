import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthRegisterForm } from './auth-register-form';
import { RegisterVm } from '../../vm/register';

const testLocalize = (messageParts: TemplateStringsArray, ...expressions: unknown[]): string =>
  messageParts.reduce((message, part, index) => `${message}${expressions[index - 1] ?? ''}${part}`);

(globalThis as typeof globalThis & { $localize?: typeof testLocalize }).$localize ??= testLocalize;

describe('AuthRegisterForm', () => {
  let component: AuthRegisterForm;
  let fixture: ComponentFixture<AuthRegisterForm>;
  const vm = {
    state: signal<'idle' | 'submitting' | 'success' | 'error' | 'rate_limited'>('idle'),
    errorMessage: signal<string | null>(null),
    fieldErrors: signal<Record<string, string>>({}),
    inviteToken: signal<string | null>(null),
    inviteEmail: signal<string | null>(null),
    inviteSubEnterpriseId: signal<string | null>(null),
    inviteEnterpriseId: signal<string | null>(null),
    loadQueryParams: vi.fn(),
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

  it('no ofrece NIT para el registro de persona y muestra el resumen inválido', () => {
    expect(component.documentTypeOptions.map((option) => option.value)).not.toContain('NIT');
    expect(component.validationSummary).toEqual([
      'Nombre completo',
      'Correo electrónico',
      'Teléfono celular',
      'Número de documento',
      'Contraseña',
      'Confirmar contraseña',
      'Autorización para tratamiento de datos',
    ]);
  });

  it('muestra únicamente la autorización para tratamiento de datos', () => {
    const consentLink = fixture.nativeElement.querySelector('.terms__link') as HTMLButtonElement;

    expect(consentLink.textContent.trim()).toBe('Autorizo el tratamiento de datos.');
    expect(fixture.nativeElement.textContent).not.toContain('términos y condiciones');
  });
});
