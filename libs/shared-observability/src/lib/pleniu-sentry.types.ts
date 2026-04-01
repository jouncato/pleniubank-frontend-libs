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
}
