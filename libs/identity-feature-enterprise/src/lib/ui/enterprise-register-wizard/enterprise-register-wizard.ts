import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EconomicSectorPublicDto, EnterpriseDocumentType, validateCountryDocument } from '@pleniu/identity-domain';
import { IdentityEnterpriseApiService } from '@pleniu/identity-data-access';
import { CUSTOMER_PORTAL_SIGN_IN_URL, EMBEDDED_PORTAL_IDENTITY_CHROME } from '@pleniu/shared-auth';
import { PbLogoComponent } from '@pleniu/ui';
import { EnterpriseOnboardingStore } from '../../enterprise-onboarding.store';
import { RegisterEnterpriseVm, type RegisterEnterpriseStep } from '../../vm/register-enterprise';

const ENTERPRISE_PASSWORD_MIN_LENGTH = 12;
const ENTERPRISE_PASSWORD_COMPLEXITY_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

@Component({
  selector: 'lib-enterprise-register-wizard',
  imports: [ReactiveFormsModule, RouterLink, PbLogoComponent],
  templateUrl: './enterprise-register-wizard.html',
  styleUrl: './enterprise-register-wizard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnterpriseRegisterWizard implements OnInit {
  private readonly fb = inject(FormBuilder);
  protected readonly vm = inject(RegisterEnterpriseVm);
  readonly customerSignInUrl = inject(CUSTOMER_PORTAL_SIGN_IN_URL);
  readonly embeddedHostShell = inject(EMBEDDED_PORTAL_IDENTITY_CHROME, { optional: true }) === true;
  protected readonly onboarding = inject(EnterpriseOnboardingStore);
  private readonly enterpriseApi = inject(IdentityEnterpriseApiService);

  readonly stepLabels = ['Empresa', 'Principal', 'Administrador', 'Confirmar'] as const;

  readonly documentTypes: EnterpriseDocumentType[] = ['NIT', 'CC', 'CE', 'PP', 'TI'];
  readonly sectors = signal<EconomicSectorPublicDto[]>([]);
  readonly sectorsError = signal<string | null>(null);
  private readonly companyStep0Fields = [
    'business_name',
    'document_type',
    'document_number',
    'company_phone',
    'economic_sector_id',
  ] as const;

  readonly companyForm = this.fb.nonNullable.group({
    business_name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
    document_type: this.fb.nonNullable.control<EnterpriseDocumentType>('NIT', Validators.required),
    document_number: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(32)]],
    company_email: ['', [Validators.required, Validators.email]],
    company_phone: ['', [Validators.required, Validators.minLength(7), Validators.maxLength(64)]],
    economic_sector_id: ['', Validators.required],
  });

  readonly principalForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    full_name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(ENTERPRISE_PASSWORD_MIN_LENGTH),
        Validators.pattern(ENTERPRISE_PASSWORD_COMPLEXITY_PATTERN),
      ],
    ],
  });

  readonly adminForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    full_name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(ENTERPRISE_PASSWORD_MIN_LENGTH),
        Validators.pattern(ENTERPRISE_PASSWORD_COMPLEXITY_PATTERN),
      ],
    ],
  });

  confirmCorrect = false;

  onConfirmChange(ev: Event): void {
    const t = ev.target as HTMLInputElement | null;
    this.confirmCorrect = Boolean(t?.checked);
  }

  constructor() {
    this.companyForm.controls.document_number.addValidators((control) => this.companyDocumentNumberValidator(control));
    this.companyForm.controls.document_type.valueChanges.subscribe(() => {
      this.companyForm.controls.document_number.updateValueAndValidity({ onlySelf: true });
    });

    const s = this.onboarding.state();
    if (s) {
      this.companyForm.patchValue({
        business_name: s.company.business_name,
        document_type: s.company.document_type,
        document_number: s.company.document_number,
        company_email: s.company.company_email,
        company_phone: s.company.company_phone,
        economic_sector_id: s.company.economic_sector_id ?? '',
      });
      this.principalForm.patchValue({
        email: s.principalEmail,
        full_name: s.principalFullName,
      });
      this.adminForm.patchValue({
        email: s.adminEmail,
        full_name: s.adminFullName,
      });
    }
  }

  private companyDocumentNumberValidator(control: AbstractControl<string>): ValidationErrors | null {
    const result = validateCountryDocument({
      country: 'CO',
      documentType: this.companyForm.controls.document_type.value,
      documentNumber: control.value,
    });
    return result.valid ? null : { countryDocument: result.error };
  }

  ngOnInit(): void {
    this.loadSectors();
  }

  loadSectors(): void {
    this.sectorsError.set(null);
    this.enterpriseApi.listPublicEconomicSectors().subscribe({
      next: (env) => this.sectors.set(env.data ?? []),
      error: () => this.sectorsError.set('No se pudo cargar el catálogo de sectores.'),
    });
  }

  get step(): number {
    return this.vm.currentStep();
  }

  get principalPasswordValue(): string {
    return this.principalForm.controls.password.value;
  }

  get principalHasMinLengthPassword(): boolean {
    return this.principalPasswordValue.length >= ENTERPRISE_PASSWORD_MIN_LENGTH;
  }

  get principalHasUpperPassword(): boolean {
    return /[A-Z]/.test(this.principalPasswordValue);
  }

  get principalHasLowerPassword(): boolean {
    return /[a-z]/.test(this.principalPasswordValue);
  }

  get principalHasNumberPassword(): boolean {
    return /\d/.test(this.principalPasswordValue);
  }

  get principalHasSymbolPassword(): boolean {
    return /[^A-Za-z0-9]/.test(this.principalPasswordValue);
  }

  get adminPasswordValue(): string {
    return this.adminForm.controls.password.value;
  }

  get adminHasMinLengthPassword(): boolean {
    return this.adminPasswordValue.length >= ENTERPRISE_PASSWORD_MIN_LENGTH;
  }

  get adminHasUpperPassword(): boolean {
    return /[A-Z]/.test(this.adminPasswordValue);
  }

  get adminHasLowerPassword(): boolean {
    return /[a-z]/.test(this.adminPasswordValue);
  }

  get adminHasNumberPassword(): boolean {
    return /\d/.test(this.adminPasswordValue);
  }

  get adminHasSymbolPassword(): boolean {
    return /[^A-Za-z0-9]/.test(this.adminPasswordValue);
  }

  isCompanyStep0Invalid(): boolean {
    return this.companyStep0Fields.some((field) => this.companyForm.controls[field].invalid);
  }

  nextFromCompany(): void {
    if (this.isCompanyStep0Invalid()) {
      for (const field of this.companyStep0Fields) {
        this.companyForm.controls[field].markAsTouched();
      }
      return;
    }
    const v = this.companyForm.getRawValue();
    const selected = this.sectors().find((x) => x.sector_id === v.economic_sector_id);
    this.onboarding.patch({
      wizardStep: 1,
      company: {
        business_name: v.business_name,
        document_type: v.document_type,
        document_number: v.document_number,
        company_email: v.company_email,
        company_phone: v.company_phone,
        economic_sector_id: v.economic_sector_id,
        sector: selected?.label_es ?? '',
      },
    });
    this.vm.next();
  }

  nextFromPrincipal(): void {
    if (this.principalForm.invalid) {
      this.principalForm.markAllAsTouched();
      return;
    }
    const v = this.principalForm.getRawValue();
    this.onboarding.patch({
      wizardStep: 2,
      principalEmail: v.email,
      principalFullName: v.full_name,
    });
    // Store password in memory (not persisted to storage for security)
    this.onboarding.setPrincipalPassword(v.password);
    this.vm.next();
  }

  nextFromAdmin(): void {
    if (this.adminForm.invalid) {
      this.adminForm.markAllAsTouched();
      return;
    }
    const v = this.adminForm.getRawValue();
    this.onboarding.patch({
      wizardStep: 3,
      adminEmail: v.email,
      adminFullName: v.full_name,
    });
    // Store password in memory (not persisted to storage for security)
    this.onboarding.setAdminPassword(v.password);
    this.vm.next();
  }

  prev(): void {
    this.vm.prev();
  }

  /** Volver a un paso anterior desde el stepper (solo hacia atrás). */
  goToStep(target: number): void {
    if (target < 0 || target > 3 || target >= this.step) {
      return;
    }
    this.vm.setStep(target as RegisterEnterpriseStep);
  }

  continueToVerification(): void {
    this.vm.continueToEmailVerification();
  }

  /** Sincroniza sessionStorage con los formularios antes del POST (paso confirmación de solo lectura). */
  private persistAllFromFormsForSubmit(): void {
    const cv = this.companyForm.getRawValue();
    const selected = this.sectors().find((x) => x.sector_id === cv.economic_sector_id);
    const pv = this.principalForm.getRawValue();
    const av = this.adminForm.getRawValue();
    this.onboarding.patch({
      wizardStep: 3,
      company: {
        business_name: cv.business_name,
        document_type: cv.document_type,
        document_number: cv.document_number,
        company_email: cv.company_email,
        company_phone: cv.company_phone,
        economic_sector_id: cv.economic_sector_id,
        sector: selected?.label_es ?? '',
      },
      principalEmail: pv.email,
      principalFullName: pv.full_name,
      adminEmail: av.email,
      adminFullName: av.full_name,
    });
    // Store passwords in memory for the submit (not persisted to storage for security)
    this.onboarding.setPrincipalPassword(pv.password);
    this.onboarding.setAdminPassword(av.password);
  }

  submit(): void {
    if (!this.confirmCorrect) {
      console.warn('[EnterpriseRegisterWizard] Submit blocked: confirmCorrect is false');
      this.vm.errorMessage.set('Debes confirmar que los datos son correctos.');
      return;
    }
    const principalPasswordOk = this.principalForm.controls.password.valid;
    const adminPasswordOk = this.adminForm.controls.password.valid;

    // Check for missing company_email (old sessionStorage data)
    const companyEmailValue = this.companyForm.controls.company_email.value;
    if (!companyEmailValue || !companyEmailValue.trim()) {
      console.error('[EnterpriseRegisterWizard] Missing company_email - likely old sessionStorage data');
      this.vm.errorMessage.set('Falta el correo de la empresa. Vuelve al paso 1 para completarlo.');
      return;
    }

    // Identify specific validation failures
    const failedFields: string[] = [];
    const passwordErrors: string[] = [];

    if (this.companyForm.controls.business_name.invalid) failedFields.push('Razón social');
    if (this.companyForm.controls.document_type.invalid) failedFields.push('Tipo de documento');
    if (this.companyForm.controls.document_number.invalid) failedFields.push('Número de documento');
    if (this.companyForm.controls.company_email.invalid) failedFields.push('Correo empresa');
    if (this.companyForm.controls.company_phone.invalid) failedFields.push('Teléfono empresa');
    if (this.companyForm.controls.economic_sector_id.invalid) failedFields.push('Sector económico');
    if (this.principalForm.controls.email.invalid) failedFields.push('Correo del representante');
    if (this.principalForm.controls.full_name.invalid) failedFields.push('Nombre del representante');

    // Detailed password validation messages
    if (!principalPasswordOk) {
      const pwd = this.principalPasswordValue;
      const missing: string[] = [];
      if (pwd.length < ENTERPRISE_PASSWORD_MIN_LENGTH) missing.push(`mínimo ${ENTERPRISE_PASSWORD_MIN_LENGTH} caracteres`);
      if (!/[A-Z]/.test(pwd)) missing.push('una mayúscula');
      if (!/[a-z]/.test(pwd)) missing.push('una minúscula');
      if (!/\d/.test(pwd)) missing.push('un número');
      if (!/[^A-Za-z0-9]/.test(pwd)) missing.push('un símbolo');
      if (missing.length > 0) {
        passwordErrors.push(`Contraseña del representante: falta ${missing.join(', ')}`);
      }
      failedFields.push('Contraseña del representante');
    }

    if (this.adminForm.controls.email.invalid) failedFields.push('Correo del administrador');
    if (this.adminForm.controls.full_name.invalid) failedFields.push('Nombre del administrador');

    if (!adminPasswordOk) {
      const pwd = this.adminPasswordValue;
      const missing: string[] = [];
      if (pwd.length < ENTERPRISE_PASSWORD_MIN_LENGTH) missing.push(`mínimo ${ENTERPRISE_PASSWORD_MIN_LENGTH} caracteres`);
      if (!/[A-Z]/.test(pwd)) missing.push('una mayúscula');
      if (!/[a-z]/.test(pwd)) missing.push('una minúscula');
      if (!/\d/.test(pwd)) missing.push('un número');
      if (!/[^A-Za-z0-9]/.test(pwd)) missing.push('un símbolo');
      if (missing.length > 0) {
        passwordErrors.push(`Contraseña del administrador: falta ${missing.join(', ')}`);
      }
      failedFields.push('Contraseña del administrador');
    }

    if (failedFields.length > 0) {
      this.companyForm.markAllAsTouched();
      this.principalForm.markAllAsTouched();
      this.adminForm.markAllAsTouched();
      console.warn('[EnterpriseRegisterWizard] Submit blocked: validation failed for fields:', failedFields, 'Password errors:', passwordErrors);
      // Show specific password errors if any, otherwise generic message
      const errorMsg = passwordErrors.length > 0
        ? passwordErrors.join('. ')
        : `Revisa los siguientes campos: ${failedFields.join(', ')}`;
      this.vm.errorMessage.set(errorMsg);
      return;
    }
    this.persistAllFromFormsForSubmit();
    const p = this.principalForm.getRawValue();
    const a = this.adminForm.getRawValue();
    this.vm.submit(
      { email: p.email, full_name: p.full_name, password: p.password },
      { email: a.email, full_name: a.full_name, password: a.password },
    );
  }
}
