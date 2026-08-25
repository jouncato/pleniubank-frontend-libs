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
import { RegisterDocumentType, validateCountryDocument } from '@pleniu/identity-domain';
import { PbPasswordVisibilityToggleComponent } from '@pleniu/ui';
import { RegisterVm } from '../../vm/register';

const PASSWORD_COMPLEXITY_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;
const PHONE_PATTERN = /^[0-9+\-\s()]{7,20}$/;

export type LegalModalSection = 'terms' | 'data';

const LEGAL_SECTION_ELEMENT_ID: Record<LegalModalSection, string> = {
  terms: 'legal-section-terms',
  data: 'legal-section-data',
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
