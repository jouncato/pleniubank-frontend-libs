import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { IdentityEnterpriseApiService } from '@pleniu/identity-data-access';
import { SessionStore } from '@pleniu/shared-auth';

import { EnterpriseOnboardingStore } from '../enterprise-onboarding.store';
import { VerifyEnterpriseEmailVm } from './verify-enterprise-email';

describe('VerifyEnterpriseEmailVm', () => {
  const createTestBed = (options: {
    apiResponse: { data: unknown };
    role: 'principal' | 'admin';
    onboardingState: unknown;
    sessionStoreMock?: { clear: ReturnType<typeof vi.fn> };
  }) => {
    const navigations: { commands: unknown[]; extras?: { queryParams?: Record<string, string> } }[] = [];
    const router = {
      navigate: (commands: unknown[], extras?: { queryParams?: Record<string, string> }) => {
        navigations.push({ commands, extras });
        return Promise.resolve(true);
      },
    };
    const sessionStoreMock = options.sessionStoreMock ?? {
      clear: vi.fn(),
    };
    const onboardingStoreMock = {
      state: () => options.onboardingState,
      clear: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        VerifyEnterpriseEmailVm,
        {
          provide: IdentityEnterpriseApiService,
          useValue: {
            verifyEnterpriseEmail: () => of(options.apiResponse),
            resendEnterpriseEmailOtp: () => of({ data: { status: 'sent' } }),
          },
        },
        {
          provide: EnterpriseOnboardingStore,
          useValue: onboardingStoreMock,
        },
        { provide: SessionStore, useValue: sessionStoreMock },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: { get: (k: string) => (k === 'role' ? options.role : null) },
            },
          },
        },
      ],
    });

    return { vm: TestBed.inject(VerifyEnterpriseEmailVm), navigations, sessionStoreMock, onboardingStoreMock };
  };

  it('tras verificar redirige al login sin iniciar sesión automáticamente', () => {
    const onboardingState = {
      principalUserId: '11111111-1111-4111-8111-111111111111',
      adminUserId: '22222222-2222-4222-8222-222222222222',
      principalEmail: 'p@x.com',
      adminEmail: 'a@x.com',
      wizardStep: 3,
      company: {
        business_name: 'Co',
        document_type: 'NIT',
        document_number: '1',
        company_email: 'c@x.com',
        company_phone: '1',
        sector: '',
      },
      principalFullName: 'P',
      adminFullName: 'A',
    };
    const apiResponse = {
      data: {
        user_id: '11111111-1111-4111-8111-111111111111',
        enterprise_id: '33333333-3333-4333-8333-333333333333',
        email_verified: true,
        enterprise_status: 'pending_kyb',
        enterprise_emails_complete: true,
        principal_email_verified: true,
        admin_email_verified: true,
        is_active: true,
        access_token: 'mock-jwt-token',
        expires_in: 3600,
        role: 'enterprise_principal',
      },
    };

    const { vm, navigations, sessionStoreMock, onboardingStoreMock } = createTestBed({
      apiResponse,
      role: 'principal',
      onboardingState,
    });

    vm.submit('1234');

    expect(navigations.length).toBe(1);
    expect(navigations[0]?.commands).toEqual(['/onboarding/party/access/login']);
    expect(sessionStoreMock.clear).toHaveBeenCalled();
    expect(onboardingStoreMock.clear).toHaveBeenCalled();
  });

  it('tras verificar sin tokens navega al login sin returnUrl', () => {
    const onboardingState = {
      principalUserId: '11111111-1111-4111-8111-111111111111',
      adminUserId: '22222222-2222-4222-8222-222222222222',
      principalEmail: 'p@x.com',
      adminEmail: 'a@x.com',
      wizardStep: 3,
      company: {
        business_name: 'Co',
        document_type: 'NIT',
        document_number: '1',
        company_email: 'c@x.com',
        company_phone: '1',
        sector: '',
      },
      principalFullName: 'P',
      adminFullName: 'A',
    };
    const apiResponse = {
      data: {
        user_id: '11111111-1111-4111-8111-111111111111',
        enterprise_id: '33333333-3333-4333-8333-333333333333',
        email_verified: true,
        enterprise_status: 'pending_kyb',
        enterprise_emails_complete: true,
        principal_email_verified: true,
        admin_email_verified: true,
        is_active: false, // Usuario no activo - no hay tokens
      },
    };

    const { vm, navigations, sessionStoreMock } = createTestBed({
      apiResponse,
      role: 'principal',
      onboardingState,
    });

    vm.submit('1234');

    expect(navigations.length).toBe(1);
    expect(navigations[0]?.commands).toEqual(['/onboarding/party/access/login']);
    expect(navigations[0]?.extras?.queryParams).toBeUndefined();
    expect(sessionStoreMock.clear).toHaveBeenCalled();
  });
});

