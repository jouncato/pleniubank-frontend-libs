export interface ContractFeeResponse {
  id: string;
  version: number;
  lending_arrangement_id: string;
  fee_type: string;
  calculation_basis: string;
  amount?: string;
  percentage?: string;
  currency: string;
  charge_frequency: string;
  effective_from: string;
  effective_to?: string;
  regulatory_ref?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  created_by: string;
  updated_at?: string;
  updated_by?: string;
}

export interface AddFeeRequest {
  fee_type: string;
  calculation_basis: string;
  amount?: string;
  percentage?: string;
  currency: string;
  charge_frequency: string;
  effective_from: string;
  effective_to?: string;
  regulatory_ref?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateFeeRequest {
  amount?: string;
  percentage?: string;
  effective_to?: string;
  regulatory_ref?: string;
  metadata?: Record<string, unknown>;
}
