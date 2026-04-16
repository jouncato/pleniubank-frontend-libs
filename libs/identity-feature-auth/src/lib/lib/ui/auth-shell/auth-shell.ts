import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { PbLogoComponent } from '@pleniu/ui';

@Component({
  selector: 'lib-auth-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, PbLogoComponent],
  templateUrl: './auth-shell.html',
  styleUrl: './auth-shell.scss',
})
export class AuthShell {
  private readonly router = inject(Router);

  /**
   * Onboarding marketing: landing completa (sin tarjeta glass del auth-shell clásico).
   */
  readonly fullBleedOnboarding = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => this.isFullBleedOnboardingUrl(this.router.url)),
      startWith(this.isFullBleedOnboardingUrl(this.router.url)),
    ),
    { initialValue: this.isFullBleedOnboardingUrl(this.router.url) },
  );

  private isFullBleedOnboardingUrl(rawUrl: string): boolean {
    const path = rawUrl.split('?')[0]?.replace(/\/+$/, '') ?? '';
    return (
      path.endsWith('/onboarding/party/register') ||
      path.endsWith('/customer/v0.1.0/party/register') ||
      path.endsWith('/onboarding/party/customer/register') ||
      path.endsWith('/customer/v0.1.0/party/customer/register') ||
      path.endsWith('/onboarding/party/organization/register') ||
      path.endsWith('/customer/v0.1.0/party/organization/register') ||
      path.endsWith('/onboarding/party/access/login') ||
      path.endsWith('/customer/v0.1.0/party/access/login') ||
      path.endsWith('/customer/v0.1.0/party/access/forgot-password') ||
      path.endsWith('/customer/v0.1.0/party/access/reset-password') ||
      path.endsWith('/backoffice/party/access/login') ||
      path.endsWith('/onboarding/party/customer/verify-contact') ||
      path.endsWith('/customer/v0.1.0/party/customer/verify-contact') ||
      path.endsWith('/onboarding/party/customer/verify-email') ||
      path.endsWith('/customer/v0.1.0/party/customer/verify-email') ||
      path.endsWith('/onboarding/party/customer/verify-phone') ||
      path.endsWith('/customer/v0.1.0/party/customer/verify-phone') ||
      path.endsWith('/onboarding/party/customer/complete') ||
      path.endsWith('/customer/v0.1.0/party/customer/complete')
    );
  }
}
