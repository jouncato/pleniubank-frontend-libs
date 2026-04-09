import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { CUSTOMER_PORTAL_SIGN_IN_URL } from '@pleniu/shared-auth';
import { CustomerOnboardingShell } from './customer-onboarding-shell';

@Component({ standalone: true, template: '' })
class StubOutlet {}

describe('CustomerOnboardingShell', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerOnboardingShell],
      providers: [
        provideRouter([
          { path: 'onboarding/party/customer/register', component: StubOutlet },
          { path: 'onboarding/party/customer/verify-contact', component: StubOutlet },
          { path: 'onboarding/party/customer/verify-email', component: StubOutlet },
          { path: 'onboarding/party/customer/complete', component: StubOutlet },
        ]),
        { provide: CUSTOMER_PORTAL_SIGN_IN_URL, useValue: null },
      ],
    }).compileComponents();
  });

  async function shellAfterNavigate(url: string): Promise<ComponentFixture<CustomerOnboardingShell>> {
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(CustomerOnboardingShell);
    await router.navigateByUrl(url);
    fixture.detectChanges();
    return fixture;
  }

  it('should create', async () => {
    const fixture = await shellAfterNavigate('/onboarding/party/customer/register');
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('marca el paso 1 en la ruta de registro', async () => {
    const fixture = await shellAfterNavigate('/onboarding/party/customer/register');
    const steps = fixture.nativeElement.querySelectorAll('.customer-onb-stepper__item');
    expect(steps.length).toBe(3);
    expect(steps[0].getAttribute('aria-current')).toBe('step');
    expect(fixture.nativeElement.textContent).toContain('Paso 1 de 3');
  });

  it('marca el paso 2 en verify-contact', async () => {
    const fixture = await shellAfterNavigate('/onboarding/party/customer/verify-contact');
    const steps = fixture.nativeElement.querySelectorAll('.customer-onb-stepper__item');
    expect(steps[1].getAttribute('aria-current')).toBe('step');
    expect(fixture.nativeElement.textContent).toContain('Paso 2 de 3');
  });

  it('marca el paso 2 en verify-email', async () => {
    const fixture = await shellAfterNavigate('/onboarding/party/customer/verify-email');
    const steps = fixture.nativeElement.querySelectorAll('.customer-onb-stepper__item');
    expect(steps[1].getAttribute('aria-current')).toBe('step');
  });

  it('marca el paso 3 en complete', async () => {
    const fixture = await shellAfterNavigate('/onboarding/party/customer/complete');
    const steps = fixture.nativeElement.querySelectorAll('.customer-onb-stepper__item');
    expect(steps[2].getAttribute('aria-current')).toBe('step');
    expect(fixture.nativeElement.textContent).toContain('Paso 3 de 3');
  });
});
