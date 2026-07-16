import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ForgotPasswordPlaceholder } from './forgot-password-placeholder';

describe('ForgotPasswordPlaceholder', () => {
  let component: ForgotPasswordPlaceholder;
  let fixture: ComponentFixture<ForgotPasswordPlaceholder>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForgotPasswordPlaceholder],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordPlaceholder);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render a single page heading and informative text', () => {
    const host: HTMLElement = fixture.nativeElement;
    const heading = host.querySelector('h1');
    expect(heading?.textContent?.trim()).toBe('Recuperación de contraseña');
    expect(
      host.textContent?.includes(
        'El envío automático de un enlace para restablecer la contraseña no está disponible todavía.',
      ),
    ).toBe(true);
  });

  it('should expose a support mailto link', () => {
    const host: HTMLElement = fixture.nativeElement;
    const mail = host.querySelector<HTMLAnchorElement>('a[href^="mailto:"]');
    expect(mail?.getAttribute('href')).toBe('mailto:soporte@pleniubank.com');
    expect(mail?.textContent?.trim()).toBe('soporte@pleniubank.com');
  });

  it('should link back to login', () => {
    const host: HTMLElement = fixture.nativeElement;
    const loginLink = host.querySelector<HTMLAnchorElement>('a[routerlink="/onboarding/party/access/login"]');
    expect(loginLink?.textContent?.trim()).toBe('Volver a iniciar sesión');
  });

  it('should wrap content in a main landmark labelled by the heading', () => {
    const host: HTMLElement = fixture.nativeElement;
    const main = host.querySelector('main');
    expect(main?.getAttribute('aria-labelledby')).toBe('forgot-password-title');
    expect(main?.querySelector('#forgot-password-title')?.tagName).toBe('H1');
  });
});

