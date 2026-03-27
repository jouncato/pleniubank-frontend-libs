import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EnterpriseDocumentType } from 'identity-domain';
import { EnterpriseOnboardingStore } from '../../enterprise-onboarding.store';
import { RegisterEnterpriseVm } from '../../vm/register-enterprise';

@Component({
  selector: 'lib-enterprise-register-wizard',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './enterprise-register-wizard.html',
  styleUrl: './enterprise-register-wizard.scss',
})
export class EnterpriseRegisterWizard {
  private readonly fb = inject(FormBuilder);
  protected readonly vm = inject(RegisterEnterpriseVm);
  private readonly onboarding = inject(EnterpriseOnboardingStore);

  readonly documentTypes: EnterpriseDocumentType[] = ['NIT', 'CC', 'CE', 'PP', 'TI'];

  readonly companyForm = this.fb.nonNullable.group({
    business_name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
    document_type: this.fb.nonNullable.control<EnterpriseDocumentType>('NIT', Validators.required),
    document_number: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(32)]],
    company_email: ['', [Validators.required, Validators.email]],
    company_phone: ['', [Validators.required, Validators.minLength(7), Validators.maxLength(64)]],
    sector: [''],
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
        sector: s.company.sector,
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

  get step(): number {
    return this.vm.currentStep();
  }

  nextFromCompany(): void {
    if (this.companyForm.invalid) {
      this.companyForm.markAllAsTouched();
      return;
    }
    const v = this.companyForm.getRawValue();
    this.onboarding.patch({
      wizardStep: 1,
      company: {
        business_name: v.business_name,
        document_type: v.document_type,
        document_number: v.document_number,
        company_email: v.company_email,
        company_phone: v.company_phone,
        sector: v.sector ?? '',
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

  submit(): void {
    if (!this.confirmCorrect) {
      return;
    }
    if (this.principalForm.invalid || this.adminForm.invalid) {
      this.principalForm.markAllAsTouched();
      this.adminForm.markAllAsTouched();
      return;
    }
    const p = this.principalForm.getRawValue();
    const a = this.adminForm.getRawValue();
    this.vm.submit(
      { email: p.email, full_name: p.full_name, password: p.password },
      { email: a.email, full_name: a.full_name, password: a.password },
    );
  }
}
