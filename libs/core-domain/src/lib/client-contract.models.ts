/** Tipos alineados con Core `ClientContractResponse` (contratos cliente / payroller). */

/** Body `POST /api/v1/client-contracts`. */
export interface ClientContractCreateRequest {
  customer_id: string;
  company_code: string;
  template_contract_id: string;
  terms: Record<string, unknown>;
  /** FK a BusinessUnitProductAssignment. Obligatorio (ADR-012). */
  business_unit_assignment_id: string;
}

export interface ClientContractDto {
  id: string;
  /** FK a BusinessUnitProductAssignment (Nivel 2 jerarquía ADR-012). */
  business_unit_assignment_id?: string | null;
  customer_id: string;
  company_code: string;
  template_contract_id: string;
  /** product_type of the linked contract_template; enriched server-side. */
  product_type?: string | null;
  terms: Record<string, unknown>;
  status: string;
  correlation_id: string | null;
  created_at: string;
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
}
