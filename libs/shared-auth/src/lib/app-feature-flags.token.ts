import { InjectionToken } from '@angular/core';

export interface AppFeatureFlags {
  /** Multi-empresa: POST /auth/switch-context (501 en MVP). */
  switchContext: boolean;
  /** Épica L (L-04): GET /loans/{id}/amortization puede seguir en 501; si es false, no se muestra el tab. */
  amortization: boolean;
  /** Hub Transaccional unificado (TH-ST-014+). Si es false, se muestra la vista legacy de postings. */
  transactionHub: boolean;
  /** B2C: pantalla de movimientos unificados + extractos. */
  b2cMovements: boolean;
  /** B2C: flujo de transferencias propias y P2P. */
  b2cTransfers: boolean;
  /** B2C: edición de perfil, cambio de contacto, sesiones, cierre de cuenta. */
  b2cProfileEdit: boolean;
  /** B2C: buzón de notificaciones in-app + preferencias. */
  b2cInbox: boolean;
  /** B2C: shell móvil responsive (top-app-bar + bottom-nav). */
  b2cMobileShell: boolean;
  financialAccounting: boolean;
  treasuryLiquidity: boolean;
  treasuryReconciliation: boolean;
}

export type AppFeatureFlagPatch = Partial<AppFeatureFlags>;

export const APP_FEATURE_FLAGS = new InjectionToken<AppFeatureFlags>('APP_FEATURE_FLAGS');

export const DEFAULT_APP_FEATURE_FLAGS: AppFeatureFlags = {
  switchContext: false,
  amortization: false,
  transactionHub: false,
  b2cMovements: false,
  b2cTransfers: false,
  b2cProfileEdit: false,
  b2cInbox: false,
  b2cMobileShell: false,
  financialAccounting: false,
  treasuryLiquidity: false,
  treasuryReconciliation: false,
};
