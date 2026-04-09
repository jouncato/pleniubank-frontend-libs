import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CUSTOMER_PORTAL_SIGN_IN_URL } from '@pleniu/shared-auth';

@Component({
  selector: 'lib-customer-onboarding-complete',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  templateUrl: './customer-onboarding-complete.html',
  styleUrl: './customer-onboarding-complete.scss',
})
export class CustomerOnboardingComplete {
  readonly customerSignInUrl = inject(CUSTOMER_PORTAL_SIGN_IN_URL);
}
