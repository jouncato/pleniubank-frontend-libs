import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EconomicSectorPublicDto } from 'identity-domain';
import { IdentityEnterpriseApiService } from '@pleniu/identity-data-access';
import { CUSTOMER_PORTAL_SIGN_IN_URL } from '@pleniu/shared-auth';
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
  let component: EnterpriseRegisterWizard;

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
            setStep: () => {},
            submit: () => {},
            errorMessage: () => null,
            fieldErrors: () => ({}),
            conflictError: () => false,
            submitting: () => false,
            registrationSucceeded: () => false,
            continueToEmailVerification: () => {},
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
        { provide: CUSTOMER_PORTAL_SIGN_IN_URL, useValue: null },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EnterpriseRegisterWizard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('marca el primer paso del stepper con aria-current', () => {
    const steps = fixture.nativeElement.querySelectorAll('.steps__item');
    expect(steps.length).toBe(4);
    expect(steps[0].getAttribute('aria-current')).toBe('step');
    expect(steps[1].getAttribute('aria-current')).toBeNull();
  });

  it('muestra un resumen de campos obligatorios y exige el correo de la empresa', () => {
    const summary = fixture.nativeElement.querySelector('.validation-summary');
    expect(summary.textContent).toContain('Correo de la empresa');
    expect(component.companyValidationSummary).toContain('Correo de la empresa');
  });

  it('aplica formato y mensaje de teléfono corporativo', () => {
    component.companyForm.controls.company_phone.setValue('abc');
    component.companyForm.controls.company_phone.markAsTouched();
    fixture.detectChanges();
    expect(component.companyForm.controls.company_phone.invalid).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('teléfono de la empresa debe tener un formato válido');
  });
});
