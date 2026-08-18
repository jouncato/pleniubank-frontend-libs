import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, inject, signal } from '@angular/core';
import { PbIconComponent } from '@pleniu/ui';
import { BulkHierarchyUploadVm } from '../../vm/bulk-hierarchy-upload';

/** Los 3 tramos del recorrido -- gobierna el riel de progreso del encabezado. */
export const BULK_HIERARCHY_STAGES = [
  { label: 'Cargar archivo', hint: 'Plantilla y datos', icon: 'upload' },
  { label: 'Revisar y confirmar', hint: 'Vista previa', icon: 'sectors' },
  { label: 'Resultado', hint: 'Trazabilidad', icon: 'shield-check' },
] as const;

export interface BulkHierarchyUploadCompletedEvent {
  unitsCreated: number;
  employeesInvited: number;
  hasExceptions: boolean;
  /** Unidades creadas con éxito (id + company_code) -- para un caller que
   * necesite un paso adicional sobre ellas (ej. Backoffice enrolándolas a
   * un Contrato Maestro). Vacío si no se cargaron Unidades en este archivo. */
  createdUnits: { sub_enterprise_id: string; business_name: string; company_code: string }[];
}

/**
 * Carga masiva de Unidades de Negocio + invitaciones de empleado (plan
 * 2026-08-18), compartida entre Backoffice (staff, `enterpriseId` explícito
 * elegido en un picker) y Customer Portal (self-service, `enterpriseId`
 * implícito de la sesión) -- mismo criterio que `InviteEmployeeForm`, ya
 * consumido por ambos portales desde esta misma librería.
 *
 * Deliberadamente NO incluye el paso de enrolamiento a Contrato Maestro
 * (Core/loan-domain): esta librería es de dominio identity/enterprise, y
 * ese paso es exclusivo de staff de plataforma con control dual -- vive en
 * `pleniubank-backoffice-portal` como un paso adicional después de este
 * componente, no aquí.
 */
@Component({
  selector: 'lib-bulk-hierarchy-upload',
  imports: [CommonModule, PbIconComponent],
  templateUrl: './bulk-hierarchy-upload.html',
  styleUrl: './bulk-hierarchy-upload.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BulkHierarchyUploadForm {
  protected readonly vm = inject(BulkHierarchyUploadVm);
  protected readonly stages = BULK_HIERARCHY_STAGES;

  @Input({ required: true }) enterpriseId!: string;
  @Output() completed = new EventEmitter<BulkHierarchyUploadCompletedEvent>();

  protected readonly dragging = signal(false);

  /** Tramo activo del riel de progreso (0-2), derivado del estado real de la VM. */
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
      const createdUnits = this.vm.createdUnits();
      this.completed.emit({
        unitsCreated: createdUnits.length,
        employeesInvited: this.vm.employeeResults().filter((e) => e.status === 'invited').length,
        hasExceptions: this.vm.exceptionRows().length > 0,
        createdUnits: createdUnits.map(({ sub_enterprise_id, business_name, company_code }) => ({
          sub_enterprise_id, business_name, company_code,
        })),
      });
    }
  }

  downloadExceptions(): void {
    this.vm.downloadExceptionsReport();
  }

  startOver(): void {
    this.vm.reset();
  }

  protected readonly totalUnits = () => this.vm.units().length;
  protected readonly totalEmployees = () => this.vm.employees().length;

  protected countBy(entries: { status: string }[], status: string): number {
    return entries.filter((e) => e.status === status).length;
  }
}
