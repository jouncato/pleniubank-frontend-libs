import { InjectionToken } from '@angular/core';

export interface AppFeatureFlags {
  /** Multi-empresa: POST /auth/switch-context (501 en MVP). */
  switchContext: boolean;
  /** Épica L (L-04): GET /loans/{id}/amortization puede seguir en 501; si es false, no se muestra el tab. */
  amortization: boolean;
}

export type AppFeatureFlagPatch = Partial<AppFeatureFlags>;

export const APP_FEATURE_FLAGS = new InjectionToken<AppFeatureFlags>('APP_FEATURE_FLAGS');

export const DEFAULT_APP_FEATURE_FLAGS: AppFeatureFlags = {
  switchContext: false,
  amortization: false,
};
