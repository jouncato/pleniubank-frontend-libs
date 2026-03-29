/** Alineado con `components.schemas.TokenRequest` (application/x-www-form-urlencoded). */
export interface PaymentHubTokenRequest {
  client_id: string;
  client_secret: string;
  grant_type: 'client_credentials';
  scope?: string;
}

export interface PaymentHubTokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
}
