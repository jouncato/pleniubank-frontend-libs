import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Estados normalizados cross-domain del Transaction Hub. */
export type HubStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'UNKNOWN';

@Component({
  selector: 'pleniu-hub-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  template: `
    <span class="badge" [class]="badgeClass()" [attr.aria-label]="'Estado: ' + label()">
      {{ label() }}
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
    .badge--pending {
      background: #fff7e0;
      color: #9a6700;
    }
    .badge--completed {
      background: #dcfce7;
      color: #166534;
    }
    .badge--failed {
      background: #fee2e2;
      color: #991b1b;
    }
    .badge--cancelled {
      background: #f3f4f6;
      color: #374151;
    }
    .badge--unknown {
      background: #dbeafe;
      color: #1e40af;
    }
  `,
})
export class HubStatusBadgeComponent {
  readonly status = input.required<HubStatus>();

  readonly label = computed(() => {
    switch (this.status()) {
      case 'PENDING':
        return 'Pendiente';
      case 'COMPLETED':
        return 'Completada';
      case 'FAILED':
        return 'Fallida';
      case 'CANCELLED':
        return 'Cancelada';
      case 'UNKNOWN':
        return 'Desconocido';
      default:
        return String(this.status());
    }
  });

  readonly badgeClass = computed(() => {
    const key = this.status().toLowerCase();
    return `badge badge--${key}`;
  });
}
