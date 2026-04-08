import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, input, output } from '@angular/core';

export interface ConfirmDialogSummaryItem {
  label: string;
  value: string;
}

/**
 * Dialogo modal accesible: role="dialog", aria-modal, cierre con Escape.
 */
@Component({
  selector: 'lib-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
})
export class ConfirmDialog {
  /** Titulo del dialogo (evita el atributo global HTML `title`). */
  readonly dialogTitle = input.required<string>();
  readonly message = input<string>();
  readonly summaryItems = input<ConfirmDialogSummaryItem[]>([]);
  readonly warning = input<string>();
  readonly confirmLabel = input('Confirmar');
  readonly cancelLabel = input('Cancelar');
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.cancelled.emit();
  }

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
