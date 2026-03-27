import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EnterpriseOnboardingStore } from '../../enterprise-onboarding.store';
import { RegisterEnterpriseVm } from '../../vm/register-enterprise';
import { EnterpriseRegisterWizard } from './enterprise-register-wizard';

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
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EnterpriseRegisterWizard);
    fixture.detectChanges();
  });

  it('marca el primer paso del stepper con aria-current', () => {
    const steps = fixture.nativeElement.querySelectorAll('.steps li');
    expect(steps.length).toBe(4);
    expect(steps[0].getAttribute('aria-current')).toBe('step');
    expect(steps[1].getAttribute('aria-current')).toBeNull();
  });
});
