import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { IdentityEnterpriseApiService } from 'identity-data-access';

import { EnterpriseOnboardingStore } from '../enterprise-onboarding.store';
import { RegisterEnterpriseVm } from './register-enterprise';

describe('RegisterEnterpriseVm', () => {
  beforeEach(() => {
    sessionStorage.removeItem('pleniu_enterprise_onboarding');
  });

  it('should be created', () => {
    TestBed.configureTestingModule({
      providers: [
        RegisterEnterpriseVm,
        { provide: Router, useValue: { navigate: () => Promise.resolve(true) } },
        {
          provide: IdentityEnterpriseApiService,
          useValue: { registerEnterprise: () => of({ data: {} }) },
        },
        EnterpriseOnboardingStore,
      ],
    });
    expect(TestBed.inject(RegisterEnterpriseVm)).toBeTruthy();
  });
});
