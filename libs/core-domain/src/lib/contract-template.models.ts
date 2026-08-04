/** Contract templates alineados con Core `ContractTemplateResponse`. */

/**
 * ADR-008 (Opción B): exactamente uno de `company_code` (sub-empresa) o
 * `enterprise_id` (Empresa Principal) está poblado, nunca ambos ni ninguno.
 */
export interface ContractTemplateDto {
  id: string;
  company_code?: string | null;
  /** Ancla alternativa a nivel Empresa Principal (ADR-008, Opción B). */
  enterprise_id?: string | null;
  product_type: string;
  template_name: string;
  config: Record<string, unknown>;
  /** Gap 1 (20260804_1000): hash de la política vigente (pa-policy-*). */
  policy_version?: string | null;
  is_active: boolean;
  created_at: string;
}

/** Body `POST /api/v1/contract-templates` — Core `ContractTemplateCreateRequest`. */
export interface CreateContractTemplateRequest {
  company_code?: string | null;
  /** Ancla alternativa a nivel Empresa Principal (ADR-008, Opción B). */
  enterprise_id?: string | null;
  product_type: string;
  template_name: string;
  config?: Record<string, unknown>;
  /** Opcional -- si se omite, Core lo resuelve desde la política vigente. */
  policy_version?: string | null;
}

/** Query `GET /api/v1/contract-templates` (cursor-based). */
export interface ListContractTemplatesParams {
  company_code?: string | null;
  /** Ancla alternativa a nivel Empresa Principal (ADR-008, Opción B). */
  enterprise_id?: string | null;
  cursor?: string | null;
  limit?: number;
}
