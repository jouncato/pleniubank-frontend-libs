import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import { LoanPaginationComponent } from './loan-pagination.component';
import { MoneyDisplayComponent } from '../money-display/money-display.component';
import type { AmortizationScheduleRow } from '../view-models/amortization-schedule-row.vm';

@Component({
  selector: 'pleniu-amortization-schedule-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MoneyDisplayComponent, LoanPaginationComponent, DatePipe],
  template: `
    <div class="schedule-wrapper">
      <table class="schedule-table" role="table" aria-label="Tabla de cuotas">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Vencimiento</th>
            <th scope="col">Capital</th>
            <th scope="col">Interés</th>
            <th scope="col">Total</th>
            <th scope="col">Saldo</th>
            <th scope="col">Estado</th>
          </tr>
        </thead>
        <tbody>
          @for (row of visibleRows(); track row.installmentNumber) {
            <tr
              [class.row--paid]="row.status === 'PAID'"
              [class.row--overdue]="row.status === 'OVERDUE'"
            >
              <td>{{ row.installmentNumber }}</td>
              <td>{{ row.dueDate | date:'mediumDate' }}</td>
              <td><pleniu-money-display [amount]="row.capital" [currency]="currency()" [locale]="locale()" /></td>
              <td><pleniu-money-display [amount]="row.interest" [currency]="currency()" [locale]="locale()" /></td>
              <td><pleniu-money-display [amount]="row.total" [currency]="currency()" [locale]="locale()" /></td>
              <td><pleniu-money-display [amount]="row.outstandingBalance" [currency]="currency()" [locale]="locale()" /></td>
              <td>{{ row.status }}</td>
            </tr>
          }
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2"><strong>Totales</strong></td>
            <td><pleniu-money-display [amount]="totals().capital" [currency]="currency()" [locale]="locale()" /></td>
            <td><pleniu-money-display [amount]="totals().interest" [currency]="currency()" [locale]="locale()" /></td>
            <td><pleniu-money-display [amount]="totals().total" [currency]="currency()" [locale]="locale()" /></td>
            <td></td>
            <td></td>
          </tr>
        </tfoot>
      </table>

      @if (pageable() && rows().length > pageSize()) {
        <pleniu-loan-pagination
          [total]="rows().length"
          [pageSize]="pageSize()"
          [(page)]="currentPage"
        />
      }
    </div>
  `,
  styles: `
    .schedule-wrapper { overflow-x: auto; }
    .schedule-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    .schedule-table th,
    .schedule-table td {
      padding: 0.5rem 0.75rem;
      text-align: right;
      border-bottom: 1px solid var(--pleniu-color-border, #e5e7eb);
    }
    .schedule-table th:first-child,
    .schedule-table td:first-child { text-align: center; }
    .schedule-table th:nth-child(2),
    .schedule-table td:nth-child(2) { text-align: left; }
    .schedule-table th { background: var(--pleniu-color-surface-50, #f9fafb); font-weight: 600; }
    .row--paid td { color: var(--pleniu-color-text-subtle, #6b7280); }
    .row--overdue td { color: var(--pleniu-color-error-700, #b91c1c); }
    tfoot td { font-weight: 600; border-top: 2px solid var(--pleniu-color-border, #e5e7eb); }
    pleniu-loan-pagination { display: block; margin-top: 1rem; }
  `,
})
export class AmortizationScheduleTableComponent {
  readonly rows = input.required<AmortizationScheduleRow[]>();
  readonly currency = input<string>('COP');
  readonly locale = input<string>('es-CO');
  readonly pageable = input<boolean>(true);
  readonly pageSize = input<number>(12);

  readonly currentPage = signal(1);

  readonly visibleRows = computed(() => {
    if (!this.pageable()) return this.rows();
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.rows().slice(start, start + this.pageSize());
  });

  readonly totals = computed(() => {
    const all = this.rows();
    return {
      capital: all.reduce((s, r) => s + Number(r.capital), 0).toFixed(2),
      interest: all.reduce((s, r) => s + Number(r.interest), 0).toFixed(2),
      total: all.reduce((s, r) => s + Number(r.total), 0).toFixed(2),
    };
  });
}
