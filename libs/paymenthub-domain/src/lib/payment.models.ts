/** OpenAPI `PaymentStatus`. */
export type PaymentHubPaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SENT'
  | 'SETTLED'
  | 'FAILED'
  | 'CANCELLED';

/** OpenAPI `PaymentRequest.paymentType`. */
export type PaymentHubPaymentType = 'P2P' | 'P2B' | 'B2B' | 'B2P' | 'INTERNATIONAL';

/** OpenAPI `DebtorCreditor.accountType`. */
export type PaymentHubAccountType =
  | 'IBAN'
  | 'CLABE'
  | 'ROUTING_ACCOUNT'
  | 'PIX_KEY'
  | 'ACCOUNT_NUMBER'
  | 'WALLET';

export interface PaymentHubDebtorCreditor {
  name: string;
  accountId: string;
  accountType?: PaymentHubAccountType;
  bankCode?: string;
  country?: string;
}

export type PaymentHubRoutingPriority = 'NORMAL' | 'HIGH' | 'URGENT';

export interface PaymentHubRoutingInfo {
  preferredRailId?: string;
  fallbackRailId?: string;
  priority?: PaymentHubRoutingPriority;
}

export interface PaymentHubPaymentRequest {
  amount: string;
  currency: string;
  minorUnits?: number;
  debtor: PaymentHubDebtorCreditor;
  creditor: PaymentHubDebtorCreditor;
  paymentType: PaymentHubPaymentType;
  country: string;
  purpose?: string;
  routingInfo?: PaymentHubRoutingInfo;
  metadata?: Record<string, unknown>;
}

export interface PaymentHubFeeBreakdown {
  feeType?: 'FLAT' | 'PERCENTAGE' | 'TIERED';
  amount?: string;
  currency?: string;
  appliedTo?: string;
}

export interface PaymentHubFxQuote {
  quoteId?: string;
  fromCurrency?: string;
  toCurrency?: string;
  rate?: string;
  inverseRate?: string;
  timestamp?: string;
  validUntil?: string;
}

/** OpenAPI `Payment` (respuesta JSON camelCase). */
export interface PaymentHubPayment {
  paymentId: string;
  amount: string;
  currency: string;
  minorUnits?: number;
  debtor: PaymentHubDebtorCreditor;
  creditor: PaymentHubDebtorCreditor;
  paymentType: PaymentHubPaymentType;
  country: string;
  routingInfo?: PaymentHubRoutingInfo;
  purpose?: string;
  metadata?: Record<string, unknown>;
  idempotencyKey?: string;
  status: PaymentHubPaymentStatus;
  railId?: string;
  feeBreakdown?: PaymentHubFeeBreakdown[];
  fxQuote?: PaymentHubFxQuote;
  createdAt: string;
  updatedAt: string;
}

/** OpenAPI `ScenarioRequest`. */
export type PaymentHubScenarioType =
  | 'LATENCY'
  | 'ERROR_5XX'
  | 'TIMEOUT'
  | 'PARTIAL_FAILURE'
  | 'FX_SPIKE'
  | 'DUPLICATE_MESSAGE';

export interface PaymentHubScenarioRequest {
  type: PaymentHubScenarioType;
  config?: Record<string, unknown>;
  seed?: number;
}
