export interface PaymentHubRailLatencyProfile {
  minMs?: number;
  maxMs?: number;
  settlementTime?: string;
}

export type PaymentHubRailFeeModelType = 'FLAT' | 'PERCENTAGE' | 'TIERED';

export interface PaymentHubRailFeeModel {
  type?: PaymentHubRailFeeModelType;
  baseFee?: string;
  currency?: string;
}

/** OpenAPI `Rail`. */
export interface PaymentHubRail {
  railId: string;
  name: string;
  countrySupport: string[];
  currenciesSupported: string[];
  latencyProfile?: PaymentHubRailLatencyProfile;
  feeModel?: PaymentHubRailFeeModel;
}

export interface PaymentHubRailSendRequest {
  paymentId: string;
  payload?: Record<string, unknown>;
}

export type PaymentHubRailSendStatus = 'ACCEPTED' | 'REJECTED' | 'PENDING';

export interface PaymentHubRailSendResponse {
  railReference?: string;
  status?: PaymentHubRailSendStatus;
  estimatedSettlement?: string;
  rawResponse?: Record<string, unknown>;
}
