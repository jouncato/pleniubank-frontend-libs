/** Tipos alineados con respuestas Core (préstamos, clientes, cuentas). */

/**
 * @deprecated Since v0.5.0. Use `LendingArrangementResponseDto` from `@pleniu/loan-data-access` instead.
 * Sunset: 2026-12-31. See `docs/migration/libranza-to-lending-arrangement.md`.
 */
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

/**
 * @deprecated Since v0.5.0. Use `CreateLendingArrangementDto` from `@pleniu/loan-data-access` instead.
 * Sunset: 2026-12-31. See `docs/migration/libranza-to-lending-arrangement.md`.
 */
export interface CreateLoanRequest {
  customer_id: string;
  employer_id: string;
  account_id: string;
  product_id: string;
  amount: string;
  denomination: string;
  instance_parameters: Record<string, unknown>;
}

/**
 * @deprecated Since v0.5.0. Use `UpdateLendingArrangementDto` from `@pleniu/loan-data-access` instead.
 * Sunset: 2026-12-31. See `docs/migration/libranza-to-lending-arrangement.md`.
 */
export interface UpdateLoanRequest {
  version: number;
  status?: string;
  amount?: string;
  denomination?: string;
  instance_parameters?: Record<string, unknown>;
}

/**
 * @deprecated Since v0.5.0. Use `PaymentDto` from `@pleniu/loan-data-access` instead.
 * Sunset: 2026-12-31. See `docs/migration/libranza-to-lending-arrangement.md`.
 */
export interface PaymentLineDto {
  posting_id: string;
  amount: string;
  denomination: string;
  balance_address: string;
  phase: string;
  booking_timestamp: string;
  type: string;
}

/**
 * @deprecated Since v0.6.0. Use `CustomerDto` from `core-domain` instead.
 * Sunset: 2027-03-01.
 */
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

/**
 * @deprecated Since v0.6.0. Use `CreateCustomerRequest` from `core-domain` instead.
 * Sunset: 2027-03-01.
 */
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

/**
 * @deprecated Since v0.6.0. Use `UpdateCustomerRequest` from `core-domain` instead.
 * Sunset: 2027-03-01.
 */
export interface UpdateCustomerRequest {
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  address?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * @deprecated Since v0.6.0. Use `ClientContractDto` from `core-domain` instead.
 * Sunset: 2027-03-01.
 */
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

/**
 * @deprecated Since v0.6.0. Use `ClientContractPatchRequest` from `core-domain` instead.
 * Sunset: 2027-03-01.
 */
export interface ClientContractPatchRequest {
  status?: string | null;
  terms?: Record<string, unknown> | null;
  deactivation_reason?: string | null;
}

/**
 * @deprecated Since v0.6.0. Use `ClientContractCreateRequest` from `core-domain` instead.
 * Sunset: 2027-03-01. Body `POST /api/v1/client-contracts` — Core `ClientContractCreateRequest`.
 */
export interface ClientContractCreateRequest {
  customer_id: string;
  company_code: string;
  template_contract_id: string;
  terms: Record<string, unknown>;
}

/** Historial crediticio del cliente (GET /customers/{id}/credit-history). */
export interface CustomerCreditHistoryDto {
  customer_id: string;
  total_advances_count: number;
  total_advances_settled: number;
  total_advances_defaulted: number;
  total_amount_borrowed: number;
  total_amount_repaid: number;
  avg_days_late: number;
  max_days_late: number;
  on_time_payment_rate: number;
  internal_credit_score: number | null;
  risk_category: string | null;
  first_advance_date: string | null;
  last_advance_date: string | null;
  last_settlement_date: string | null;
  last_default_date: string | null;
}

/** Opciones de company_code permitidas para el usuario (sub-empresas sincronizadas en Core). */
export interface CompanyCodeOptionDto {
  company_code: string;
  business_name: string;
}

/** Distribución de clientes por categoría de riesgo crediticio. */
export interface RiskDistributionDto {
  LOW: number;
  MEDIUM: number;
  HIGH: number;
  VERY_HIGH: number;
  unknown: number;
}

/** Resumen de elegibilidad por empresa (LB-ST-125). Fuente: GET /client-contracts/eligibility-summary */
export interface EligibilitySummaryDto {
  company_code: string;
  total_active_contracts: number;
  customers_with_credit_history: number;
  avg_internal_score: number;
  total_settled: number;
  total_defaults: number;
  risk_distribution: RiskDistributionDto;
}

/**
 * @deprecated Since v0.6.0. Use `PaymentSchemeV1` from `core-domain` instead.
 * Sunset: 2027-03-01.
 */
export type PaymentSchemeV1 = 'IBAN';

/**
 * @deprecated Since v0.6.0. Use `PrimaryPaymentIdentifierDto` from `core-domain` instead.
 * Sunset: 2027-03-01.
 */
export interface PrimaryPaymentIdentifierDto {
  scheme: PaymentSchemeV1;
  display_value_masked: string;
  country_code: string | null;
}

/**
 * @deprecated Since v0.6.0. Use `AccountDto` from `core-domain` instead.
 * Sunset: 2027-03-01.
 */
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

export interface ContractPolicyValueBatchItem {
  definition_id: string;
  value: unknown;
}

export interface ContractPolicyValueBatchCreateRequest {
  values: ContractPolicyValueBatchItem[];
  level: number;
  product_type?: string | null;
  country_code?: string | null;
  company_code?: string | null;
  effective_from?: string | null;
  effective_to?: string | null;
}

export interface ContractPolicyValuePatchRequest {
  value?: unknown;
  effective_from?: string | null;
  effective_to?: string | null;
  company_code?: string | null;
  country_code?: string | null;
  product_type?: string | null;
}

/** `GET/POST .../definitions/{id}/rule-links` — metadato gobierno/UI (no participa en resolución). */
export interface ContractPolicyRuleLinkDto {
  id: string;
  definition_id: string;
  ruleset_code: string;
  rule_code: string | null;
  relation_type: string;
  notes: string | null;
  /** Solo en respuesta POST: avisos best-effort (rules-engine); no bloquean el guardado. */
  validation_warnings?: string[];
}

export interface ContractPolicyRuleLinkCreateRequest {
  ruleset_code: string;
  rule_code?: string | null;
  relation_type?: string;
  notes?: string | null;
}

/**
 * `GET .../contract-policies/bindings?ruleset_code=X` — flattened view of
 * `contract_policy_rule_links` joined with the definition's `param_key`, used
 * by the backoffice to show "this ruleset consumes N policies" and to power
 * the "orphan policy" filter in the catalog.
 */
export interface ContractPolicyBindingDto {
  link_id: string;
  definition_id: string;
  param_key: string;
  ruleset_code: string;
  rule_code: string;
  relation_type: string;
  notes: string | null;
}

/** Body `POST .../contract-policies/preview`. */
export interface ContractPolicyPreviewRequest {
  product_type?: string | null;
  country_code?: string | null;
  company_code?: string | null;
  template_contract_id?: string | null;
  template_company_code?: string | null;
  client_terms?: Record<string, unknown>;
}

export interface ContractPolicyPreviewResponse {
  resolved_policy: Record<string, unknown>;
  template_config: Record<string, unknown>;
  merged_preview: Record<string, unknown>;
  related_rule_links: Record<string, unknown>[];
}
