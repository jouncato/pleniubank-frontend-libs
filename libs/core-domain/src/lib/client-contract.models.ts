/** Tipos alineados con Core `ClientContractResponse` (contratos cliente / payroller). */

/**
 * Body `POST /api/v1/client-contracts`.
 * ADR-008 (Opción B): exactamente uno de `company_code` (+ `business_unit_assignment_id`
 * obligatorio, camino sub-empresa/ADR-012) o `enterprise_id` (camino Empresa Principal,
 * sin BU assignment ni `customer_id` obligatorios).
 */
export interface ClientContractCreateRequest {
  customer_id?: string | null;
  company_code?: string | null;
  /** Ancla alternativa a nivel Empresa Principal (ADR-008, Opción B). */
  enterprise_id?: string | null;
  template_contract_id: string;
  terms: Record<string, unknown>;
  /** FK a BusinessUnitProductAssignment. Obligatorio junto a company_code (ADR-012); no aplica con enterprise_id. */
  business_unit_assignment_id?: string | null;
  /** Approved ADR-008 master contract lineage. */
  master_contract_id?: string | null;
  master_assignment_id?: string | null;
}

export interface ClientContractDto {
  id: string;
  /** Approved ADR-008 master contract assigned to the employee enrollment. */
  master_contract_id?: string | null;
  master_assignment_id?: string | null;
  /** FK a BusinessUnitProductAssignment (Nivel 2 jerarquía ADR-012). */
  business_unit_assignment_id?: string | null;
  /** Ancla alternativa a nivel Empresa Principal (ADR-008, Opción B). */
  enterprise_id?: string | null;
  customer_id?: string | null;
  company_code?: string | null;
  template_contract_id: string;
  /** product_type of the linked contract_template; enriched server-side. */
  product_type?: string | null;
  /** Append-only enrolment-to-arrangement synchronization state. */
  sync_status?: 'SYNC_PENDING' | 'SYNC_SUCCEEDED' | 'SYNC_FAILED' | 'LEGACY_UNKNOWN' | string | null;
  sync_attempt_count?: number;
  sync_last_error?: string | null;
  sync_next_retry_at?: string | null;
  synced_arrangement_id?: string | null;
  terms: Record<string, unknown>;
  status: string;
  correlation_id: string | null;
  created_at: string;
  updated_at?: string | null;
  updated_by?: string | null;
  deactivated_at?: string | null;
  deactivated_by?: string | null;
  deactivation_reason?: string | null;
}

/** Body `POST /api/v1/client-contracts/from-proposal`. */
export interface ClientContractFromProposalRequest {
  sub_enterprise_id: string;
  accepted_at?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
}

/** Alineado con Core `CompanyCodeOptionResponse` (sub-empresas permitidas). */
export interface CompanyCodeOptionDto {
  company_code: string;
  business_name: string;
  /** Empresa Principal dueña de esta sub-empresa; ya la envía el backend. */
  enterprise_id?: string | null;
  enterprise_name?: string | null;
}
