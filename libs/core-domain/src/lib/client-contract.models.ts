/** Tipos alineados con Core `ClientContractResponse` (contratos cliente / payroller). */

/** Body `POST /api/v1/client-contracts`. */
export interface ClientContractCreateRequest {
  customer_id: string;
  company_code: string;
  template_contract_id: string;
  terms: Record<string, unknown>;
  business_unit_assignment_id?: string | null;
}

export interface ClientContractDto {
  id: string;
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

/** Alineado con Core `CompanyCodeOptionResponse` (sub-empresas permitidas). */
export interface CompanyCodeOptionDto {
  company_code: string;
  business_name: string;
}
