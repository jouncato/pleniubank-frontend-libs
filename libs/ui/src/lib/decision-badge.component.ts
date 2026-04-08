import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Decisiones de evaluación del motor de reglas (MR-FE-003). */
export type EvaluationDecision = 'APPROVED' | 'REJECTED' | 'MANUAL_REVIEW';

@Component({
  selector: 'pleniu-decision-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  template: `
    <span class="badge" [class]="badgeClass()" [attr.aria-label]="'Decisión: ' + decision()">
      {{ decision() }}
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
    .badge--approved {
      background: var(--pleniu-color-success-100, #dcfce7);
      color: var(--pleniu-color-success-700, #166534);
    }
    .badge--rejected {
      background: var(--pleniu-color-error-100, #fee2e2);
      color: var(--pleniu-color-error-700, #991b1b);
    }
    .badge--manual_review {
      background: var(--pleniu-color-warning-100, #fff7e0);
      color: var(--pleniu-color-warning-700, #9a6700);
    }
  `,
})
export class DecisionBadgeComponent {
  readonly decision = input.required<EvaluationDecision>();

  readonly badgeClass = computed(() => {
    const d = this.decision();
    const key = d.toLowerCase().replace(/-/g, '_');
    return `badge--${key}`;
  });
}
