import { Inject, Injectable, Optional } from '@angular/core';
import {
  APP_FEATURE_FLAGS,
  AppFeatureFlagPatch,
  AppFeatureFlags,
  DEFAULT_APP_FEATURE_FLAGS,
} from './app-feature-flags.token';

@Injectable({ providedIn: 'root' })
export class FeatureFlagService {
  private flags: AppFeatureFlags;

  constructor(@Optional() @Inject(APP_FEATURE_FLAGS) injected: AppFeatureFlags | null) {
    this.flags = { ...DEFAULT_APP_FEATURE_FLAGS, ...(injected ?? {}) };
  }

  isEnabled(key: keyof AppFeatureFlags): boolean {
    return Boolean(this.flags[key]);
  }

  snapshot(): AppFeatureFlags {
    return { ...this.flags };
  }

  setFlags(patch: AppFeatureFlagPatch): void {
    this.flags = { ...this.flags, ...patch };
  }
}
