/**
 * Example 03: Display lending status — before/after.
 *
 * BEFORE (legacy): raw string comparisons with español hardcoded labels.
 * AFTER  (BIAN):   LendingStatusBadgeComponent from @pleniu/loan-ui-kit,
 *                  or LENDING_STATUS_LABELS helper from @pleniu/loan-domain.
 *
 * STATUS MAPPING (complete):
 *   'PENDING_DISBURSEMENT' → LendingStatus.Draft
 *   'ACTIVE' | 'DISBURSED' → LendingStatus.Active
 *   'PAID_OFF' | 'SETTLED' → LendingStatus.Closed  (no statusReason)
 *   'CANCELLED'            → LendingStatus.Closed  (statusReason: 'CANCELLED')
 *   'TERMINATED'           → LendingStatus.Closed  (statusReason: 'TERMINATED')
 *   'DEFAULTED'            → LendingStatus.Defaulted
 *   'SUSPENDED'            → LendingStatus.Suspended
 *   'WRITTEN_OFF'          → LendingStatus.WrittenOff
 */

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LendingStatus } from '@pleniu/loan-domain';
import type { LendingArrangement } from '@pleniu/loan-domain';
import { LendingStatusBadgeComponent } from '@pleniu/loan-ui-kit';

// ─────────────────────────────────────────────────────────────────────────────
// BEFORE (legacy — delete after migration)
// ─────────────────────────────────────────────────────────────────────────────

/*
function getLegacyLabel(estado: string): string {
  if (estado === 'PAID_OFF' || estado === 'SETTLED') return 'Pagado';
  if (estado === 'ACTIVE' || estado === 'DISBURSED') return 'Activo';
  if (estado === 'DEFAULTED') return 'En mora';
  if (estado === 'CANCELLED') return 'Cancelado';
  return estado; // <- falls through with raw DB value in prod
}

// Status badge — custom ad-hoc per portal
function getLegacyBadgeClass(estado: string): string {
  if (estado === 'ACTIVE') return 'badge badge--green';
  if (estado === 'DEFAULTED') return 'badge badge--red';
  return 'badge badge--grey';
}
*/

// ─────────────────────────────────────────────────────────────────────────────
// AFTER (BIAN) — Option A: component (recommended)
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-arrangement-status',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LendingStatusBadgeComponent],
  template: `
    <pleniu-lending-status-badge [status]="arrangement().status" />

    @if (arrangement().statusReason) {
      <span class="status-reason">{{ arrangement().statusReason }}</span>
    }
  `,
})
export class ArrangementStatusComponent {
  readonly arrangement = input.required<LendingArrangement>();
}

// ─────────────────────────────────────────────────────────────────────────────
// AFTER (BIAN) — Option B: programmatic label (when component is not usable)
// ─────────────────────────────────────────────────────────────────────────────

// Note: LENDING_STATUS_LABELS will be added to @pleniu/loan-domain (LB-ST-024).
// Until then, use this local map or the component above.
const STATUS_LABELS: Record<LendingStatus, string> = {
  [LendingStatus.Draft]: 'Borrador',
  [LendingStatus.Active]: 'Activo',
  [LendingStatus.Closed]: 'Cerrado',
  [LendingStatus.Defaulted]: 'En mora',
  [LendingStatus.Suspended]: 'Suspendido',
  [LendingStatus.WrittenOff]: 'Castigado',
};

@Component({
  selector: 'app-arrangement-label',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span>{{ label() }}</span>`,
})
export class ArrangementLabelComponent {
  readonly arrangement = input.required<LendingArrangement>();
  readonly label = computed(() => STATUS_LABELS[this.arrangement().status] ?? this.arrangement().status);
}
