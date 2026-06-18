/** Business Unit Product Assignment alineados con Core `BusinessUnitAssignmentResponse`. */

export interface BusinessUnitAssignmentDto {
  id: string;
  sub_enterprise_id: string;
  company_code: string;
  template_contract_id: string;
  product_type: string;
  status: string;
  terms: Record<string, unknown>;
  effective_from: string;
  effective_to: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  updated_by: string | null;
}

/** Body `POST /api/v1/business-unit-assignments`. */
export interface BusinessUnitAssignmentCreateRequest {
  sub_enterprise_id: string;
  company_code: string;
  template_contract_id: string;
  terms?: Record<string, unknown>;
  effective_from?: string | null;
  effective_to?: string | null;
}

/** Body `PATCH /api/v1/business-unit-assignments/{id}`. */
export interface BusinessUnitAssignmentPatchRequest {
  status?: string | null;
  terms?: Record<string, unknown> | null;
  effective_to?: string | null;
}
