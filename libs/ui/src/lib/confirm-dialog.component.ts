import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'pb-confirm-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open) {
      <div class="pb-confirm-dialog__backdrop" (click)="onBackdropClick($event)">
        <section
          class="pb-confirm-dialog"
          role="alertdialog"
          aria-modal="true"
          [attr.aria-labelledby]="titleId"
          [attr.aria-describedby]="descriptionId"
        >
          <h2 class="pb-confirm-dialog__title" [id]="titleId">{{ title }}</h2>
          <p class="pb-confirm-dialog__body" [id]="descriptionId">{{ body }}</p>

          <div class="pb-confirm-dialog__actions">
            <button #cancelButton type="button" class="pb-confirm-dialog__cancel" (click)="cancel.emit()">
              {{ cancelLabel }}
            </button>
            <button
              type="button"
              class="pb-confirm-dialog__confirm"
              [class.pb-confirm-dialog__confirm--destructive]="destructive"
              (click)="confirm.emit()"
            >
              {{ confirmLabel }}
            </button>
          </div>
        </section>
      </div>
    }
  `,
  styles: `
    .pb-confirm-dialog__backdrop {
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: grid;
      place-items: center;
      padding: 1.25rem;
      background: rgba(15, 23, 42, 0.56);
    }

    .pb-confirm-dialog {
      width: min(100%, 30rem);
      display: grid;
      gap: 1rem;
      padding: 1.5rem;
      border-radius: 1.25rem;
      background: #fff;
      box-shadow: 0 24px 80px rgba(15, 23, 42, 0.22);
    }

    .pb-confirm-dialog__title,
    .pb-confirm-dialog__body {
      margin: 0;
    }

    .pb-confirm-dialog__title {
      color: #101828;
      font-size: 1.15rem;
    }

    .pb-confirm-dialog__body {
      color: #475467;
      line-height: 1.5;
    }

    .pb-confirm-dialog__actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .pb-confirm-dialog__cancel,
    .pb-confirm-dialog__confirm {
      border: 0;
      border-radius: 999px;
      padding: 0.72rem 1rem;
      font-weight: 700;
      cursor: pointer;
    }

    .pb-confirm-dialog__cancel {
      background: #f2f4f7;
      color: #344054;
    }

    .pb-confirm-dialog__confirm {
      background: #101828;
      color: #fff;
    }

    .pb-confirm-dialog__confirm--destructive {
      background: #b42318;
    }
  `,
})
export class ConfirmDialogComponent implements AfterViewChecked {
  private hasFocusedCancel = false;

  readonly titleId = `pb-confirm-dialog-title-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
  readonly descriptionId = `pb-confirm-dialog-body-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;

  @Input() open = false;
  @Input({ required: true }) title = '';
  @Input({ required: true }) body = '';
  @Input() cancelLabel = 'Cancelar';
  @Input() confirmLabel = 'Confirmar';
  @Input() destructive = false;

  @Output() readonly cancel = new EventEmitter<void>();
  @Output() readonly confirm = new EventEmitter<void>();

  @ViewChild('cancelButton') private cancelButton?: ElementRef<HTMLButtonElement>;

  ngAfterViewChecked(): void {
    if (!this.open) {
      this.hasFocusedCancel = false;
      return;
    }
    if (!this.hasFocusedCancel) {
      this.cancelButton?.nativeElement.focus();
      this.hasFocusedCancel = true;
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open) {
      this.cancel.emit();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.cancel.emit();
    }
  }
}
