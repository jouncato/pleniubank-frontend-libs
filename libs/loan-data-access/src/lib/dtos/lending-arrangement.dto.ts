export interface PartyRoleDto {
  id: string;
  version: number;
  lending_arrangement_id: string;
  party_id: string;
  party_type: string;
  role: string;
  role_percentage?: number;
  role_started_at: string;
  role_ended_at?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  created_by: string;
  updated_at?: string;
  updated_by?: string;
}

export interface VersionLinksDto {
  self: string;
  previous?: string | null;
  latest: string;
}

export interface LendingArrangementResponse {
  id: string;
  arrangement_id: string;
  version: number;
  previous_version_id?: string;
  product_id: string;
  product_type: string;
  customer_id: string;
  company_code?: string;
  jurisdiction: string;
  currency: string;
  principal_amount: string;
  nominal_rate?: number;
  rate_type: string;
  day_count_convention: string;
  repayment_frequency: string;
  term_months?: number;
  effective_date: string;
  maturity_date?: string;
  channel?: string;
  status: string;
  status_reason?: string;
  extension_data: Record<string, unknown>;
  party_roles: PartyRoleDto[];
  created_at: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
  correlation_id?: string;
  version_links?: VersionLinksDto;
}

export interface CreateLendingArrangementRequest {
  product_id: string;
  product_type: string;
  customer_id: string;
  borrower_party_id: string;
  company_code?: string;
  jurisdiction: string;
  currency: string;
  principal_amount: string;
  nominal_rate?: number;
  rate_type: string;
  day_count_convention: string;
  repayment_frequency: string;
  term_months?: number;
  effective_date: string;
  maturity_date?: string;
  channel?: string;
  extension_data?: Record<string, unknown>;
  employer_party_id?: string;
  coborrower_party_ids?: string[];
  guarantor_party_ids?: string[];
}

export interface ListLendingArrangementsParams {
  customerId?: string;
  status?: string;
  productType?: string;
  companyCode?: string;
  page?: number;
  pageSize?: number;
}

export interface ListLendingArrangementsMeta {
  total: number;
  cursor: string | null;
  has_more: boolean;
  correlation_id?: string;
}

export interface ListLendingArrangementsResponse {
  data: LendingArrangementResponse[];
  meta: ListLendingArrangementsMeta;
  errors: unknown[];
}
