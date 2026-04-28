/**
 * Example 02: Create a lending arrangement (wizard flow).
 *
 * BEFORE (legacy — CreateLoanRequest @deprecated):
 *   this.loansApi.create({ customer_id, employer_id, amount, denomination, instance_parameters })
 *
 * AFTER (BIAN — CreateLendingArrangementRequest):
 *   this.lendingService.create({ customerId, productType, principal, nominalRate, ... })
 *
 * KEY GOTCHA: tasa_mensual → nominalRate requires × 12 annualization.
 *   1.5% monthly → 0.18 annual (decimal)
 */

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { LendingArrangementService } from '@pleniu/loan-data-access';
import { ProductType, RepaymentFrequency, money } from '@pleniu/loan-domain';

// ─────────────────────────────────────────────────────────────────────────────
// BEFORE (legacy — delete after migration)
// ─────────────────────────────────────────────────────────────────────────────

/*
import { CoreLoansApiService } from '@pleniu/core-data-access';

function createLegacy(
  loansApi: CoreLoansApiService,
  customerId: string,
  employerId: string,
  accountId: string,
): void {
  loansApi.create({
    customer_id: customerId,
    employer_id: employerId,           // <- top-level, product-specific
    account_id: accountId,
    product_id: 'PAYROLL_ADVANCE_V1',
    amount: '5000000',
    denomination: 'COP',
    instance_parameters: {
      plazo: 12,
      tasa_mensual: 1.5,              // <- monthly rate, NOT annualized
    },
  }).subscribe();
}
*/

// ─────────────────────────────────────────────────────────────────────────────
// AFTER (BIAN)
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-create-arrangement',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()">
      <input formControlName="amount" placeholder="Monto (COP)" />
      <input formControlName="termMonths" type="number" placeholder="Plazo meses" />
      <input formControlName="tasaMensual" type="number" placeholder="Tasa mensual %" />
      <button type="submit" [disabled]="form.invalid || saving()">Crear</button>
    </form>
  `,
})
export class CreateArrangementComponent {
  private readonly svc = inject(LendingArrangementService);
  private readonly fb = inject(FormBuilder);

  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    amount: ['', Validators.required],
    termMonths: [12, [Validators.required, Validators.min(1)]],
    tasaMensual: [1.5, [Validators.required, Validators.min(0)]],
  });

  submit(): void {
    if (this.form.invalid) return;

    const { amount, termMonths, tasaMensual } = this.form.getRawValue();

    // ✅ KEY CONVERSION: tasa_mensual (%) → nominalRate (annual decimal)
    const nominalRate = (tasaMensual / 100) * 12;

    this.saving.set(true);
    this.svc
      .create({
        customerId: 'CUSTOMER_ID',           // from session
        productType: ProductType.PayrollAdvance,
        principal: money(amount, 'COP'),
        nominalRate,
        repaymentFrequency: RepaymentFrequency.Monthly,
        termMonths,
        currency: 'COP',
        extensionData: {
          employer_id: 'EMPLOYER_ID',        // now in extensionData, NOT top-level
        },
      })
      .subscribe({ complete: () => this.saving.set(false) });
  }
}
