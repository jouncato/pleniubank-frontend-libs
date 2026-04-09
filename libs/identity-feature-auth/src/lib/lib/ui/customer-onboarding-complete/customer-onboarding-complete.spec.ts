import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CUSTOMER_PORTAL_SIGN_IN_URL } from '@pleniu/shared-auth';
import { CustomerOnboardingComplete } from './customer-onboarding-complete';

describe('CustomerOnboardingComplete', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerOnboardingComplete],
      providers: [
        provideRouter([]),
        { provide: CUSTOMER_PORTAL_SIGN_IN_URL, useValue: null },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(CustomerOnboardingComplete);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('muestra enlace externo cuando hay CUSTOMER_PORTAL_SIGN_IN_URL', async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerOnboardingComplete],
      providers: [
        provideRouter([]),
        { provide: CUSTOMER_PORTAL_SIGN_IN_URL, useValue: 'https://cliente.example/login' },
      ],
    }).compileComponents();

    const fixture: ComponentFixture<CustomerOnboardingComplete> =
      TestBed.createComponent(CustomerOnboardingComplete);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const link = host.querySelector('a[href="https://cliente.example/login"]');
    expect(link?.textContent).toContain('portal de cliente');
  });
});
