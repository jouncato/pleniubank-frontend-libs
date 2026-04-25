import { TestBed } from '@angular/core/testing';

import { APP_FEATURE_FLAGS } from './app-feature-flags.token';
import { FeatureFlagService } from './feature-flag.service';

describe('FeatureFlagService', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('merges injected flags with defaults', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: APP_FEATURE_FLAGS, useValue: { switchContext: true } }],
    });

    const service = TestBed.inject(FeatureFlagService);

    expect(service.isEnabled('switchContext')).toBe(true);
    expect(service.isEnabled('amortization')).toBe(false);
  });

  it('updates flags at runtime after backend health bootstrap', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: APP_FEATURE_FLAGS, useValue: { switchContext: true, amortization: false } }],
    });

    const service = TestBed.inject(FeatureFlagService);
    service.setFlags({ switchContext: false, amortization: true });

    expect(service.snapshot()).toEqual({ switchContext: false, amortization: true });
  });
});
