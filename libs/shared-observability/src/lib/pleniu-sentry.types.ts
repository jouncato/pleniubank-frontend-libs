import type { Observable } from 'rxjs';

/**
 * Contexto mínimo de usuario asociado a eventos de Sentry.
 *
 * Deliberadamente NO incluye PII directa (p. ej. email): `sendDefaultPii` se
 * configura en `false` en `initPleniuSentry` y este contrato debe respetar esa
 * intención. Si en el futuro se necesita PII adicional, debe ser una decisión
 * explícita documentada, no un campo añadido de paso.
 */
export interface PleniuSentryUserContext {
  user_id?: string;
  role?: string;
  enterprise_id?: string;
}

/** Configuración en tiempo de build (environment.ts) para Sentry. */
export interface PleniuSentryInitConfig {
  /** Solo se envía telemetría cuando es true y hay DSN. */
  production: boolean;
  /** DSN del proyecto Sentry; vacío o undefined desactiva el SDK. */
  dsn: string | undefined;
  /** Valor de la etiqueta `environment` en Sentry (p. ej. production, staging). */
  environment?: string;
  /** Identificador del portal: customer | backoffice | public. */
  portal: string;
  /** Versión desplegada (CI puede inyectar git SHA). */
  release?: string;
  /** Muestreo de performance (0–1). Por defecto 0.2 en prod. */
  tracesSampleRate?: number;
  /**
   * Factory que provee el contexto de usuario a asociar en Sentry, como
   * observable reactivo a cambios de sesión (login/logout). Se invoca dentro
   * de un contexto de inyección de Angular, así que puede usar `inject(...)`
   * internamente (p. ej. para leer `SessionStore` de `shared-auth`).
   *
   * `shared-observability` es una lib de infraestructura transversal y no debe
   * conocer el modelo de sesión/auth de cada portal — por eso este dato entra
   * como parámetro en vez de importarse directamente. El portal (`app.config.ts`)
   * es responsable de mapear sus claims de sesión a este contexto mínimo.
   * Si se omite, no se asocia usuario a los eventos de Sentry.
   */
  getUserContext?: () => Observable<PleniuSentryUserContext | null>;
}
