import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { isValidReturnUrl, SessionStore } from '@pleniu/shared-auth';
import { CustomerChangePasswordForm } from '../customer-change-password-form/customer-change-password-form';
import { CustomerChangePasswordVm } from '../../vm/customer-change-password';
import { SessionVm } from '../../vm/session';

/**
 * Cambio de contraseña obligatorio tras el primer login con contraseña
 * temporal (customer-portal) -- cuentas creadas por carga masiva de
 * Anticipo de Nómina. Reutiliza el mismo formulario/VM ya probado en
 * `security-settings` (`CustomerChangePasswordForm`/`CustomerChangePasswordVm`,
 * llama `PATCH /auth/change-password`), solo agrega el marco de "paso
 * obligatorio" y la navegación automática al terminar -- mismo patrón que
 * `PhoneVerifyPostLogin`, componente hermano en este mismo lib.
 */
@Component({
  selector: 'lib-change-password-post-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CustomerChangePasswordForm],
  templateUrl: './change-password-post-login.html',
  styleUrl: './change-password-post-login.scss',
})
export class ChangePasswordPostLogin {
  protected readonly vm = inject(CustomerChangePasswordVm);
  private readonly session = inject(SessionVm);
  private readonly sessionStore = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  constructor() {
    effect(() => {
      if (this.vm.state() === 'success') {
        const rawReturn = this.route.snapshot.queryParamMap.get('returnUrl');
        const safe = isValidReturnUrl(rawReturn) ? rawReturn : '/app/dashboard';
        void this.router.navigateByUrl(safe);
      }
    });
  }

  get fullName(): string | undefined {
    return this.sessionStore.claims()?.full_name ?? undefined;
  }

  signOut(): void {
    this.session.logout();
  }
}
