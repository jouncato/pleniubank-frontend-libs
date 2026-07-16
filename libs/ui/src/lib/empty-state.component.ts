import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PbIconComponent } from './pb-icon.component';

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
  | 'help'
  | 'default';

@Component({
  selector: 'pb-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PbIconComponent],
  template: `
    <section class="pb-empty-state" role="status" aria-live="polite">
      <div class="pb-empty-state__icon">
        <pb-icon [name]="iconName()" size="xl" />
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

  iconName(): 'account' | 'loan' | 'search' | 'info' {
    if (this.icon === 'accounts') return 'account';
    if (this.icon === 'loans') return 'loan';
    if (this.icon === 'search') return 'search';
    return 'info';
  }
  @Input({ required: true }) title = '';
  @Input() description = '';
  @Input() ctaLabel: string | null = null;
  @Input() ctaRoute: string | unknown[] | null = null;
  @Output() readonly cta = new EventEmitter<void>();
}
