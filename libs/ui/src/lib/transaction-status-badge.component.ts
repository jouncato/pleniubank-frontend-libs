import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type TransactionStatus = 'PENDING' | 'COMMITTED' | 'REJECTED' | 'RELEASED' | string;

@Component({
  selector: 'pleniu-transaction-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="badge" [class]="badgeClass" [attr.aria-label]="'Estado: ' + label" [title]="detail || label">
      {{ label }}
    </span>
  `,
  styles: `
    .badge {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      padding: 0.2rem 0.6rem;
      font-size: 0.75rem;
      font-weight: 700;
      line-height: 1.4;
    }
    .badge--warning { background: #fff7e0; color: #9a6700; }
    .badge--success { background: #dcfce7; color: #166534; }
    .badge--error { background: #fee2e2; color: #991b1b; }
    .badge--info { background: #dbeafe; color: #1e40af; }
    .badge--neutral { background: #f3f4f6; color: #374151; }
  `,
})
export class TransactionStatusBadgeComponent {
  @Input({ required: true }) status: TransactionStatus = 'PENDING';
  @Input() detail = '';

  get label(): string {
    switch (this.status) {
      case 'PENDING':
        return 'Pendiente';
      case 'COMMITTED':
        return 'Liquidada';
      case 'REJECTED':
        return 'Rechazada';
      case 'RELEASED':
        return 'Liberada';
      default:
        return String(this.status);
    }
  }

  get badgeClass(): string {
    switch (this.status) {
      case 'PENDING':
        return 'badge badge--warning';
      case 'COMMITTED':
        return 'badge badge--success';
      case 'REJECTED':
        return 'badge badge--error';
      case 'RELEASED':
        return 'badge badge--info';
      default:
        return 'badge badge--neutral';
    }
  }
}
