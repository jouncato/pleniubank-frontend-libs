/** Tipos alineados con Core `ClientContractResponse` (contratos cliente / payroller). */

/** Body `POST /api/v1/client-contracts`. */
export interface ClientContractCreateRequest {
  customer_id: string;
  company_code: string;
  template_contract_id: string;
  terms: Record<string, unknown>;
}

export interface ClientContractDto {
  id: string;
  customer_id: string;
  company_code: string;
  template_contract_id: string;
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
