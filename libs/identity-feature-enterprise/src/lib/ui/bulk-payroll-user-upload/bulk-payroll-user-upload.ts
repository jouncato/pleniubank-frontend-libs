import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, computed, inject, signal } from '@angular/core';
import { PbIconComponent } from '@pleniu/ui';
import type { BulkCreatePayrollUserResultEntry } from 'identity-domain';
import { BulkPayrollUserUploadVm, ParsedPayrollUserRow } from '../../vm/bulk-payroll-user-upload';

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

type ResultFilter = 'all' | 'created' | 'skipped' | 'error';

interface ResultGroupCounts {
  total: number;
  created: number;
  skipped: number;
  error: number;
}

/** Grupo de filas de la vista previa por Unidad de Negocio -- dimensión real
 * de negocio, no solo una lista plana (facilita revisar lotes que mezclan
 * varias unidades antes de confirmar). */
interface RowsBySubEnterprise {
  subEnterpriseId: string;
  label: string;
  rows: ParsedPayrollUserRow[];
}

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
export class BulkPayrollUserUploadForm implements OnInit {
  protected readonly vm = inject(BulkPayrollUserUploadVm);
  protected readonly stages = BULK_PAYROLL_USER_STAGES;

  @Input({ required: true }) enterpriseId!: string;
  /** El canal ops-asistido (Backoffice) ya muestra título/descripción en el
   * hero de la página contenedora -- en `compact` se omite el encabezado
   * propio (`bpu__head`) para no repetir el mismo texto dos veces en
   * pantalla. Customer Portal (autoservicio, sin ese hero) deja el default
   * `false` sin cambios. */
  @Input() compact = false;
  @Output() completed = new EventEmitter<BulkPayrollUserUploadCompletedEvent>();

  protected readonly dragging = signal(false);
  protected readonly resultQuery = signal('');
  protected readonly resultFilter = signal<ResultFilter>('all');

  ngOnInit(): void {
    this.vm.loadSubEnterpriseNames(this.enterpriseId);
  }

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

  /** Momento real en que la carga terminó -- fecha del informe, no la de
   * apertura/impresión de la pantalla. */
  protected readonly completedAt = signal<Date | null>(null);

  async confirm(): Promise<void> {
    await this.vm.submit(this.enterpriseId);
    if (this.vm.state() === 'done') {
      this.completedAt.set(new Date());
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

  /** Vista previa agrupada por Unidad de Negocio -- un lote real puede
   * mezclar varias unidades y conviene revisarlas separadas antes de
   * confirmar, no solo como una lista plana de N filas. */
  protected readonly rowsBySubEnterprise = computed<RowsBySubEnterprise[]>(() => {
    const groups = new Map<string, ParsedPayrollUserRow[]>();
    for (const row of this.vm.rows()) {
      const list = groups.get(row.sub_enterprise_id) ?? [];
      list.push(row);
      groups.set(row.sub_enterprise_id, list);
    }
    return Array.from(groups.entries()).map(([subEnterpriseId, rows]) => ({
      subEnterpriseId,
      label: this.vm.subEnterpriseLabel(subEnterpriseId),
      rows,
    }));
  });

  /** F: si algún grupo no resolvió a una Unidad de Negocio real (typo o ID
   * de otra empresa en el Excel), bloquea la confirmación en vez de dejar
   * que el backend rechace cada fila una por una después de intentar
   * crear cuentas -- mismo texto que ya devuelve `vm.subEnterpriseLabel()`
   * para el caso "no encontrado". */
  protected readonly hasUnresolvedSubEnterprise = computed(() =>
    this.rowsBySubEnterprise().some((group) => group.label === 'Unidad no encontrada'),
  );

  /** Conteos del resultado, fuente única para los KPI, el anillo de
   * proporción y los chips de filtro -- evita recorrer `vm.results()` por
   * separado en cada uno. */
  protected readonly resultCounts = computed<ResultGroupCounts>(() => {
    const entries = this.vm.results();
    return {
      total: entries.length,
      created: entries.filter((e) => e.status === 'created').length,
      skipped: entries.filter((e) => e.status === 'skipped').length,
      error: entries.filter((e) => e.status === 'error').length,
    };
  });

  /** `conic-gradient` puro en CSS para el anillo de proporción del informe
   * -- sin librería de gráficos, tres tramos (creadas/omitidas/error) en el
   * mismo orden que la leyenda de KPIs. */
  protected readonly resultRingStyle = computed<Record<string, string>>(() => {
    const { total, created, skipped } = this.resultCounts();
    if (total === 0) {
      return { background: 'conic-gradient(var(--bpu-ring-track) 0deg 360deg)' };
    }
    const createdDeg = (created / total) * 360;
    const skippedDeg = createdDeg + (skipped / total) * 360;
    return {
      background: `conic-gradient(
        var(--bpu-ring-created) 0deg ${createdDeg}deg,
        var(--bpu-ring-skipped) ${createdDeg}deg ${skippedDeg}deg,
        var(--bpu-ring-error) ${skippedDeg}deg 360deg
      )`,
    };
  });

  protected readonly resultRingPercent = computed(() => {
    const { total, created } = this.resultCounts();
    return total === 0 ? 0 : Math.round((created / total) * 100);
  });

  /** Log filtrable -- búsqueda por referencia/correo + chips de estado,
   * para que el detalle no sea solo un volcado plano de filas. */
  protected readonly filteredResults = computed<BulkCreatePayrollUserResultEntry[]>(() => {
    const filter = this.resultFilter();
    const query = this.resultQuery().trim().toLowerCase();
    return this.vm.results().filter((entry) => {
      if (filter !== 'all' && entry.status !== filter) return false;
      if (!query) return true;
      return entry.fila_id.toLowerCase().includes(query) || entry.email.toLowerCase().includes(query);
    });
  });

  setResultFilter(filter: ResultFilter): void {
    this.resultFilter.set(filter);
  }

  /** Iniciales para los avatares de la vista previa/resultado -- mismo
   * patrón que `enterprise-detail`, nunca un ícono genérico por fila. */
  protected initials(name: string | null | undefined): string {
    const trimmed = (name ?? '').trim();
    if (!trimmed) return '—';
    return trimmed
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join('');
  }

  /** "Informe ejecutivo" para entregar a la Empresa Principal -- reusa la
   * impresión nativa del navegador (Guardar como PDF) con la hoja de
   * estilos `@media print` de este mismo componente en vez de sumar una
   * dependencia de generación de PDF solo para esta pantalla. */
  printReport(): void {
    window.print();
  }
}
