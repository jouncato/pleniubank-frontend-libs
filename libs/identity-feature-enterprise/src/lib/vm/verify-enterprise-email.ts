import { Injectable, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IdentityEnterpriseApiService } from 'identity-data-access';
import { mapHttpError } from 'shared-http';
import { EnterpriseOnboardingStore } from '../enterprise-onboarding.store';

export type EnterpriseEmailRole = 'principal' | 'admin';

@Injectable({
  providedIn: 'root',
})
export class VerifyEnterpriseEmailVm {
  readonly state = signal<'idle' | 'submitting' | 'error' | 'expired'>('idle');
  readonly errorMessage = signal<string | null>(null);

  constructor(
    private readonly api: IdentityEnterpriseApiService,
    private readonly onboarding: EnterpriseOnboardingStore,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  getRole(): EnterpriseEmailRole {
    const r = this.route.snapshot.queryParamMap.get('role');
    return r === 'admin' ? 'admin' : 'principal';
  }

  maskedEmail(): string {
    const s = this.onboarding.state();
    if (!s) {
      return 'tu correo';
    }
    const email = this.getRole() === 'principal' ? s.principalEmail : s.adminEmail;
    const [user, domain] = email.split('@');
    if (!domain) {
      return email;
    }
    const u = user.length <= 2 ? `${user[0] ?? ''}*` : `${user.slice(0, 1)}***`;
    return `${u}@${domain}`;
  }

  submit(code: string): void {
    if (this.state() === 'submitting') {
      return;
    }
    const s = this.onboarding.state();
    const role = this.getRole();
    const userId = role === 'principal' ? s?.principalUserId : s?.adminUserId;
    if (!userId) {
      this.state.set('expired');
      this.errorMessage.set('Proceso expirado, reinicia el registro empresa.');
      return;
    }

    this.state.set('submitting');
    this.errorMessage.set(null);

    this.api.verifyEnterpriseEmail({ user_id: userId, code }).subscribe({
      next: () => {
        this.state.set('idle');
        if (role === 'principal') {
          void this.router.navigate(['/onboarding/party/organization/verify-email'], { queryParams: { role: 'admin' } });
          return;
        }
        void this.router.navigate(['/onboarding/party/access/login'], {
          queryParams: { returnUrl: '/app/enterprise/kyb' },
        });
      },
      error: (err: unknown) => {
        const mapped = mapHttpError(err);
        this.state.set(mapped.status === 404 ? 'expired' : 'error');
        this.errorMessage.set(
          mapped.status === 404
            ? 'Proceso expirado, reinicia el registro empresa.'
            : 'Código inválido.',
        );
      },
    });
  }
}

