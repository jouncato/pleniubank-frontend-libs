import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ForgotPasswordVm } from '../../vm/forgot-password';
import { ForgotPasswordForm } from './forgot-password-form';

describe('ForgotPasswordForm', () => {
  let component: ForgotPasswordForm;
  let fixture: ComponentFixture<ForgotPasswordForm>;
  let vm: {
    state: string;
    errorMessage: string | null;
    successMessage: string | null;
    debugResetCode: string | null;
    debugResetToken: string | null;
    submittedEmail: string | null;
    submittedMethod: 'otp' | 'link';
    isRateLimited: boolean;
    rateLimitMessage: string | null;
    submit: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    vm = {
      state: 'idle',
      errorMessage: null,
      successMessage: null,
      debugResetCode: null,
      debugResetToken: null,
      submittedEmail: null,
      submittedMethod: 'otp',
      isRateLimited: false,
      rateLimitMessage: null,
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
    component.form.setValue({ email: 'cliente@example.com', method: 'otp' });
    vm.state = 'rate_limited';
    vm.isRateLimited = true;
    vm.rateLimitMessage = 'Demasiados intentos. Espera 60 segundos.';

    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const button = host.querySelector('button');
    expect(host.textContent).toContain('Demasiados intentos. Espera 60 segundos.');
    expect(button?.disabled).toBe(true);
  });

  it('rehabilita submit cuando el cooldown termina', () => {
    component.form.setValue({ email: 'cliente@example.com', method: 'otp' });
    vm.state = 'idle';
    vm.isRateLimited = false;
    vm.rateLimitMessage = null;

    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const button = host.querySelector('button');
    expect(button?.disabled).toBe(false);
  });
});
