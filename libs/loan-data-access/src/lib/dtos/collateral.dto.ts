export interface CollateralResponse {
  id: string;
  version: number;
  lending_arrangement_id: string;
  collateral_type: string;
  description?: string;
  value_amount?: string;
  value_currency?: string;
  valuation_date?: string;
  perfection_status: string;
  perfection_ref?: string;
  metadata: Record<string, unknown>;
  released_at?: string;
  created_at: string;
  created_by: string;
  updated_at?: string;
  updated_by?: string;
}

export interface AddCollateralRequest {
  collateral_type: string;
  description?: string;
  value_amount?: string;
  value_currency?: string;
  valuation_date?: string;
  perfection_status?: string;
  perfection_ref?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateCollateralRequest {
  description?: string;
  value_amount?: string;
  value_currency?: string;
  valuation_date?: string;
  perfection_status?: string;
  perfection_ref?: string;
  metadata?: Record<string, unknown>;
}
