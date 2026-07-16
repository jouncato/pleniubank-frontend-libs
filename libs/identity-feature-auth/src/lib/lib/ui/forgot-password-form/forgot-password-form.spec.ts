import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';

import { ForgotPasswordVm } from '../../vm/forgot-password';
import { ForgotPasswordForm } from './forgot-password-form';

describe('ForgotPasswordForm', () => {
  let component: ForgotPasswordForm;
  let fixture: ComponentFixture<ForgotPasswordForm>;
  let vm: {
    state: ReturnType<typeof signal<string>>;
    errorMessage: ReturnType<typeof signal<string | null>>;
    successMessage: ReturnType<typeof signal<string | null>>;
    debugResetCode: ReturnType<typeof signal<string | null>>;
    debugResetToken: ReturnType<typeof signal<string | null>>;
    submittedEmail: ReturnType<typeof signal<string | null>>;
    submittedMethod: ReturnType<typeof signal<'otp' | 'link'>>;
    isRateLimited: ReturnType<typeof signal<boolean>>;
    rateLimitMessage: ReturnType<typeof signal<string | null>>;
    submit: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    vm = {
      state: signal('idle'),
      errorMessage: signal<string | null>(null),
      successMessage: signal<string | null>(null),
      debugResetCode: signal<string | null>(null),
      debugResetToken: signal<string | null>(null),
      submittedEmail: signal<string | null>(null),
      submittedMethod: signal<'otp' | 'link'>('otp'),
      isRateLimited: signal(false),
      rateLimitMessage: signal<string | null>(null),
      submit: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ForgotPasswordForm],
      providers: [provideRouter([]), { provide: ForgotPasswordVm, useValue: vm }],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra countdown y deshabilita submit durante el cooldown', () => {
    component.form.setValue({ email: 'cliente@example.com' });
    vm.state.set('rate_limited');
    vm.isRateLimited.set(true);
    vm.rateLimitMessage.set('Demasiados intentos. Espera 60 segundos.');

    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const button = host.querySelector('button');
    expect(host.textContent).toContain('Demasiados intentos. Espera 60 segundos.');
    expect(button?.disabled).toBe(true);
  });

  it('rehabilita submit cuando el cooldown termina', () => {
    component.form.setValue({ email: 'cliente@example.com' });
    vm.state.set('idle');
    vm.isRateLimited.set(false);
    vm.rateLimitMessage.set(null);

    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const button = host.querySelector('button');
    expect(button?.disabled).toBe(false);
  });
});
