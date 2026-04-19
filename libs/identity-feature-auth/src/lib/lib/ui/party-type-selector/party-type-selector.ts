import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  CUSTOMER_PORTAL_SIGN_IN_URL,
  EMBEDDED_PORTAL_IDENTITY_CHROME,
  PORTAL_APP,
} from '@pleniu/shared-auth';

/**
 * HU-1 / BIAN Party Reference: elección de tipo de Party antes del registro.
 * Estética alineada al POC landing (docs-proyecto-plenibank/desing/landing-poc).
 */
@Component({
  selector: 'lib-party-type-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [RouterLink],
  templateUrl: './party-type-selector.html',
  styleUrl: './party-type-selector.scss',
})
export class PartyTypeSelector {
  /** Si el host público no tiene login, apunta al portal de cliente (token opcional). */
  readonly customerSignInUrl = inject(CUSTOMER_PORTAL_SIGN_IN_URL);
  private readonly portalApp = inject(PORTAL_APP);
  readonly embeddedHostShell = inject(EMBEDDED_PORTAL_IDENTITY_CHROME, { optional: true }) === true;

  readonly personRegisterLink = computed(() =>
    this.portalApp === 'public'
      ? ['/onboarding/party/customer/register']
      : ['/customer/v0.1.0/party/customer/register'],
  );

  readonly enterpriseRegisterLink = computed(() =>
    this.portalApp === 'public'
      ? ['/onboarding/party/organization/register']
      : ['/customer/v0.1.0/party/organization/register'],
  );

  readonly portalLoginLink = computed(() =>
    this.portalApp === 'public'
      ? ['/onboarding/party/access/login']
      : ['/customer/v0.1.0/party/access/login'],
  );
}
