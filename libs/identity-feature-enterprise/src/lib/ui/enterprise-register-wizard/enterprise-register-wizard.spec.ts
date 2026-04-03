import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EconomicSectorPublicDto } from 'identity-domain';
import { IdentityEnterpriseApiService } from 'identity-data-access';
import { of } from 'rxjs';
import { EnterpriseOnboardingStore } from '../../enterprise-onboarding.store';
import { RegisterEnterpriseVm } from '../../vm/register-enterprise';
import { EnterpriseRegisterWizard } from './enterprise-register-wizard';

const TEST_SECTOR: EconomicSectorPublicDto = {
  sector_id: '11111111-1111-1111-1111-111111111107',
  code: 'otros',
  label_es: 'Otros',
  category: 'other',
  ui_sort_order: 99,
};

describe('EnterpriseRegisterWizard (a11y smoke)', () => {
  let fixture: ComponentFixture<EnterpriseRegisterWizard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnterpriseRegisterWizard],
      providers: [
        provideRouter([]),
        {
          provide: RegisterEnterpriseVm,
          useValue: {
            currentStep: () => 0,
            next: () => {},
            prev: () => {},
            submit: () => {},
            errorMessage: () => null,
            conflictError: () => false,
            submitting: () => false,
          },
        },
        {
          provide: EnterpriseOnboardingStore,
          useValue: { state: () => null, patch: () => {} },
        },
        {
          provide: IdentityEnterpriseApiService,
          useValue: {
            listPublicEconomicSectors: () => of({ data: [TEST_SECTOR] }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EnterpriseRegisterWizard);
    fixture.detectChanges();
  });

  it('marca el primer paso del stepper con aria-current', () => {
    const steps = fixture.nativeElement.querySelectorAll('.steps__item');
    expect(steps.length).toBe(4);
    expect(steps[0].getAttribute('aria-current')).toBe('step');
    expect(steps[1].getAttribute('aria-current')).toBeNull();
  });
});
