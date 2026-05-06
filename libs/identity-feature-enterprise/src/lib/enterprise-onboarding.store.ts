import { Injectable, signal } from '@angular/core';
import {
  EnterpriseDocumentType,
  RegisterEnterprisePersonRequest,
  RegisterEnterpriseRequest,
} from 'identity-domain';

const STORAGE_KEY = 'pleniu_enterprise_onboarding';

export interface EnterpriseOnboardingPersisted {
  wizardStep: number;
  company: {
    business_name: string;
    document_type: EnterpriseDocumentType;
    document_number: string;
    company_email: string;
    company_phone: string;
    /** UUID del sector en Identity `economic_sectors`. */
    economic_sector_id: string;
    sector: string;
  };
  principalEmail: string;
  principalFullName: string;
  adminEmail: string;
  adminFullName: string;
  enterpriseId?: string;
  principalUserId?: string;
  adminUserId?: string;
}

function loadFromStorage(): EnterpriseOnboardingPersisted | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as EnterpriseOnboardingPersisted;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class EnterpriseOnboardingStore {
  private readonly _state = signal<EnterpriseOnboardingPersisted | null>(loadFromStorage());

  readonly state = this._state.asReadonly();

  // Passwords kept in memory only (not persisted to storage for security)
  private readonly _principalPassword = signal<string>('');
  private readonly _adminPassword = signal<string>('');

  readonly principalPassword = this._principalPassword.asReadonly();
  readonly adminPassword = this._adminPassword.asReadonly();

  setPrincipalPassword(password: string): void {
    this._principalPassword.set(password);
  }

  setAdminPassword(password: string): void {
    this._adminPassword.set(password);
  }

  patch(partial: Partial<EnterpriseOnboardingPersisted>): void {
    const prev = this._state();
    const co = prev?.company;
    const next: EnterpriseOnboardingPersisted = {
      wizardStep: partial.wizardStep ?? prev?.wizardStep ?? 0,
      company: {
        business_name: partial.company?.business_name ?? co?.business_name ?? '',
        document_type: partial.company?.document_type ?? co?.document_type ?? 'NIT',
        document_number: partial.company?.document_number ?? co?.document_number ?? '',
        company_email: partial.company?.company_email ?? co?.company_email ?? '',
        company_phone: partial.company?.company_phone ?? co?.company_phone ?? '',
        economic_sector_id: partial.company?.economic_sector_id ?? co?.economic_sector_id ?? '',
        sector: partial.company?.sector ?? co?.sector ?? '',
      },
      principalEmail: partial.principalEmail ?? prev?.principalEmail ?? '',
      principalFullName: partial.principalFullName ?? prev?.principalFullName ?? '',
      adminEmail: partial.adminEmail ?? prev?.adminEmail ?? '',
      adminFullName: partial.adminFullName ?? prev?.adminFullName ?? '',
      enterpriseId: partial.enterpriseId ?? prev?.enterpriseId,
      principalUserId: partial.principalUserId ?? prev?.principalUserId,
      adminUserId: partial.adminUserId ?? prev?.adminUserId,
    };
    this._state.set(next);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  setRegistrationIds(enterpriseId: string, principalUserId: string, adminUserId: string): void {
    this.patch({ enterpriseId, principalUserId, adminUserId });
  }

  clear(): void {
    this._state.set(null);
    sessionStorage.removeItem(STORAGE_KEY);
    this._principalPassword.set('');
    this._adminPassword.set('');
  }

  /** Reset user IDs when starting a new registration to avoid stale data from sessionStorage. */
  resetUserIds(): void {
    this.patch({
      enterpriseId: undefined,
      principalUserId: undefined,
      adminUserId: undefined,
    });
  }

  getPasswords(): { principalPassword: string; adminPassword: string } {
    return {
      principalPassword: this._principalPassword(),
      adminPassword: this._adminPassword(),
    };
  }

  toRegisterRequest(): RegisterEnterpriseRequest {
    const s = this._state();
    if (!s) {
      throw new Error('Enterprise onboarding state missing');
    }
    if (!s.company.economic_sector_id?.trim()) {
      throw new Error('economic_sector_id required');
    }
    const principalPassword = this._principalPassword();
    const adminPassword = this._adminPassword();
    if (!principalPassword || !adminPassword) {
      throw new Error('Passwords required');
    }
    return {
      business_name: s.company.business_name,
      document_type: s.company.document_type,
      document_number: s.company.document_number,
      company_email: s.company.company_email,
      company_phone: s.company.company_phone,
      economic_sector_id: s.company.economic_sector_id.trim(),
      sector: s.company.sector || undefined,
      principal: {
        email: s.principalEmail,
        full_name: s.principalFullName,
        password: principalPassword,
      },
      admin: {
        email: s.adminEmail,
        full_name: s.adminFullName,
        password: adminPassword,
      },
    };
  }
}
