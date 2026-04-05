import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerChangePasswordVm } from '../../vm/customer-change-password';
import { SecuritySettings } from './security-settings';
import { SecuritySettingsVm } from '../../vm/security-settings';

describe('SecuritySettings', () => {
  let component: SecuritySettings;
  let fixture: ComponentFixture<SecuritySettings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecuritySettings],
      providers: [
        {
          provide: CustomerChangePasswordVm,
          useValue: {
            state: signal<'idle' | 'submitting' | 'success' | 'error'>('idle'),
            errorMessage: signal<string | null>(null),
            resetFeedback: (): void => undefined,
            submit: (): void => undefined,
          },
        },
        {
          provide: SecuritySettingsVm,
          useValue: {
            mfaSectionVisible: true,
            mfaEnabled: false,
            mfaState: signal<'idle' | 'submitting' | 'success' | 'error'>('idle'),
            mfaError: signal<string | null>(null),
            resetMfaFeedback: (): void => undefined,
            patchMfa: (): void => undefined,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SecuritySettings);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
