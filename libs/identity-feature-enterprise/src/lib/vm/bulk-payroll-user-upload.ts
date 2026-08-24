import { Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import * as XLSX from 'xlsx';
import {
  BulkCreatePayrollUserItem,
  BulkCreatePayrollUserResultEntry,
  CustomerDocumentType,
} from 'identity-domain';
import { IdentityEnterpriseApiService } from '@pleniu/identity-data-access';
import { mapHttpError } from '@pleniu/shared-http';

const SHEET_NAME = 'Usuarios';
const REQUIRED_COLUMNS = [
  'fila_id',
  'full_name',
  'email',
  'phone',
  'document_type',
  'document_number',
  'sub_enterprise_id',
] as const;
const VALID_DOCUMENT_TYPES: readonly CustomerDocumentType[] = ['CC', 'CE', 'PP', 'TI'];
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ParsedPayrollUserRow extends BulkCreatePayrollUserItem {
  rowNumber: number;
}

export interface PayrollUserParseIssue {
  rowNumber: number;
  message: string;
}

export interface BulkPayrollUserResultRow {
  fila_id: string;
  identifier: string;
  status: 'created' | 'skipped' | 'error';
  reason: string;
}

export type BulkPayrollUserUploadState = 'idle' | 'parsed' | 'invalid' | 'submitting' | 'done' | 'error';

/**
 * Carga masiva de cuentas de usuario para Anticipo de Nómina (exclusiva del
 * módulo payroll-advances). A diferencia de `BulkHierarchyUploadVm` (crea
 * Unidades de Negocio + invita empleados por correo, sin password), esta
 * VM crea cuentas de usuario reales con contraseña temporal directamente,
 * asociadas a una Unidad de Negocio YA EXISTENTE (`sub_enterprise_id` real
 * en el archivo -- no se crean unidades en este flujo, para eso está la
 * carga masiva de jerarquía). Deliberadamente un VM/componente hermano
 * separado, no una extensión del existente: semántica de fila distinta
 * (password, rol, creación real de cuenta vs. invitación self-service).
 */
@Injectable({ providedIn: 'root' })
export class BulkPayrollUserUploadVm {
  readonly state = signal<BulkPayrollUserUploadState>('idle');
  readonly fileName = signal<string | null>(null);
  readonly parseIssues = signal<PayrollUserParseIssue[]>([]);
  readonly rows = signal<ParsedPayrollUserRow[]>([]);
  readonly errorMessage = signal<string | null>(null);
  readonly results = signal<BulkCreatePayrollUserResultEntry[]>([]);
  /** `sub_enterprise_id` -> `business_name`, para nunca mostrar el UUID crudo
   * en la vista previa (regla del proyecto, auditoría 2026-08-01). */
  readonly subEnterpriseNames = signal<Record<string, string>>({});

  constructor(private readonly api: IdentityEnterpriseApiService) {}

  /** Carga las Unidades de Negocio de la empresa para resolver nombres en la
   * vista previa -- reutiliza el mismo endpoint dual-canal (staff u
   * `enterprise_admin`/`principal` en su propia empresa) que ya autoriza el
   * envío del lote, así que nunca falla por permisos donde el submit no
   * fallaría. */
  loadSubEnterpriseNames(enterpriseId: string): void {
    this.api.listSubEnterprises(enterpriseId, { limit: 200 }).subscribe({
      next: (env) => {
        const map: Record<string, string> = {};
        for (const s of env.data ?? []) map[s.sub_enterprise_id] = s.business_name;
        this.subEnterpriseNames.set(map);
      },
      error: () => this.subEnterpriseNames.set({}),
    });
  }

  /** Nunca muestra el UUID crudo: si el nombre no se pudo resolver, indica
   * que la unidad no fue encontrada en vez de exponer el ID interno. */
  subEnterpriseLabel(subEnterpriseId: string): string {
    return this.subEnterpriseNames()[subEnterpriseId] ?? 'Unidad no encontrada';
  }

  downloadTemplate(): void {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([
        [...REQUIRED_COLUMNS],
        [
          'P-001',
          'Ana María Gómez',
          'ana.gomez@empresa.com',
          '+573000000000',
          'CC',
          '1020304050',
          '00000000-0000-0000-0000-000000000000',
        ],
      ]),
      SHEET_NAME,
    );
    const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'plantilla-carga-masiva-usuarios-nomina.xlsx';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async loadFile(file: File): Promise<void> {
    this.reset();
    this.fileName.set(file.name);
    const buffer = await file.arrayBuffer();
    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(buffer, { type: 'array' });
    } catch {
      this.parseIssues.set([{ rowNumber: 0, message: 'No se pudo leer el archivo. Verifica que sea un .xlsx o .csv válido.' }]);
      this.state.set('invalid');
      return;
    }

    const issues: PayrollUserParseIssue[] = [];
    const rows = this.parseSheet(workbook, issues);
    this.rows.set(rows);
    this.parseIssues.set(issues);
    this.state.set(issues.length > 0 ? 'invalid' : 'parsed');
  }

  private parseSheet(workbook: XLSX.WorkBook, issues: PayrollUserParseIssue[]): ParsedPayrollUserRow[] {
    const sheet = workbook.Sheets[SHEET_NAME];
    if (!sheet) {
      issues.push({ rowNumber: 0, message: `No se encontró la hoja "${SHEET_NAME}".` });
      return [];
    }
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
    const seenFilaIds = new Set<string>();
    const parsed: ParsedPayrollUserRow[] = [];
    rawRows.forEach((row, index) => {
      const rowNumber = index + 2;
      const missing = REQUIRED_COLUMNS.filter((col) => String(row[col] ?? '').trim() === '');
      if (missing.length > 0) {
        issues.push({ rowNumber, message: `Faltan columnas: ${missing.join(', ')}.` });
        return;
      }
      const filaId = String(row['fila_id']).trim();
      if (seenFilaIds.has(filaId)) {
        issues.push({ rowNumber, message: `fila_id "${filaId}" repetido en esta hoja.` });
        return;
      }
      seenFilaIds.add(filaId);
      const documentType = String(row['document_type']).trim().toUpperCase();
      if (!VALID_DOCUMENT_TYPES.includes(documentType as CustomerDocumentType)) {
        issues.push({
          rowNumber,
          message: `document_type "${documentType}" inválido (debe ser ${VALID_DOCUMENT_TYPES.join('/')}).`,
        });
        return;
      }
      const subEnterpriseId = String(row['sub_enterprise_id']).trim();
      if (!UUID_PATTERN.test(subEnterpriseId)) {
        issues.push({ rowNumber, message: `sub_enterprise_id "${subEnterpriseId}" no es un ID de unidad válido.` });
        return;
      }
      const countryCode = String(row['country_code'] ?? '').trim();
      parsed.push({
        rowNumber,
        fila_id: filaId,
        full_name: String(row['full_name']).trim(),
        email: String(row['email']).trim(),
        phone: String(row['phone']).trim(),
        document_type: documentType as CustomerDocumentType,
        document_number: String(row['document_number']).trim(),
        sub_enterprise_id: subEnterpriseId,
        country_code: countryCode || null,
      });
    });
    return parsed;
  }

  async submit(enterpriseId: string): Promise<void> {
    if (this.state() === 'submitting') return;
    this.state.set('submitting');
    this.errorMessage.set(null);

    try {
      const items: BulkCreatePayrollUserItem[] = this.rows().map((r) => ({
        fila_id: r.fila_id,
        full_name: r.full_name,
        email: r.email,
        phone: r.phone,
        document_type: r.document_type,
        document_number: r.document_number,
        sub_enterprise_id: r.sub_enterprise_id,
        country_code: r.country_code,
      }));
      const res = await firstValueFrom(this.api.bulkCreatePayrollUsers(enterpriseId, { items }));
      this.results.set(res.data?.entries ?? []);
      this.state.set('done');
    } catch (err: unknown) {
      const mapped = mapHttpError(err);
      this.errorMessage.set(mapped.errors[0]?.message ?? 'No se pudo procesar la carga masiva.');
      this.state.set('error');
    }
  }

  /** Filas con problema (`error`/`skipped`), para el reporte descargable. */
  exceptionRows(): BulkPayrollUserResultRow[] {
    return this.results()
      .filter((e) => e.status !== 'created')
      .map((e) => ({ fila_id: e.fila_id, identifier: e.email, status: e.status, reason: e.reason ?? '' }));
  }

  downloadExceptionsReport(): void {
    const rows = this.exceptionRows();
    const header = ['fila_id', 'Correo', 'Estado', 'Motivo'];
    const aoa = [header, ...rows.map((r) => [r.fila_id, r.identifier, r.status, r.reason])];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(aoa), 'Excepciones');
    const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'excepciones-carga-masiva-usuarios.xlsx';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  reset(): void {
    this.state.set('idle');
    this.fileName.set(null);
    this.parseIssues.set([]);
    this.rows.set([]);
    this.errorMessage.set(null);
    this.results.set([]);
  }
}
