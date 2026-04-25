import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'pb-error-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="pb-error-state" role="alert" aria-live="assertive">
      <h2 class="pb-error-state__title">{{ title }}</h2>
      <p class="pb-error-state__message">{{ message }}</p>
      @if (correlationId) {
        <p class="pb-error-state__reference">Referencia: {{ correlationId }}</p>
      }
      @if (retryLabel) {
        <button type="button" class="pb-error-state__retry" (click)="retry.emit()">
          {{ retryLabel }}
        </button>
      }
    </section>
  `,
  styles: `
    .pb-error-state {
      display: grid;
      gap: 0.75rem;
      padding: 1rem;
      border: 1px solid rgba(180, 35, 24, 0.22);
      border-radius: 1rem;
      background: #fffbfa;
      color: #7a271a;
    }

    .pb-error-state__title,
    .pb-error-state__message,
    .pb-error-state__reference {
      margin: 0;
    }

    .pb-error-state__title {
      font-size: 1rem;
      color: #912018;
    }

    .pb-error-state__reference {
      font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
      font-size: 0.85rem;
    }

    .pb-error-state__retry {
      justify-self: start;
      border: 0;
      border-radius: 999px;
      padding: 0.65rem 0.9rem;
      background: #b42318;
      color: #fff;
      font-weight: 700;
      cursor: pointer;
    }
  `,
})
export class ErrorStateComponent {
  @Input({ required: true }) title = '';
  @Input({ required: true }) message = '';
  @Input() correlationId: string | null = null;
  @Input() retryLabel: string | null = 'Reintentar';

  @Output() readonly retry = new EventEmitter<void>();
}
