/**
 * Example 01: List lending arrangements for a customer.
 *
 * BEFORE (legacy — CoreLoansApiService @deprecated):
 *   import { CoreLoansApiService } from '@pleniu/core-data-access';
 *   this.loansApi.list({ customer_id: customerId, status: 'ACTIVE' });
 *
 * AFTER (BIAN — LendingArrangementService):
 *   import { LendingArrangementService } from '@pleniu/loan-data-access';
 */

import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { LendingArrangementService } from '@pleniu/loan-data-access';
import { LendingStatus } from '@pleniu/loan-domain';
import { LendingStatusBadgeComponent, MoneyDisplayComponent } from '@pleniu/loan-ui-kit';

// ─────────────────────────────────────────────────────────────────────────────
// BEFORE (legacy — delete this after migration)
// ─────────────────────────────────────────────────────────────────────────────

/*
import { CoreLoansApiService, LoanDto } from '@pleniu/core-data-access';

@Component({ ... })
export class ContractsComponentLegacy {
  private svc = inject(CoreLoansApiService);
  readonly customerId = input.required<string>();

  contracts$ = this.svc.list({ customer_id: this.customerId(), status: 'ACTIVE' });

  // Template:
  // @for (c of contracts$ | async) {
  //   <div>{{ c.status }} — {{ c.amount }} {{ c.denomination }}</div>
  // }
}
*/

// ─────────────────────────────────────────────────────────────────────────────
// AFTER (BIAN)
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-contracts',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LendingStatusBadgeComponent, MoneyDisplayComponent, AsyncPipe],
  template: `
    <ul>
      @for (a of contracts(); track a.arrangementId) {
        <li>
          <pleniu-lending-status-badge [status]="a.status" />
          <pleniu-money-display [amount]="a.principal.amount" [currency]="a.currency" />
          <span>{{ a.termMonths }} meses</span>
        </li>
      }
    </ul>
  `,
})
export class ContractsComponent {
  private readonly svc = inject(LendingArrangementService);

  readonly customerId = input.required<string>();

  readonly contracts = toSignal(
    this.svc.getAll({ customerId: this.customerId(), status: LendingStatus.Active }).pipe(
      map((r) => r.items),
    ),
    { initialValue: [] },
  );
}
