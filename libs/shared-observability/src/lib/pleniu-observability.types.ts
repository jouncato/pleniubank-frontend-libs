import type { Observable } from 'rxjs';

/**
 * Contexto mínimo de usuario asociado a eventos de observabilidad.
 *
 * Deliberadamente NO incluye PII directa (p. ej. email): `sendDefaultPii` se
 * configura en `false` en GlitchTip y este contrato debe respetar esa
 * intención. Si en el futuro se necesita PII adicional, debe ser una decisión
 * explícita documentada, no un campo añadido de paso.
 */
export interface PleniuObservabilityUserContext {
  user_id?: string;
  role?: string;
  enterprise_id?: string;
}

/**
 * Configuración unificada de observabilidad en tiempo de build (environment.ts).
 *
 * Combina:
 * - **GlitchTip** (error tracking, compatible con Sentry SDK): captura de
 *   errores, breadcrumbs y contexto de usuario.
 * - **OpenTelemetry** (trazas, logs, Web Vitals): exportación OTLP HTTP al
 *   Collector, instrumentación automática de fetch/XHR/navegación.
 *
 * Ambos subsistemas son independientes: se pueden habilitar/deshabilitar por
 * separado mediante `glitchTipEnabled` y `otelEnabled`.
 */
export interface PleniuObservabilityConfig {
  /** Entorno de despliegue (production, development, staging). */
  production: boolean;
  /** Identificador del portal: customer | backoffice | public. */
  portal: string;

  // ── GlitchTip (error tracking) ──────────────────────────────────────────

  /** Habilita el envío de errores a GlitchTip. */
  glitchTipEnabled: boolean;
  /** DSN del proyecto GlitchTip; vacío desactiva el SDK. */
  glitchTipDsn: string;
  /** Versión desplegada (CI puede inyectar git SHA). */
  glitchTipRelease?: string;

  // ── OpenTelemetry (trazas, logs, Web Vitals) ────────────────────────────

  /** Habilita la exportación OTLP de traces, logs y métricas. */
  otelEnabled: boolean;
  /** Endpoint same-origin del OTel Collector (p. ej. `/otel`). */
  otelExporterEndpoint: string;
  /** Nombre del servicio OTel. Default: `pleniu-${portal}-portal`. */
  otelServiceName?: string;
  /** Versión del servicio OTel. */
  otelServiceVersion?: string;

  // ── Contexto de usuario (reactivo) ──────────────────────────────────────

  /**
   * Factory que provee el contexto de usuario como observable reactivo a
   * cambios de sesión (login/logout). Se invoca dentro de un contexto de
   * inyección de Angular, así que puede usar `inject(...)` internamente.
   *
   * `shared-observability` es una lib de infraestructura transversal y no debe
   * conocer el modelo de sesión/auth de cada portal — por eso este dato entra
   * como parámetro. Si se omite, no se asocia usuario a los eventos.
   */
  getUserContext?: () => Observable<PleniuObservabilityUserContext | null>;
}
