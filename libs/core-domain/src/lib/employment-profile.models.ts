/**
 * Pleniu Colombia S.A. — CustomerEmploymentProfile types.
 * Synced with Core API: party.customer_employment_profiles
 */

export type EmploymentStatus = 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';
export type ContractType = 'INDEFINIDO' | 'FIJO' | 'OBRA_LABOR' | 'PRESTACION';

export interface CustomerEmploymentProfile {
  profile_id: string;
  customer_id: string;
  sub_enterprise_id: string;
  company_code: string;
  employment_status: EmploymentStatus;
  job_title: string;
  department: string | null;
  employment_start_date: string;
  employment_end_date: string | null;
  salary_amount: string;
  salary_currency: string;
  contract_type: ContractType | string;
  verification_status: VerificationStatus;
  verified_at: string | null;
  verified_by: string | null;
  salary_verified_at: string | null;
  salary_verified_by: string | null;
  created_at: string;
  created_by: string;
  updated_at: string | null;
}

export interface CustomerEmploymentProfileListResponse {
  items: CustomerEmploymentProfile[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateEmploymentProfileRequest {
  customer_id: string;
  sub_enterprise_id: string;
  company_code: string;
  job_title: string;
  department?: string | null;
  employment_start_date: string;
  salary_amount: number;
  salary_currency?: string;
  contract_type?: ContractType | string;
}

export interface PatchEmploymentProfileRequest {
  job_title?: string;
  department?: string | null;
  employment_start_date?: string;
  salary_amount?: number;
  contract_type?: ContractType | string;
}

export interface TerminateEmploymentProfileRequest {
  end_date?: string | null;
}

export interface VerifyEmploymentProfileRequest {
  certification_reference: string;
}

export interface EmploymentProfileListParams {
  /** Uno o varios ids -- Core acepta múltiples `sub_enterprise_id` en la misma query. */
  sub_enterprise_id: string | string[];
  employment_status?: EmploymentStatus | string;
  verification_status?: VerificationStatus | string;
  limit?: number;
  offset?: number;
}
