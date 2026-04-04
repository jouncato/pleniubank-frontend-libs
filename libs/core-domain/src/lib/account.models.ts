/** Respuesta mínima de Core `GET /accounts`. */

/** Valores de `scheme` en v1; ampliar la union cuando Core añada enum en BD. */
export const PAYMENT_SCHEME_V1 = ['IBAN'] as const;
export type PaymentSchemeV1 = (typeof PAYMENT_SCHEME_V1)[number];

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

/** Alineado a Core `AccountCreate`. */
export interface CreateAccountRequest {
  customer_id: string;
  product_id: string;
  instance_parameters?: Record<string, unknown>;
  stakeholder_ids?: string[];
}

/** Alineado a Core `AccountUpdate`. */
export interface UpdateAccountRequest {
  instance_parameters?: Record<string, unknown> | null;
  stakeholder_ids?: string[] | null;
}

/** Alineado a Core `AccountFlag` (domain enum). */
export const ACCOUNT_FLAG_VALUES = [
  'FROZEN',
  'DEBIT_BLOCKED',
  'CREDIT_BLOCKED',
  'KYC_PENDING',
  'AML_REVIEW',
  'PAYMENT_OVERDUE',
] as const;

export type AccountFlagValue = (typeof ACCOUNT_FLAG_VALUES)[number];

export interface AddAccountFlagRequest {
  flag: AccountFlagValue;
}

/** Estados de cuenta en Core `AccountStatus`. */
export const ACCOUNT_STATUS_VALUES = [
  'PENDING',
  'ACTIVE',
  'SUSPENDED',
  'PENDING_CLOSURE',
  'CLOSED',
] as const;

export type AccountStatusCode = (typeof ACCOUNT_STATUS_VALUES)[number];

/** Payload `data` de `GET /accounts/{id}/balances`. */
export interface BalanceDimensionDto {
  address: string;
  denomination: string;
  phase: string;
  /** Core serializa Decimal como string o número. */
  amount: string | number;
}

export interface AccountBalancePayloadDto {
  account_id: string;
  balances: BalanceDimensionDto[];
  available_balance: string | number | null;
}

/** Línea de `GET /accounts/{id}/movements` (extracto reciente). */
export interface AccountMovementItemDto {
  id: string;
  posting_instruction_batch_id: string;
  type: string;
  amount: string | number;
  denomination: string;
  phase: string;
  value_timestamp: string;
  booking_timestamp: string;
  credit_account_id: string | null;
  debit_account_id: string | null;
}
