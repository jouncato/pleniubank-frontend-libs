import { InjectionToken } from '@angular/core';

export interface ApiConfig {
  identityBaseUrl: string;
  coreBaseUrl: string;
  /**
   * Prefijo API Core para superficie pública (p. ej. `/api/v1/public`). Vacío = legado `/api/v1`.
   */
  corePublicApiPrefix?: string;
  /**
   * Prefijo API Core para operadores (p. ej. `/api/v1/admin`). Vacío = legado `/api/v1`.
   */
  coreAdminApiPrefix?: string;
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
  /**
   * Base URL del motor de reglas (pleniubank-rules-engine), sin barra final.
   * Ej.: `http://localhost:8095`. Rutas bajo `/api/v1` (MR-ST-005).
   */
  rulesEngineBaseUrl?: string;
  /**
   * pleniubank-ai-service (F5AI), sin barra final. Ej.: `http://localhost:8002`.
   * Si falta, el backoffice no puede invocar re-análisis desde el navegador.
   */
  aiServiceBaseUrl?: string;
  /**
   * Motor Unificado de Extractos y Notificaciones (MUE), sin barra final.
   * Ej.: `/api/mue` (proxy same-origin) o `http://localhost:8030`.
   * Si falta, los servicios MUE* no deben usarse.
   */
  mueBaseUrl?: string;
  /**
   * Scoring Service (pleniubank-scoring-service), sin barra final.
   * Ej.: `/api/scoring` (proxy same-origin) o `http://localhost:8020`.
   * Si falta, las páginas de scoring no realizan llamadas al servicio.
   */
  scoringBaseUrl?: string;
}

export const API_CONFIG = new InjectionToken<ApiConfig>('API_CONFIG');
