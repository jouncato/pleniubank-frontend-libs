import { Inject, Injectable, Optional } from '@angular/core';
import { APP_FEATURE_FLAGS, AppFeatureFlags, DEFAULT_APP_FEATURE_FLAGS } from './app-feature-flags.token';

@Injectable({ providedIn: 'root' })
export class FeatureFlagService {
  private readonly flags: AppFeatureFlags;

  constructor(@Optional() @Inject(APP_FEATURE_FLAGS) injected: AppFeatureFlags | null) {
    this.flags = injected ?? { ...DEFAULT_APP_FEATURE_FLAGS };
  }

  isEnabled(key: keyof AppFeatureFlags): boolean {
    return Boolean(this.flags[key]);
  }
}
