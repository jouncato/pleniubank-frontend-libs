/** Contract templates alineados con Core `ContractTemplateResponse`. */

export interface ContractTemplateDto {
  id: string;
  company_code: string;
  product_type: string;
  template_name: string;
  config: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
}

/** Body `POST /api/v1/contract-templates` — Core `ContractTemplateCreateRequest`. */
export interface CreateContractTemplateRequest {
  company_code: string;
  product_type: string;
  template_name: string;
  config?: Record<string, unknown>;
}

/** Query `GET /api/v1/contract-templates` (cursor-based). */
export interface ListContractTemplatesParams {
  company_code: string;
  cursor?: string | null;
  limit?: number;
}
