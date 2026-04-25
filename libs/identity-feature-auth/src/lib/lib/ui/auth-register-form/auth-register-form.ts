import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RegisterDocumentType, validateCountryDocument } from '@pleniu/identity-domain';
import { RegisterVm } from '../../vm/register';

const PASSWORD_COMPLEXITY_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;
const PHONE_PATTERN = /^[0-9+\-\s()]{7,20}$/;

@Component({
  selector: 'lib-auth-register-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './auth-register-form.html',
  styleUrl: './auth-register-form.scss',
})
export class AuthRegisterForm {
  private readonly fb = inject(FormBuilder);

  readonly documentTypeOptions: ReadonlyArray<{ value: RegisterDocumentType; label: string }> = [
    { value: 'CC', label: 'Cedula de ciudadania (CC)' },
    { value: 'CE', label: 'Cedula de extranjeria (CE)' },
    { value: 'NIT', label: 'NIT' },
    { value: 'PP', label: 'Pasaporte (PP)' },
    { value: 'TI', label: 'Tarjeta de identidad (TI)' },
  ];

  readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    documentType: ['CC' as RegisterDocumentType, [Validators.required]],
    documentNumber: [
      '',
      [Validators.required, Validators.minLength(5), Validators.maxLength(32)],
    ],
    password: [
      '',
      [Validators.required, Validators.minLength(12), Validators.pattern(PASSWORD_COMPLEXITY_PATTERN)],
    ],
    confirmPassword: ['', [Validators.required]],
    acceptedTerms: [false, [Validators.requiredTrue]],
  });

  constructor(protected readonly vm: RegisterVm) {
    this.form.controls.documentNumber.addValidators((control) => this.documentNumberValidator(control));
    this.form.controls.documentType.valueChanges.subscribe(() => {
      this.form.controls.documentNumber.updateValueAndValidity({ onlySelf: true });
    });
  }

  get passwordValue(): string {
    return this.form.controls.password.value;
  }

  get hasMinLengthPassword(): boolean {
    return this.passwordValue.length >= 12;
  }

  get hasUpperPassword(): boolean {
    return /[A-Z]/.test(this.passwordValue);
  }

  get hasLowerPassword(): boolean {
    return /[a-z]/.test(this.passwordValue);
  }

  get hasNumberPassword(): boolean {
    return /\d/.test(this.passwordValue);
  }

  get hasSymbolPassword(): boolean {
    return /[^A-Za-z0-9]/.test(this.passwordValue);
  }

  onPasswordInput(): void {
    const confirmControl = this.form.controls.confirmPassword;
    if (!confirmControl.value || !confirmControl.hasError('mismatch')) {
      return;
    }

    if (this.passwordValue === confirmControl.value) {
      const nextErrors = { ...(confirmControl.errors ?? {}) };
      delete nextErrors['mismatch'];
      confirmControl.setErrors(Object.keys(nextErrors).length > 0 ? nextErrors : null);
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    if (raw.password !== raw.confirmPassword) {
      this.form.controls.confirmPassword.setErrors({ mismatch: true });
      return;
    }

    this.vm.submit({
      email: raw.email.trim(),
      phone: raw.phone.trim(),
      password: raw.password,
      full_name: raw.fullName.trim(),
      document_type: raw.documentType,
      document_number: raw.documentNumber.trim(),
      consent: raw.acceptedTerms,
    });
  }

  private documentNumberValidator(control: AbstractControl<string>): ValidationErrors | null {
    const result = validateCountryDocument({
      country: 'CO',
      documentType: this.form.controls.documentType.value,
      documentNumber: control.value,
    });
    return result.valid ? null : { countryDocument: result.error };
  }
}
