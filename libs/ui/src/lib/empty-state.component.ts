import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';

export type EmptyStateIcon =
  | 'accounts'
  | 'loans'
  | 'customers'
  | 'products'
  | 'contracts'
  | 'templates'
  | 'audit'
  | 'internal'
  | 'users'
  | 'enterprises'
  | 'search'
  | 'default';

@Component({
  selector: 'pb-empty-state',
  imports: [RouterLink],
  template: `
    <section class="pb-empty-state" role="status" aria-live="polite">
      <div class="pb-empty-state__icon" aria-hidden="true">
        @switch (icon) {
          @case ('accounts') {
            <svg viewBox="0 0 64 64" focusable="false">
              <rect x="10" y="18" width="44" height="28" rx="8"></rect>
              <path d="M18 30h28"></path>
              <circle cx="22" cy="38" r="2.5"></circle>
            </svg>
          }
          @case ('search') {
            <svg viewBox="0 0 64 64" focusable="false">
              <circle cx="28" cy="28" r="14"></circle>
              <path d="M39 39l11 11"></path>
            </svg>
          }
          @case ('loans') {
            <svg viewBox="0 0 64 64" focusable="false">
              <rect x="14" y="12" width="36" height="40" rx="8"></rect>
              <path d="M23 24h18M23 32h18M23 40h10"></path>
            </svg>
          }
          @default {
            <svg viewBox="0 0 64 64" focusable="false">
              <rect x="12" y="14" width="40" height="36" rx="10"></rect>
              <path d="M22 28h20M22 36h12"></path>
            </svg>
          }
        }
      </div>

      <div class="pb-empty-state__body">
        <h2 class="pb-empty-state__title">{{ title }}</h2>
        @if (description) {
          <p class="pb-empty-state__description">{{ description }}</p>
        }
      </div>

      @if (ctaLabel) {
        @if (ctaRoute) {
          <a class="pb-empty-state__cta" [routerLink]="ctaRoute">{{ ctaLabel }}</a>
        } @else {
          <button type="button" class="pb-empty-state__cta" (click)="cta.emit()">{{ ctaLabel }}</button>
        }
      }
    </section>
  `,
  styles: `
    .pb-empty-state {
      display: grid;
      justify-items: start;
      gap: 1rem;
      padding: 1.4rem;
      border: 1px dashed rgba(15, 23, 42, 0.14);
      border-radius: 1.25rem;
      background: linear-gradient(180deg, rgba(248, 250, 252, 0.96), rgba(255, 255, 255, 0.98));
    }

    .pb-empty-state__icon {
      display: grid;
      place-items: center;
      width: 4rem;
      height: 4rem;
      border-radius: 1rem;
      background: rgba(11, 99, 182, 0.08);
      color: #0b63b6;
    }

    .pb-empty-state__icon svg {
      width: 2.1rem;
      height: 2.1rem;
      fill: none;
      stroke: currentColor;
      stroke-width: 2.2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .pb-empty-state__body {
      display: grid;
      gap: 0.35rem;
    }

    .pb-empty-state__title {
      margin: 0;
      color: #101828;
      font-size: 1.15rem;
    }

    .pb-empty-state__description {
      margin: 0;
      color: #667085;
      line-height: 1.5;
      max-width: 40rem;
    }

    .pb-empty-state__cta {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 0;
      border-radius: 999px;
      padding: 0.72rem 1rem;
      background: #101828;
      color: #fff;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
    }
  `,
})
export class EmptyStateComponent {
  @Input() icon: EmptyStateIcon = 'default';
  @Input({ required: true }) title = '';
  @Input() description = '';
  @Input() ctaLabel: string | null = null;
  @Input() ctaRoute: string | unknown[] | null = null;
  @Output() readonly cta = new EventEmitter<void>();
}
