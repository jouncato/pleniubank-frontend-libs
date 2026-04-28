/**
 * Example 04: Amortization schedule — before/after.
 *
 * BEFORE (legacy): custom fetch to non-standard endpoint or missing entirely.
 * AFTER  (BIAN):   AmortizationScheduleService + AmortizationScheduleTableComponent.
 *
 * The toAmortizationRow() mapper converts the domain AmortizationSchedule
 * into the AmortizationScheduleRow view model used by the table component.
 */

import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { AmortizationScheduleService } from '@pleniu/loan-data-access';
import { AmortizationScheduleTableComponent, toAmortizationRow } from '@pleniu/loan-ui-kit';

// ─────────────────────────────────────────────────────────────────────────────
// BEFORE (legacy — delete after migration)
// ─────────────────────────────────────────────────────────────────────────────

/*
// Option A: endpoint never existed — ad-hoc fetch
async function getLegacySchedule(loanId: string) {
  const res = await fetch(`/api/v1/libranza-contracts/${loanId}/schedule`);
  return res.json(); // untyped, may be 404/501

  // Then rendered with a custom table that duplicated column logic per portal
}

// Option B: CoreLoansApiService.getAmortization() — returned 501
// this.loansApi.getAmortization(loanId); // unreliable
*/

// ─────────────────────────────────────────────────────────────────────────────
// AFTER (BIAN)
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-amortization-schedule',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AmortizationScheduleTableComponent],
  template: `
    <pleniu-amortization-schedule-table
      [rows]="rows()"
      [currency]="currency()"
      [pageable]="true"
      [pageSize]="12"
    />
  `,
})
export class AmortizationScheduleComponent {
  private readonly svc = inject(AmortizationScheduleService);

  readonly arrangementId = input.required<string>();
  readonly currency = input<string>('COP');

  readonly rows = toSignal(
    this.svc.get(this.arrangementId()).pipe(
      // AmortizationSchedule[] → AmortizationScheduleRow[] (view model)
      map((schedules) => schedules.map(toAmortizationRow)),
    ),
    { initialValue: [] },
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AFTER (BIAN) — paginated with generate trigger
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-amortization-with-generate',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AmortizationScheduleTableComponent],
  template: `
    <button (click)="generate()">Generar cronograma</button>
    <pleniu-amortization-schedule-table
      [rows]="rows()"
      currency="COP"
      [pageable]="true"
    />
  `,
})
export class AmortizationWithGenerateComponent {
  private readonly svc = inject(AmortizationScheduleService);

  readonly arrangementId = input.required<string>();

  readonly rows = toSignal(
    this.svc.get(this.arrangementId()).pipe(map((s) => s.map(toAmortizationRow))),
    { initialValue: [] },
  );

  generate(): void {
    this.svc
      .generate(this.arrangementId(), {
        arrangementId: this.arrangementId(),
        currency: 'COP',
      })
      .subscribe();
  }
}
