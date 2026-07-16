import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { PbIconComponent } from './pb-icon.component';

export interface TimelineStepUi {
  label: string;
  timestamp?: string;
  status: 'completed' | 'active' | 'pending' | 'error';
  icon: 'check' | 'clock' | 'undo' | 'x';
  detail?: string;
}

@Component({
  selector: 'pleniu-transaction-timeline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PbIconComponent],
  template: `
    <ol class="timeline" role="list" aria-label="Ciclo de vida de la transaccion">
      @for (step of steps; track step.label + ($index + '')) {
        <li class="timeline__step" [class]="'timeline__step timeline__step--' + step.status">
          <span class="timeline__icon"><pb-icon [name]="icon(step.icon)" size="sm" /></span>
          <div class="timeline__content">
            <strong>{{ step.label }}</strong>
            @if (step.timestamp) {
              <time [dateTime]="step.timestamp">{{ step.timestamp }}</time>
            }
            @if (step.detail) {
              <p>{{ step.detail }}</p>
            }
          </div>
        </li>
      }
    </ol>
  `,
  styles: `
    .timeline { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.75rem; }
    .timeline__step { display: grid; grid-template-columns: 1.5rem 1fr; gap: 0.75rem; align-items: start; }
    .timeline__icon { width: 1.5rem; height: 1.5rem; display: grid; place-items: center; border-radius: 999px; background: #e5e7eb; }
    .timeline__step--completed .timeline__icon { background: #dcfce7; }
    .timeline__step--pending .timeline__icon { background: #fff7e0; }
    .timeline__step--error .timeline__icon { background: #fee2e2; }
    .timeline__content p { margin: 0.25rem 0 0; color: #4b5563; }
    .timeline__content time { display: block; color: #6b7280; font-size: 0.8rem; }
  `,
})
export class TransactionTimelineComponent {
  @Input({ required: true }) steps: TimelineStepUi[] = [];

  icon(name: TimelineStepUi['icon']): 'check' | 'undo' | 'error' | 'clock' {
    if (name === 'x') return 'error';
    return name;
  }
}
