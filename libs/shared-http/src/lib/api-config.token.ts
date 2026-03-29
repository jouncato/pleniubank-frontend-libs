import { InjectionToken } from '@angular/core';

export interface ApiConfig {
  identityBaseUrl: string;
  coreBaseUrl: string;
  /**
   * Base URL del PaymentHub (OpenAPI `servers[0]`, p. ej. proxy Core o hub directo).
   * Sin barra final. Si falta, los servicios `PaymentHub*` no deben usarse.
   */
  paymentHubBaseUrl?: string;
  /** OAuth2 client_credentials (mock/sandbox en OpenAPI). */
  paymentHubClientId?: string;
  paymentHubClientSecret?: string;
  /** Scopes separados por espacio, p. ej. `payments:read payments:write`. */
  paymentHubOAuthScope?: string;
}

export const API_CONFIG = new InjectionToken<ApiConfig>('API_CONFIG');
