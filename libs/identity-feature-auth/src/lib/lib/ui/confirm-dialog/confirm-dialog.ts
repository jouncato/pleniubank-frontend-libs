import { CommonModule } from '@angular/common';
import { Component, HostListener, input, output } from '@angular/core';

/**
 * Diálogo modal accesible (I-05): role="dialog", aria-modal, cierre con Escape.
 */
@Component({
  selector: 'lib-confirm-dialog',
  imports: [CommonModule],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
})
export class ConfirmDialog {
  /** Título del diálogo (evita el atributo global HTML `title`). */
  readonly dialogTitle = input.required<string>();
  readonly message = input<string>();
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
