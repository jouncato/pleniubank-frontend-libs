import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, inject, signal } from '@angular/core';
import { PbIconComponent } from '@pleniu/ui';
import { BulkPayrollUserUploadVm } from '../../vm/bulk-payroll-user-upload';

export interface BulkPayrollUserUploadCompletedEvent {
  usersCreated: number;
  hasExceptions: boolean;
}

/** Los 3 tramos del recorrido -- gobierna el riel de progreso del encabezado. */
export const BULK_PAYROLL_USER_STAGES = [
  { label: 'Cargar archivo', hint: 'Plantilla y datos', icon: 'upload' },
  { label: 'Revisar y confirmar', hint: 'Vista previa', icon: 'sectors' },
  { label: 'Resultado', hint: 'Trazabilidad', icon: 'shield-check' },
] as const;

/**
 * Carga masiva de cuentas de usuario para Anticipo de Nómina (exclusiva del
 * módulo payroll-advances), compartida entre Backoffice (staff,
 * `enterpriseId` explícito elegido en un picker) y Customer Portal
 * (autoservicio, `enterpriseId` implícito de la sesión) -- mismo criterio
 * dual-canal que `BulkHierarchyUploadForm`, componente hermano deliberado
 * en vez de una extensión de ese: aquí se crea una cuenta real con
 * contraseña temporal, ligada a una Unidad de Negocio YA EXISTENTE -- no se
 * crean unidades en este flujo (para eso está la carga masiva de
 * jerarquía). El titular sigue completando su propia verificación de
 * identidad (OTP+KYC+consentimiento); nada se certifica en bulk.
 */
@Component({
  selector: 'lib-bulk-payroll-user-upload',
  imports: [CommonModule, PbIconComponent],
  templateUrl: './bulk-payroll-user-upload.html',
  styleUrl: './bulk-payroll-user-upload.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BulkPayrollUserUploadForm {
  protected readonly vm = inject(BulkPayrollUserUploadVm);
  protected readonly stages = BULK_PAYROLL_USER_STAGES;

  @Input({ required: true }) enterpriseId!: string;
  @Output() completed = new EventEmitter<BulkPayrollUserUploadCompletedEvent>();

  protected readonly dragging = signal(false);

  protected readonly activeStage = computed(() => {
    switch (this.vm.state()) {
      case 'idle':
      case 'invalid':
        return 0;
      case 'parsed':
      case 'submitting':
        return 1;
      default:
        return 2;
    }
  });

  downloadTemplate(): void {
    this.vm.downloadTemplate();
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    await this.vm.loadFile(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  onDragLeave(): void {
    this.dragging.set(false);
  }

  async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    this.dragging.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    await this.vm.loadFile(file);
  }

  async confirm(): Promise<void> {
    await this.vm.submit(this.enterpriseId);
    if (this.vm.state() === 'done') {
      this.completed.emit({
        usersCreated: this.vm.results().filter((e) => e.status === 'created').length,
        hasExceptions: this.vm.exceptionRows().length > 0,
      });
    }
  }

  downloadExceptions(): void {
    this.vm.downloadExceptionsReport();
  }

  startOver(): void {
    this.vm.reset();
  }

  protected readonly totalRows = () => this.vm.rows().length;

  protected countBy(entries: { status: string }[], status: string): number {
    return entries.filter((e) => e.status === status).length;
  }
}
