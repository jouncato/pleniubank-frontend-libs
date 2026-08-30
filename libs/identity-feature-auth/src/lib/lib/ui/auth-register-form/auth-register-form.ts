import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  OnInit,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { normalizeCountryDocument, RegisterDocumentType, validateCountryDocument } from '@pleniu/identity-domain';
import { PbPasswordVisibilityToggleComponent } from '@pleniu/ui';
import { RegisterVm } from '../../vm/register';

const PASSWORD_COMPLEXITY_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;
// Code review externo 2026-08-26: alineado al contrato real del backend
// (_PHONE_RE en pleniubank-identity-service) -- exige al menos un digito y
// permite hasta 64 caracteres, no 20.
const PHONE_PATTERN = /^(?=.*\d)[0-9+\-\s()]{7,64}$/;

export type LegalModalSection = 'terms';

const LEGAL_SECTION_ELEMENT_ID: Record<LegalModalSection, string> = {
  terms: 'legal-section-terms',
};

@Component({
  selector: 'lib-auth-register-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, PbPasswordVisibilityToggleComponent],
  templateUrl: './auth-register-form.html',
  styleUrl: './auth-register-form.scss',
})
export class AuthRegisterForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly injector = inject(Injector);
  readonly legalModalOpen = signal(false);
  readonly legalModalSection = signal<LegalModalSection | null>(null);
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  readonly documentTypeOptions: ReadonlyArray<{ value: RegisterDocumentType; label: string }> = [
    { value: 'CC', label: 'Cedula de ciudadania (CC)' },
    { value: 'CE', label: 'Cedula de extranjeria (CE)' },
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

  /** Cuenta cuántos criterios de la contraseña se cumplen (0-5), para el medidor visual de fuerza. */
  get passwordStrength(): number {
    return [
      this.hasMinLengthPassword,
      this.hasUpperPassword,
      this.hasLowerPassword,
      this.hasNumberPassword,
      this.hasSymbolPassword,
    ].filter(Boolean).length;
  }

  get validationSummary(): string[] {
    const fields = [
      ['fullName', 'Nombre completo'],
      ['email', 'Correo electrónico'],
      ['phone', 'Teléfono celular'],
      ['documentType', 'Tipo de documento'],
      ['documentNumber', 'Número de documento'],
      ['password', 'Contraseña'],
      ['confirmPassword', 'Confirmar contraseña'],
      ['acceptedTerms', 'Términos y condiciones'],
    ] as const;
    return fields
      .filter(([control]) => this.form.controls[control].invalid)
      .map(([, label]) => label);
  }

  documentNumberErrorMessage(): string {
    const control = this.form.controls.documentNumber;
    if (control.hasError('required')) return 'El número de documento es obligatorio.';
    if (control.hasError('minlength')) return 'El número de documento debe tener al menos 5 caracteres.';
    if (control.hasError('maxlength')) return 'El número de documento no puede superar 32 caracteres.';
    if (this.form.controls.documentType.value === 'CC' || this.form.controls.documentType.value === 'TI') {
      return 'Para este tipo usa entre 5 y 12 dígitos.';
    }
    if (this.form.controls.documentType.value === 'CE') {
      return 'Para este tipo usa entre 5 y 12 caracteres alfanuméricos.';
    }
    return 'Para pasaporte usa entre 5 y 16 caracteres alfanuméricos.';
  }

  passwordErrorMessage(): string {
    const control = this.form.controls.password;
    if (control.hasError('required')) return 'La contraseña es obligatoria.';
    return 'Debe tener mínimo 12 caracteres, una mayúscula, una minúscula, un número y un símbolo.';
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

  ngOnInit(): void {
    const params = this.route.snapshot.queryParams as Record<string, string | undefined>;
    this.vm.loadQueryParams(params);
    const inviteEmail = this.vm.inviteEmail();
    if (inviteEmail) {
      this.form.patchValue({ email: inviteEmail });
      this.form.controls.email.disable();
    }
  }

  openLegalModal(section: LegalModalSection): void {
    this.legalModalSection.set(section);
    this.legalModalOpen.set(true);
    afterNextRender(
      () => {
        document
          .getElementById(LEGAL_SECTION_ELEMENT_ID[section])
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      },
      { injector: this.injector },
    );
  }

  closeLegalModal(): void {
    this.legalModalOpen.set(false);
    this.legalModalSection.set(null);
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
      document_number: normalizeCountryDocument(raw.documentNumber),
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
