import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PORTAL_APP, SessionStore, type PortalAppKind } from '@pleniu/shared-auth';
import { PbPasswordVisibilityToggleComponent } from '@pleniu/ui';
import { LoginVm } from '../../vm/login';

@Component({
  selector: 'lib-auth-login-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, PbPasswordVisibilityToggleComponent],
  templateUrl: './auth-login-form.html',
  styleUrl: './auth-login-form.scss',
})
export class AuthLoginForm {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly sessionStore = inject(SessionStore);
  protected readonly portal = inject<PortalAppKind>(PORTAL_APP);

  readonly showPassword = signal(false);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  constructor(protected readonly vm: LoginVm) {}

  protected readonly sessionTermination = this.sessionStore.terminationReason;

  dismissSessionTermination(): void {
    this.sessionStore.clearTerminationReason();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { email, password } = this.form.getRawValue();
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? undefined;
    this.vm.login({
      email: email ?? '',
      password: password ?? '',
    }, returnUrl);
  }
}
