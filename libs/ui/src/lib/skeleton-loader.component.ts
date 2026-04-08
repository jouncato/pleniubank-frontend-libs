import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type SkeletonLoaderVariant = 'row' | 'card' | 'text';

@Component({
  selector: 'pb-skeleton-loader',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="pb-skeleton"
      [class.pb-skeleton--row]="variant === 'row'"
      [class.pb-skeleton--card]="variant === 'card'"
      [class.pb-skeleton--text]="variant === 'text'"
      [attr.aria-busy]="true"
      [attr.aria-label]="ariaLabel"
    >
      @for (_ of placeholders; track $index) {
        <div class="pb-skeleton__item">
          @if (variant === 'text') {
            <span class="pb-skeleton__line pb-skeleton__line--lg"></span>
            <span class="pb-skeleton__line"></span>
            <span class="pb-skeleton__line pb-skeleton__line--sm"></span>
          } @else if (variant === 'card') {
            <span class="pb-skeleton__block pb-skeleton__block--title"></span>
            <span class="pb-skeleton__block pb-skeleton__block--body"></span>
            <span class="pb-skeleton__block pb-skeleton__block--body"></span>
            <span class="pb-skeleton__block pb-skeleton__block--action"></span>
          } @else {
            <span class="pb-skeleton__row-cell pb-skeleton__row-cell--primary"></span>
            <span class="pb-skeleton__row-cell"></span>
            <span class="pb-skeleton__row-cell"></span>
            <span class="pb-skeleton__row-cell pb-skeleton__row-cell--sm"></span>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .pb-skeleton {
      display: grid;
      gap: 0.9rem;
    }

    .pb-skeleton--card {
      grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
    }

    .pb-skeleton__item {
      display: grid;
      gap: 0.7rem;
      padding: 0.95rem;
      border: 1px solid rgba(15, 23, 42, 0.06);
      border-radius: 1rem;
      background: rgba(255, 255, 255, 0.95);
    }

    .pb-skeleton--text .pb-skeleton__item {
      padding: 0;
      border: 0;
      background: transparent;
    }

    .pb-skeleton__line,
    .pb-skeleton__block,
    .pb-skeleton__row-cell {
      display: block;
      border-radius: 999px;
      background: linear-gradient(90deg, #e4e7ec 0%, #f2f4f7 50%, #e4e7ec 100%);
      background-size: 200% 100%;
      animation: pb-skeleton-pulse 1.2s linear infinite;
    }

    .pb-skeleton__line {
      height: 0.85rem;
      width: 100%;
    }

    .pb-skeleton__line--lg {
      width: 45%;
      height: 1.05rem;
    }

    .pb-skeleton__line--sm {
      width: 72%;
    }

    .pb-skeleton__block {
      height: 0.95rem;
    }

    .pb-skeleton__block--title {
      width: 48%;
      height: 1.2rem;
    }

    .pb-skeleton__block--body {
      width: 100%;
    }

    .pb-skeleton__block--action {
      width: 36%;
      height: 2.2rem;
      margin-top: 0.3rem;
    }

    .pb-skeleton__row-cell {
      height: 1rem;
      width: 100%;
    }

    .pb-skeleton__row-cell--primary {
      width: 38%;
    }

    .pb-skeleton__row-cell--sm {
      width: 22%;
    }

    @keyframes pb-skeleton-pulse {
      from {
        background-position: 200% 0;
      }
      to {
        background-position: -200% 0;
      }
    }
  `,
})
export class SkeletonLoaderComponent {
  @Input() variant: SkeletonLoaderVariant = 'row';
  @Input() count = 3;
  @Input() ariaLabel = 'Cargando contenido';

  get placeholders(): number[] {
    const total = Number.isFinite(this.count) && this.count > 0 ? Math.floor(this.count) : 1;
    return Array.from({ length: total }, (_, index) => index);
  }
}
