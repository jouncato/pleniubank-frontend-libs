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
  /**
   * Linaje de contrato maestro (ADR-008) ya presente en la respuesta real de
   * `BusinessUnitAssignmentResponse` (`master_assignment_id = id` cuando el
   * origen es un contrato maestro), pero faltaba en este tipo -- auditoría
   * 2026-08-11, necesario para detectar si el empleado ya aceptó esta
   * propuesta (`ClientContractDto.master_assignment_id`).
   */
  master_contract_id?: string | null;
  master_assignment_id?: string | null;
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
