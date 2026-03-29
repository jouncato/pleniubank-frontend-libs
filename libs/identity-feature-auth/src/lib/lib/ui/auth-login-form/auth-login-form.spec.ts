import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { LoginVm } from '../../vm/login';
import { AuthLoginForm } from './auth-login-form';

describe('AuthLoginForm', () => {
  let component: AuthLoginForm;
  let fixture: ComponentFixture<AuthLoginForm>;
  let vm: {
    state: string;
    errorMessage: string | null;
    isRateLimited: boolean;
    rateLimitMessage: string | null;
    login: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    vm = {
      state: 'idle',
      errorMessage: null,
      isRateLimited: false,
      rateLimitMessage: null,
      login: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AuthLoginForm],
      providers: [
        { provide: LoginVm, useValue: vm },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => null } } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthLoginForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra countdown y deshabilita submit durante el cooldown', () => {
    component.form.setValue({ email: 'cliente@example.com', password: 'secret' });
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
    component.form.setValue({ email: 'cliente@example.com', password: 'secret' });
    vm.state = 'idle';
    vm.isRateLimited = false;
    vm.rateLimitMessage = null;

    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const button = host.querySelector('button');
    expect(button?.disabled).toBe(false);
  });
});
