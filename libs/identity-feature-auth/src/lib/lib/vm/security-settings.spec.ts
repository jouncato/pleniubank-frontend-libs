import { TestBed } from '@angular/core/testing';
import { IdentityAuthApiService } from 'identity-data-access';
import { SESSION_STRATEGY, SessionStore } from 'shared-auth';

import { SecuritySettingsVm } from './security-settings';

describe('SecuritySettingsVm', () => {
  let service: SecuritySettingsVm;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SecuritySettingsVm,
        { provide: SessionStore, useValue: { claims: () => ({ two_factor_enabled: true }) } },
        {
          provide: IdentityAuthApiService,
          useValue: {
            patchAppUserMfa: () => ({ subscribe: () => ({}) }),
            validate: () => ({ subscribe: () => ({}) }),
          },
        },
        { provide: SESSION_STRATEGY, useValue: 'sessionStorage' },
      ],
    });
    service = TestBed.inject(SecuritySettingsVm);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('returns MFA enabled when claims include two_factor_enabled', () => {
    expect(service.mfaEnabled).toBe(true);
  });

  it('mfaSectionVisible is false when two_factor_enabled is omitted', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        SecuritySettingsVm,
        { provide: SessionStore, useValue: { claims: () => ({ user_id: 'u1' }) } },
        {
          provide: IdentityAuthApiService,
          useValue: {
            patchAppUserMfa: () => ({ subscribe: () => ({}) }),
            validate: () => ({ subscribe: () => ({}) }),
          },
        },
        { provide: SESSION_STRATEGY, useValue: 'sessionStorage' },
      ],
    });
    const s = TestBed.inject(SecuritySettingsVm);
    expect(s.mfaSectionVisible).toBe(false);
  });
});
