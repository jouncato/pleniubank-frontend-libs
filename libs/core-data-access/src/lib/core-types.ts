/** Tipos alineados con respuestas Core (préstamos, clientes, cuentas). */

export interface LoanDto {
  id: string;
  version: number;
  account_id: string;
  product_id: string;
  contract_version_id: string | null;
  customer_id: string;
  employer_id: string;
  amount: string;
  denomination: string;
  status: string;
  instance_parameters: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateLoanRequest {
  customer_id: string;
  employer_id: string;
  account_id: string;
  product_id: string;
  amount: string;
  denomination: string;
  instance_parameters: Record<string, unknown>;
}

export interface UpdateLoanRequest {
  version: number;
  status?: string;
  amount?: string;
  denomination?: string;
  instance_parameters?: Record<string, unknown>;
}

export interface PaymentLineDto {
  posting_id: string;
  amount: string;
  denomination: string;
  balance_address: string;
  phase: string;
  booking_timestamp: string;
  type: string;
}

export interface CustomerDto {
  id: string;
  version_id: string;
  version: number;
  is_active: boolean;
  valid_from: string;
  valid_to: string | null;
  created_at: string;
  created_by: string;
  updated_at: string | null;
  updated_by: string | null;
  full_name: string;
  document_type: string;
  document_number: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
}

export interface CreateCustomerRequest {
  full_name: string;
  document_type: string;
  document_number: string;
  customer_id?: string | null;
  email?: string | null;
  phone?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  address?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

export interface UpdateCustomerRequest {
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  address?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
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
  updated_at?: string | null;
  updated_by?: string | null;
  deactivated_at?: string | null;
  deactivated_by?: string | null;
  deactivation_reason?: string | null;
}

export interface ClientContractPatchRequest {
  status?: string | null;
  terms?: Record<string, unknown> | null;
  deactivation_reason?: string | null;
}

/** Body `POST /api/v1/client-contracts` — Core `ClientContractCreateRequest`. */
export interface ClientContractCreateRequest {
  customer_id: string;
  company_code: string;
  template_contract_id: string;
  terms: Record<string, unknown>;
}

/** Opciones de company_code permitidas para el usuario (sub-empresas sincronizadas en Core). */
export interface CompanyCodeOptionDto {
  company_code: string;
  business_name: string;
}

/** Alineado a Core `PrimaryPaymentIdentifierResponse` (v1: solo IBAN en enum BD). */
export type PaymentSchemeV1 = 'IBAN';

export interface PrimaryPaymentIdentifierDto {
  scheme: PaymentSchemeV1;
  display_value_masked: string;
  country_code: string | null;
}

export interface AccountDto {
  id: string;
  version_id: string;
  version: number;
  is_active: boolean;
  valid_from: string;
  valid_to: string | null;
  created_at: string;
  created_by: string;
  updated_at: string | null;
  updated_by: string | null;
  customer_id: string | null;
  product_id: string | null;
  smart_contract_version_id: string | null;
  status: string;
  opening_timestamp: string;
  closing_timestamp: string | null;
  instance_parameters: Record<string, unknown>;
  stakeholder_ids: string[];
  flags: string[];
  account_type: string;
  primary_payment_identifier: PrimaryPaymentIdentifierDto | null;
}

/** Fila de `GET /api/v1/audit/logs` y `GET /api/v1/audit/logs/{id}` (Core audit_schemas). */
export interface AuditLogDto {
  id: string;
  entity_type: string;
  action: string;
  payload: Record<string, unknown> | null;
  correlation_id: string | null;
  created_by: string;
  created_at: string;
}

/** Respuesta plana de `GET /api/v1/health` (no envelope). */
export interface CoreHealthResponse {
  status: string;
  service: string;
  version: string;
  timestamp: string;
}

/** Respuesta plana de `GET /api/v1/readiness`. */
export interface CoreReadinessResponse {
  status: string;
  checks: Record<string, string>;
}

/** Políticas de contrato Nivel 0/1 (`/api/v1/platform/contract-policies`). */
export interface ContractPolicyDefinitionDto {
  id: string;
  param_key: string;
  category: string;
  value_type: string;
  scope: string;
  description: string | null;
  nullable: boolean;
  default_json: unknown;
}

export interface ContractPolicyValueDto {
  id: string;
  definition_id: string;
  level: number;
  product_type: string | null;
  country_code: string | null;
  company_code: string | null;
  value: unknown;
  effective_from: string;
  effective_to: string | null;
  created_by: string;
  updated_by: string | null;
}

export interface ContractPolicyResolveDto {
  policy: Record<string, unknown>;
}

export interface ContractPolicyValueCreateRequest {
  definition_id: string;
  level: number;
  product_type?: string | null;
  country_code?: string | null;
  company_code?: string | null;
  value: unknown;
  effective_from?: string | null;
  effective_to?: string | null;
}

export interface ContractPolicyValuePatchRequest {
  value?: unknown;
  effective_from?: string | null;
  effective_to?: string | null;
  company_code?: string | null;
}
