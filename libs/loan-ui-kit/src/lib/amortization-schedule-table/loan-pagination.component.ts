import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';

@Component({
  selector: 'pleniu-loan-pagination',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="pagination" [attr.aria-label]="'Paginación, ' + totalPages() + ' páginas'">
      <button
        type="button"
        class="page-btn"
        [disabled]="page() <= 1"
        (click)="go(page() - 1)"
        aria-label="Página anterior"
      >‹</button>

      @for (p of pages(); track p) {
        <button
          type="button"
          class="page-btn"
          [class.page-btn--active]="p === page()"
          [attr.aria-current]="p === page() ? 'page' : null"
          (click)="go(p)"
        >{{ p }}</button>
      }

      <button
        type="button"
        class="page-btn"
        [disabled]="page() >= totalPages()"
        (click)="go(page() + 1)"
        aria-label="Página siguiente"
      >›</button>
    </nav>
  `,
  styles: `
    .pagination { display: flex; gap: 0.25rem; align-items: center; }
    .page-btn {
      min-width: 2rem;
      padding: 0.2rem 0.5rem;
      border: 1px solid var(--pleniu-color-border, #d1d5db);
      background: transparent;
      border-radius: 4px;
      cursor: pointer;
      font: inherit;
      color: var(--pleniu-color-text, #374151);
    }
    .page-btn:disabled { opacity: 0.4; cursor: default; }
    .page-btn--active {
      background: var(--pleniu-color-primary-600, #2563eb);
      color: #fff;
      border-color: var(--pleniu-color-primary-600, #2563eb);
    }
  `,
})
export class LoanPaginationComponent {
  readonly total = input.required<number>();
  readonly pageSize = input<number>(12);
  readonly page = model<number>(1);

  readonly totalPages = computed(() => Math.ceil(this.total() / this.pageSize()));
  readonly pages = computed(() =>
    Array.from({ length: this.totalPages() }, (_, i) => i + 1),
  );

  go(p: number): void {
    if (p >= 1 && p <= this.totalPages()) {
      this.page.set(p);
    }
  }
}
