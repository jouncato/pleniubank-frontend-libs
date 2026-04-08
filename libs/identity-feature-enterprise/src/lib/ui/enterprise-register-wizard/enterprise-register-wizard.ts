import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EconomicSectorPublicDto, EnterpriseDocumentType } from 'identity-domain';
import { IdentityEnterpriseApiService } from 'identity-data-access';
import { CUSTOMER_PORTAL_SIGN_IN_URL } from 'shared-auth';
import { PbLogoComponent } from 'ui';
import { EnterpriseOnboardingStore } from '../../enterprise-onboarding.store';
import { RegisterEnterpriseVm, type RegisterEnterpriseStep } from '../../vm/register-enterprise';

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
  private readonly onboarding = inject(EnterpriseOnboardingStore);
  private readonly enterpriseApi = inject(IdentityEnterpriseApiService);

  readonly stepLabels = ['Empresa', 'Principal', 'Administrador', 'Confirmar'] as const;

  readonly documentTypes: EnterpriseDocumentType[] = ['NIT', 'CC', 'CE', 'PP', 'TI'];
  readonly sectors = signal<EconomicSectorPublicDto[]>([]);
  readonly sectorsError = signal<string | null>(null);

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
    password: ['', [Validators.required, Validators.minLength(12)]],
  });

  readonly adminForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    full_name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
    password: ['', [Validators.required, Validators.minLength(12)]],
  });

  confirmCorrect = false;

  onConfirmChange(ev: Event): void {
    const t = ev.target as HTMLInputElement | null;
    this.confirmCorrect = Boolean(t?.checked);
  }

  constructor() {
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
        password: '',
      });
      this.adminForm.patchValue({
        email: s.adminEmail,
        full_name: s.adminFullName,
        password: '',
      });
    }
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

  nextFromCompany(): void {
    if (this.companyForm.invalid) {
      this.companyForm.markAllAsTouched();
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

  /** Sincroniza sessionStorage con los formularios antes del POST (paso confirmación editable). */
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
  }

  submit(): void {
    if (!this.confirmCorrect) {
      return;
    }
    if (this.companyForm.invalid || this.principalForm.invalid || this.adminForm.invalid) {
      this.companyForm.markAllAsTouched();
      this.principalForm.markAllAsTouched();
      this.adminForm.markAllAsTouched();
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
