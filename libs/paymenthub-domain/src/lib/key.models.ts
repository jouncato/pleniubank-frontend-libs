export type PaymentHubKeyType = 'PAN_TOKEN' | 'ACCOUNT_TOKEN' | 'API_KEY';

export type PaymentHubKeyStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED';

export interface PaymentHubKeyRequest {
  type: PaymentHubKeyType;
  owner: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentHubKey {
  keyId: string;
  type: PaymentHubKeyType;
  value?: string;
  createdAt: string;
  expiresAt: string;
  status: PaymentHubKeyStatus;
  owner: string;
}
