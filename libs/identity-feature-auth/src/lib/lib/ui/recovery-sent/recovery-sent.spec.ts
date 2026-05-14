import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ForgotPasswordVm } from '../../vm/forgot-password';
import { RecoverySent } from './recovery-sent';

describe('RecoverySent', () => {
  let fixture: ComponentFixture<RecoverySent>;
  let vm: {
    state: string;
    successMessage: string | null;
    errorMessage: string | null;
    rateLimitMessage: string | null;
    isRateLimited: boolean;
    submit: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    history.replaceState({ email: 'cliente@example.com' }, '');
    vm = {
      state: 'idle',
      successMessage: null,
      errorMessage: null,
      rateLimitMessage: null,
      isRateLimited: false,
      submit: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [RecoverySent],
      providers: [provideRouter([]), { provide: ForgotPasswordVm, useValue: vm }],
    }).compileComponents();

    fixture = TestBed.createComponent(RecoverySent);
    fixture.detectChanges();
  });

  it('renders the standard recovery confirmation copy', () => {
    const host = fixture.nativeElement as HTMLElement;

    expect(host.textContent).toContain('Revisa tu correo electrónico');
    expect(host.textContent).toContain('El enlace expira en 10 minutos');
    expect(host.textContent).toContain('Volver al inicio de sesión');
  });

  it('resends recovery link without exposing token in route state', () => {
    const button = (fixture.nativeElement as HTMLElement).querySelector('button');
    button?.click();

    expect(vm.submit).toHaveBeenCalledWith(
      { email: 'cliente@example.com', method: 'link' },
      expect.objectContaining({ navigateOnSuccess: false }),
    );
  });
});
