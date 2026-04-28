import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { LendingArrangement } from '@pleniu/loan-domain';
import { LENDING_STATUS_LABELS } from '@pleniu/loan-domain';
import { LendingStatusBadgeComponent } from '../lending-status-badge/lending-status-badge.component';

export interface VersionDiffEntry {
  readonly field: string;
  readonly from: string;
  readonly to: string;
}

export interface VersionTimelineEntry {
  readonly version: number;
  readonly date: string;
  readonly actor: string;
  readonly status: LendingArrangement['status'];
  readonly diffs: VersionDiffEntry[];
}

const DIFFABLE_FIELDS: Array<keyof LendingArrangement> = [
  'status',
  'nominalRate',
  'maturityDate',
  'statusReason',
];

function labelOf(key: keyof LendingArrangement, value: unknown): string {
  if (key === 'status' && typeof value === 'string') {
    return LENDING_STATUS_LABELS[value as LendingArrangement['status']] ?? String(value);
  }
  return value == null ? '—' : String(value);
}

export function buildTimeline(versions: LendingArrangement[]): VersionTimelineEntry[] {
  return versions.map((v, idx) => {
    const prev = versions[idx - 1];
    const diffs: VersionDiffEntry[] = [];
    if (prev) {
      for (const field of DIFFABLE_FIELDS) {
        const from = prev[field];
        const to = v[field];
        if (from !== to) {
          diffs.push({ field: String(field), from: labelOf(field, from), to: labelOf(field, to) });
        }
      }
    }
    return {
      version: v.version,
      date: v.updatedAt ?? v.createdAt,
      actor: v.updatedBy ?? v.createdBy,
      status: v.status,
      diffs,
    };
  });
}

@Component({
  selector: 'pleniu-arrangement-version-timeline',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LendingStatusBadgeComponent, DatePipe],
  template: `
    <ol class="timeline" role="list" aria-label="Historial de versiones del arreglo">
      @for (entry of timeline(); track entry.version) {
        <li class="timeline__item">
          <div class="timeline__header">
            <span class="timeline__version">v{{ entry.version }}</span>
            <pleniu-lending-status-badge [status]="entry.status" />
            <time class="timeline__date" [dateTime]="entry.date">
              {{ entry.date | date:'medium' }}
            </time>
            <span class="timeline__actor">{{ entry.actor }}</span>
          </div>
          @if (entry.diffs.length > 0) {
            <ul class="timeline__diffs" aria-label="Cambios en versión {{ entry.version }}">
              @for (diff of entry.diffs; track diff.field) {
                <li class="timeline__diff">
                  <span class="diff__field">{{ diff.field }}</span>:
                  <span class="diff__from">{{ diff.from }}</span>
                  →
                  <span class="diff__to">{{ diff.to }}</span>
                </li>
              }
            </ul>
          }
        </li>
      }
    </ol>
  `,
  styles: `
    .timeline { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.75rem; }
    .timeline__item {
      padding: 0.75rem 1rem;
      border-left: 3px solid var(--pleniu-color-primary-400, #60a5fa);
      background: var(--pleniu-color-surface-50, #f9fafb);
      border-radius: 0 6px 6px 0;
    }
    .timeline__header { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .timeline__version { font-weight: 700; color: var(--pleniu-color-primary-700, #1d4ed8); }
    .timeline__date { font-size: 0.8rem; color: var(--pleniu-color-text-subtle, #6b7280); }
    .timeline__actor { font-size: 0.8rem; color: var(--pleniu-color-text-subtle, #6b7280); margin-left: auto; }
    .timeline__diffs { margin: 0.5rem 0 0; padding: 0 0 0 1rem; list-style: none; font-size: 0.85rem; display: flex; flex-direction: column; gap: 0.2rem; }
    .diff__field { font-weight: 600; color: var(--pleniu-color-text, #374151); }
    .diff__from { color: var(--pleniu-color-error-600, #dc2626); text-decoration: line-through; }
    .diff__to { color: var(--pleniu-color-success-700, #15803d); font-weight: 600; }
  `,
})
export class ArrangementVersionTimelineComponent {
  readonly versions = input.required<LendingArrangement[]>();
  readonly locale = input<string>('es-CO');

  readonly timeline = computed(() => buildTimeline(this.versions()));
}
