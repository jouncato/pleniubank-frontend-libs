import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LENDING_STATUS_LABELS, LendingStatus } from '@pleniu/loan-domain';

const STATUS_VARIANT: Record<LendingStatus, string> = {
  [LendingStatus.Draft]: 'muted',
  [LendingStatus.Active]: 'success',
  [LendingStatus.Suspended]: 'warning',
  [LendingStatus.Closed]: 'neutral',
  [LendingStatus.Defaulted]: 'danger',
  [LendingStatus.WrittenOff]: 'critical',
};

const STATUS_ICON: Record<LendingStatus, string> = {
  [LendingStatus.Draft]: '📝',
  [LendingStatus.Active]: '✓',
  [LendingStatus.Suspended]: '⏸',
  [LendingStatus.Closed]: '■',
  [LendingStatus.Defaulted]: '⚠',
  [LendingStatus.WrittenOff]: '✕',
};

@Component({
  selector: 'pleniu-lending-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="badge"
      [class]="'badge badge-' + variant()"
      [attr.aria-label]="label()"
    >
      <span class="icon" aria-hidden="true">{{ icon() }}</span>
      {{ label() }}
    </span>
  `,
  styles: `
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      border-radius: 999px;
      padding: 0.2rem 0.65rem;
      font-size: 0.75rem;
      font-weight: 700;
      line-height: 1.4;
    }
    .badge-muted    { background: var(--pleniu-color-surface-200, #e5e7eb); color: var(--pleniu-color-text-subtle, #6b7280); }
    .badge-success  { background: var(--pleniu-color-success-100, #dcfce7); color: var(--pleniu-color-success-700, #15803d); }
    .badge-warning  { background: var(--pleniu-color-warning-100, #fef9c3); color: var(--pleniu-color-warning-700, #a16207); }
    .badge-neutral  { background: var(--pleniu-color-surface-100, #f3f4f6); color: var(--pleniu-color-text, #374151); }
    .badge-danger   { background: var(--pleniu-color-error-100, #fee2e2); color: var(--pleniu-color-error-700, #b91c1c); }
    .badge-critical { background: var(--pleniu-color-error-200, #fecaca); color: var(--pleniu-color-error-900, #7f1d1d); font-weight: 900; }
  `,
})
export class LendingStatusBadgeComponent {
  readonly status = input.required<LendingStatus>();

  readonly variant = computed(() => STATUS_VARIANT[this.status()]);
  readonly label = computed(() => LENDING_STATUS_LABELS[this.status()]);
  readonly icon = computed(() => STATUS_ICON[this.status()]);
}
