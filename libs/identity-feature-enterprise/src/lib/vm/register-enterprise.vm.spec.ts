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

  it('tras registro exitoso muestra pantalla de éxito y no navega al verificar aún', () => {
    const navigate = vi.fn(() => Promise.resolve(true));
    TestBed.configureTestingModule({
      providers: [
        RegisterEnterpriseVm,
        { provide: Router, useValue: { navigate } },
        {
          provide: IdentityEnterpriseApiService,
          useValue: {
            registerEnterprise: () =>
              of({
                data: {
                  enterprise_id: 'e1',
                  principal_user_id: 'p1',
                  admin_user_id: 'a1',
                },
              }),
          },
        },
        EnterpriseOnboardingStore,
      ],
    });
    const store = TestBed.inject(EnterpriseOnboardingStore);
    store.patch({
      wizardStep: 3,
      company: {
        business_name: 'Acme',
        document_type: 'NIT',
        document_number: '900',
        company_email: 'c@acme.com',
        company_phone: '300',
        economic_sector_id: '11111111-1111-1111-1111-111111111107',
        sector: 'Otros',
      },
      principalEmail: 'p@acme.com',
      principalFullName: 'Pat',
      adminEmail: 'a@acme.com',
      adminFullName: 'Ad',
    });

    const vm = TestBed.inject(RegisterEnterpriseVm);
    vm.submit(
      { email: 'p@acme.com', full_name: 'Pat', password: 'GoodPassWord!1' },
      { email: 'a@acme.com', full_name: 'Ad', password: 'GoodPassWord!2' },
    );

    expect(vm.registrationSucceeded()).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('continueToEmailVerification navega a verify-email del principal', () => {
    const navigate = vi.fn(() => Promise.resolve(true));
    TestBed.configureTestingModule({
      providers: [
        RegisterEnterpriseVm,
        { provide: Router, useValue: { navigate } },
        {
          provide: IdentityEnterpriseApiService,
          useValue: { registerEnterprise: () => of({ data: {} }) },
        },
        EnterpriseOnboardingStore,
      ],
    });
    const vm = TestBed.inject(RegisterEnterpriseVm);
    vm.continueToEmailVerification();
    expect(navigate).toHaveBeenCalledWith(['/onboarding/party/organization/verify-email'], {
      queryParams: { role: 'principal' },
    });
  });
});
