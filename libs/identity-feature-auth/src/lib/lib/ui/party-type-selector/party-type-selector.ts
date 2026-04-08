import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CUSTOMER_PORTAL_SIGN_IN_URL } from 'shared-auth';
import { PbLogoComponent } from 'ui';

/**
 * HU-1 / BIAN Party Reference: elección de tipo de Party antes del registro.
 * Estética alineada al POC landing (docs-proyecto-plenibank/desing/landing-poc).
 */
@Component({
  selector: 'lib-party-type-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [RouterLink, PbLogoComponent],
  templateUrl: './party-type-selector.html',
  styleUrl: './party-type-selector.scss',
})
export class PartyTypeSelector {
  /** Si el host público no tiene login, apunta al portal de cliente (token opcional). */
  readonly customerSignInUrl = inject(CUSTOMER_PORTAL_SIGN_IN_URL);
}
