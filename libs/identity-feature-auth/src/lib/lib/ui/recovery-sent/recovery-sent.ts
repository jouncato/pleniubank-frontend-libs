import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { authRoutesForPortal, PORTAL_APP, type PortalAppKind } from '@pleniu/shared-auth';

import { ForgotPasswordVm } from '../../vm/forgot-password';

@Component({
  selector: 'lib-recovery-sent',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  templateUrl: './recovery-sent.html',
  styleUrl: './recovery-sent.scss',
})
export class RecoverySent {
  private readonly portal = inject<PortalAppKind>(PORTAL_APP);
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly routes = authRoutesForPortal(this.portal);
  protected readonly email = this.resolveEmail();

  constructor(protected readonly vm: ForgotPasswordVm) {}

  resend(): void {
    if (!this.email || this.vm.state() === 'submitting' || this.vm.isRateLimited()) {
      return;
    }
    this.vm.submit(
      { email: this.email, method: 'link' },
      { navigateOnSuccess: false, onSettled: () => this.cdr.markForCheck() },
    );
  }

  private resolveEmail(): string | null {
    const state = history.state as { email?: unknown } | null;
    return typeof state?.email === 'string' && state.email.trim() ? state.email.trim() : null;
  }
}
