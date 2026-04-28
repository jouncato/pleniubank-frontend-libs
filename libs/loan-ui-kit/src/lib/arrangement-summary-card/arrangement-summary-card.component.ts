import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { LendingArrangement } from '@pleniu/loan-domain';
import { LendingStatusBadgeComponent } from '../lending-status-badge/lending-status-badge.component';
import { MoneyDisplayComponent } from '../money-display/money-display.component';

@Component({
  selector: 'pleniu-arrangement-summary-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LendingStatusBadgeComponent, MoneyDisplayComponent, DatePipe],
  template: `
    <article class="summary-card" aria-label="Resumen del crédito">
      <header class="summary-card__header">
        <span class="summary-card__id">{{ arrangement().arrangementId }}</span>
        <pleniu-lending-status-badge [status]="arrangement().status" />
      </header>
      <dl class="summary-card__kpis">
        <div class="kpi">
          <dt>Principal</dt>
          <dd>
            <pleniu-money-display
              [amount]="arrangement().principal.amount"
              [currency]="arrangement().currency"
              [locale]="locale()"
            />
          </dd>
        </div>
        @if (arrangement().nominalRate != null) {
          <div class="kpi">
            <dt>Tasa nominal</dt>
            <dd>{{ (arrangement().nominalRate! * 100).toFixed(2) }}%</dd>
          </div>
        }
        @if (arrangement().termMonths != null) {
          <div class="kpi">
            <dt>Plazo</dt>
            <dd>{{ arrangement().termMonths }} meses</dd>
          </div>
        }
        <div class="kpi">
          <dt>Frecuencia</dt>
          <dd>{{ arrangement().repaymentFrequency }}</dd>
        </div>
        @if (arrangement().maturityDate) {
          <div class="kpi">
            <dt>Vencimiento</dt>
            <dd>{{ arrangement().maturityDate | date:'mediumDate' }}</dd>
          </div>
        }
        <div class="kpi">
          <dt>Creado</dt>
          <dd>{{ arrangement().createdAt | date:'mediumDate' }}</dd>
        </div>
      </dl>
    </article>
  `,
  styles: `
    .summary-card {
      border: 1px solid var(--pleniu-color-border, #e5e7eb);
      border-radius: 8px;
      padding: 1rem 1.25rem;
      background: var(--pleniu-color-surface-0, #fff);
    }
    .summary-card__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }
    .summary-card__id {
      font-size: 0.8rem;
      color: var(--pleniu-color-text-subtle, #6b7280);
      font-family: 'SFMono-Regular', Menlo, monospace;
    }
    .summary-card__kpis {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 0.75rem;
      margin: 0;
    }
    .kpi dt {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--pleniu-color-text-subtle, #6b7280);
      margin: 0;
    }
    .kpi dd {
      margin: 0.15rem 0 0;
      font-weight: 600;
      color: var(--pleniu-color-text, #111827);
    }
  `,
})
export class ArrangementSummaryCardComponent {
  readonly arrangement = input.required<LendingArrangement>();
  readonly locale = input<string>('es-CO');
}
