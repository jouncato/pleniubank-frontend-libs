import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { IdentityEnterpriseApiService } from '@pleniu/identity-data-access';

import { EnterpriseOnboardingStore } from '../enterprise-onboarding.store';
import { VerifyEnterpriseEmailVm } from './verify-enterprise-email';

describe('VerifyEnterpriseEmailVm', () => {
  it('tras verificar principal navega a verificación admin', () => {
    const navigations: { commands: unknown[]; extras?: { queryParams?: Record<string, string> } }[] = [];
    const router = {
      navigate: (commands: unknown[], extras?: { queryParams?: Record<string, string> }) => {
        navigations.push({ commands, extras });
        return Promise.resolve(true);
      },
    };
    const onboardingState = {
      principalUserId: 'p1',
      adminUserId: 'a1',
      principalEmail: 'p@x.com',
      adminEmail: 'a@x.com',
      wizardStep: 3,
      company: {
        business_name: 'Co',
        document_type: 'NIT' as const,
        document_number: '1',
        company_email: 'c@x.com',
        company_phone: '1',
        sector: '',
      },
      principalFullName: 'P',
      adminFullName: 'A',
    };
    TestBed.configureTestingModule({
      providers: [
        VerifyEnterpriseEmailVm,
        {
          provide: IdentityEnterpriseApiService,
          useValue: {
            verifyEnterpriseEmail: () => of({ data: { ok: true } }),
            resendEnterpriseEmailOtp: () => of({ data: { status: 'sent' } }),
          },
        },
        {
          provide: EnterpriseOnboardingStore,
          useValue: {
            state: () => onboardingState,
          },
        },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: { get: (k: string) => (k === 'role' ? 'principal' : null) },
            },
          },
        },
      ],
    });
    const vm = TestBed.inject(VerifyEnterpriseEmailVm);
    vm.submit('1234');
    expect(navigations.length).toBe(1);
    expect(navigations[0]?.commands).toEqual(['/onboarding/party/organization/verify-email']);
    expect(navigations[0]?.extras?.queryParams).toEqual({ role: 'admin' });
  });
});

