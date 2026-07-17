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
   * Base URL del PaymentHub (OpenAPI `servers[0]`).
   * Sin barra final. Ya NO es usado por los servicios `PaymentHub*` de
   * `paymenthub-data-access` (migrados al proxy autenticado en Core, bajo
   * `{coreBaseUrl}/api/v1/paymenthub`) — se conserva el campo porque
   * `customer-portal`/`backoffice-portal` aún lo asignan en su
   * `app.config.ts` (fase 3, pendiente en otra sesión); retirarlo aquí
   * rompería su build antes de esa migración.
   */
  paymentHubBaseUrl?: string;
  /**
   * Base URL del motor de reglas (pleniubank-rules-engine), sin barra final.
   * Ej.: `http://localhost:8095`. Rutas bajo `/api/v1` (MR-ST-005).
   */
  rulesEngineBaseUrl?: string;
  /**
   * pleniubank-ai-service (F5AI), sin barra final. Ej.: `http://localhost:8025`.
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
  /**
   * Mock Services (pleniubank-mock-services), sin barra final.
   * Ej.: `/mock-services/api` (proxy same-origin) o `http://localhost:8095`.
   * Usado para configuración de servicios de infraestructura en desarrollo.
   */
  mockServicesBaseUrl?: string;
}

export const API_CONFIG = new InjectionToken<ApiConfig>('API_CONFIG');
