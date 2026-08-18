import { Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import * as XLSX from 'xlsx';
import {
  BulkCreateSubEnterpriseItem,
  BulkCreateSubEnterpriseResultEntry,
  BulkInviteEmployeeItem,
  BulkInviteEmployeeResultEntry,
  EnterpriseDocumentType,
} from 'identity-domain';
import { IdentityEnterpriseApiService } from '@pleniu/identity-data-access';
import { mapHttpError } from '@pleniu/shared-http';

const UNITS_SHEET = 'Unidades de Negocio';
const EMPLOYEES_SHEET = 'Empleados';
const UNIT_REQUIRED_COLUMNS = [
  'fila_id',
  'business_name',
  'document_type',
  'document_number',
  'company_code',
  'email',
  'phone',
] as const;
const EMPLOYEE_REQUIRED_COLUMNS = ['fila_id', 'unit_ref', 'email'] as const;
const VALID_DOCUMENT_TYPES: readonly EnterpriseDocumentType[] = ['CC', 'CE', 'NIT', 'PP', 'TI'];
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ParsedUnitRow extends BulkCreateSubEnterpriseItem {
  rowNumber: number;
}

export interface ParsedEmployeeRow {
  rowNumber: number;
  fila_id: string;
  /** Referencia a la unidad: puede ser el `fila_id` de una fila de
   * Unidades de Negocio DE ESTE MISMO archivo, o un `sub_enterprise_id`
   * real ya existente (para invitar empleados a una unidad que ya existe). */
  unit_ref: string;
  email: string;
}

export interface ParseIssue {
  sheet: string;
  rowNumber: number;
  message: string;
}

/** Resultado consolidado de una fila, para el reporte de excepciones. */
export interface BulkHierarchyResultRow {
  sheet: string;
  fila_id: string;
  identifier: string;
  status: 'created' | 'invited' | 'skipped' | 'error';
  reason: string;
}

export type BulkHierarchyUploadState = 'idle' | 'parsed' | 'invalid' | 'submitting' | 'done' | 'error';

@Injectable({ providedIn: 'root' })
export class BulkHierarchyUploadVm {
  readonly state = signal<BulkHierarchyUploadState>('idle');
  readonly fileName = signal<string | null>(null);
  readonly parseIssues = signal<ParseIssue[]>([]);
  readonly units = signal<ParsedUnitRow[]>([]);
  readonly employees = signal<ParsedEmployeeRow[]>([]);
  readonly errorMessage = signal<string | null>(null);

  readonly unitResults = signal<BulkCreateSubEnterpriseResultEntry[]>([]);
  readonly employeeResults = signal<BulkInviteEmployeeResultEntry[]>([]);

  constructor(private readonly api: IdentityEnterpriseApiService) {}

  /** Genera la plantilla en blanco (2 hojas) para que el usuario la llene. */
  downloadTemplate(): void {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([
        [...UNIT_REQUIRED_COLUMNS],
        ['UN-001', 'Sede Bogotá', 'NIT', '900123456', 'UNT-BOG01', 'sede.bogota@empresa.com', '+573000000000'],
      ]),
      UNITS_SHEET,
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([
        [...EMPLOYEE_REQUIRED_COLUMNS],
        ['E-001', 'UN-001', 'empleado@empresa.com'],
      ]),
      EMPLOYEES_SHEET,
    );
    const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'plantilla-carga-masiva-jerarquia.xlsx';
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
      this.parseIssues.set([{ sheet: '-', rowNumber: 0, message: 'No se pudo leer el archivo. Verifica que sea un .xlsx o .csv válido.' }]);
      this.state.set('invalid');
      return;
    }

    const issues: ParseIssue[] = [];
    const units = this.parseUnitsSheet(workbook, issues);
    const employees = this.parseEmployeesSheet(workbook, issues);

    // Integridad referencial: una fila de empleado que referencia un fila_id
    // de Unidades que no existe EN EL ARCHIVO se acepta igual (puede ser un
    // sub_enterprise_id real ya existente) -- no es un error de formato, se
    // resuelve al enviar.
    this.units.set(units);
    this.employees.set(employees);
    this.parseIssues.set(issues);
    this.state.set(issues.length > 0 ? 'invalid' : 'parsed');
  }

  private parseUnitsSheet(workbook: XLSX.WorkBook, issues: ParseIssue[]): ParsedUnitRow[] {
    const sheet = workbook.Sheets[UNITS_SHEET];
    if (!sheet) {
      issues.push({ sheet: UNITS_SHEET, rowNumber: 0, message: `No se encontró la hoja "${UNITS_SHEET}".` });
      return [];
    }
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
    const seenFilaIds = new Set<string>();
    const parsed: ParsedUnitRow[] = [];
    rows.forEach((row, index) => {
      const rowNumber = index + 2; // +1 por encabezado, +1 por índice 0-based
      const missing = UNIT_REQUIRED_COLUMNS.filter((col) => String(row[col] ?? '').trim() === '');
      if (missing.length > 0) {
        issues.push({ sheet: UNITS_SHEET, rowNumber, message: `Faltan columnas: ${missing.join(', ')}.` });
        return;
      }
      const filaId = String(row['fila_id']).trim();
      if (seenFilaIds.has(filaId)) {
        issues.push({ sheet: UNITS_SHEET, rowNumber, message: `fila_id "${filaId}" repetido en esta hoja.` });
        return;
      }
      seenFilaIds.add(filaId);
      const documentType = String(row['document_type']).trim().toUpperCase();
      if (!VALID_DOCUMENT_TYPES.includes(documentType as EnterpriseDocumentType)) {
        issues.push({
          sheet: UNITS_SHEET, rowNumber,
          message: `document_type "${documentType}" inválido (debe ser ${VALID_DOCUMENT_TYPES.join('/')}).`,
        });
        return;
      }
      parsed.push({
        rowNumber,
        fila_id: filaId,
        business_name: String(row['business_name']).trim(),
        document_type: documentType as EnterpriseDocumentType,
        document_number: String(row['document_number']).trim(),
        company_code: String(row['company_code']).trim().toUpperCase(),
        email: String(row['email']).trim(),
        phone: String(row['phone']).trim(),
      });
    });
    return parsed;
  }

  private parseEmployeesSheet(workbook: XLSX.WorkBook, issues: ParseIssue[]): ParsedEmployeeRow[] {
    const sheet = workbook.Sheets[EMPLOYEES_SHEET];
    if (!sheet) {
      issues.push({ sheet: EMPLOYEES_SHEET, rowNumber: 0, message: `No se encontró la hoja "${EMPLOYEES_SHEET}".` });
      return [];
    }
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
    const parsed: ParsedEmployeeRow[] = [];
    rows.forEach((row, index) => {
      const rowNumber = index + 2;
      const missing = EMPLOYEE_REQUIRED_COLUMNS.filter((col) => String(row[col] ?? '').trim() === '');
      if (missing.length > 0) {
        issues.push({ sheet: EMPLOYEES_SHEET, rowNumber, message: `Faltan columnas: ${missing.join(', ')}.` });
        return;
      }
      parsed.push({
        rowNumber,
        fila_id: String(row['fila_id']).trim(),
        unit_ref: String(row['unit_ref']).trim(),
        email: String(row['email']).trim(),
      });
    });
    return parsed;
  }

  /**
   * Envía la carga en 2 pasos secuenciales: primero las Unidades de Negocio,
   * luego los Empleados usando el mapa fila_id→sub_enterprise_id armado SOLO
   * con las unidades creadas con éxito -- una fila de empleado cuya unidad
   * falló queda automáticamente en error, sin código especial (ver
   * `resolveSubEnterpriseId`). `unit_ref` que no coincide con ningún fila_id
   * del archivo se trata como un `sub_enterprise_id` real ya existente.
   */
  async submit(enterpriseId: string): Promise<void> {
    if (this.state() === 'submitting') return;
    this.state.set('submitting');
    this.errorMessage.set(null);

    try {
      const unitItems: BulkCreateSubEnterpriseItem[] = this.units().map((u) => ({
        fila_id: u.fila_id,
        business_name: u.business_name,
        document_type: u.document_type,
        document_number: u.document_number,
        company_code: u.company_code,
        email: u.email,
        phone: u.phone,
      }));

      let unitEntries: BulkCreateSubEnterpriseResultEntry[] = [];
      if (unitItems.length > 0) {
        const unitsRes = await firstValueFrom(this.api.bulkCreateSubEnterprises(enterpriseId, { items: unitItems }));
        unitEntries = unitsRes.data?.entries ?? [];
      }
      this.unitResults.set(unitEntries);

      const filaIdToSubEnterpriseId = new Map(
        unitEntries.filter((e) => e.status === 'created' && e.sub_enterprise_id).map((e) => [e.fila_id, e.sub_enterprise_id as string]),
      );

      const employeeItems: BulkInviteEmployeeItem[] = [];
      const unresolvedEmployeeEntries: BulkInviteEmployeeResultEntry[] = [];
      for (const emp of this.employees()) {
        const subEnterpriseId = filaIdToSubEnterpriseId.get(emp.unit_ref) ?? emp.unit_ref;
        const unitFailed = this.units().some((u) => u.fila_id === emp.unit_ref) && !filaIdToSubEnterpriseId.has(emp.unit_ref);
        if (unitFailed) {
          unresolvedEmployeeEntries.push({
            fila_id: emp.fila_id, status: 'error', email: emp.email,
            reason: `La unidad "${emp.unit_ref}" no se creó — revisa la hoja de Unidades.`,
          });
          continue;
        }
        // unit_ref que no coincide con ningún fila_id de este archivo se trata
        // como un sub_enterprise_id real ya existente -- pero si no tiene forma
        // de UUID, enviarlo igual rompería el request completo (el backend lo
        // tipa como UUID), arrastrando también las filas válidas del lote.
        if (!filaIdToSubEnterpriseId.has(emp.unit_ref) && !UUID_PATTERN.test(subEnterpriseId)) {
          unresolvedEmployeeEntries.push({
            fila_id: emp.fila_id, status: 'error', email: emp.email,
            reason: `"${emp.unit_ref}" no es un fila_id de este archivo ni un ID de unidad válido.`,
          });
          continue;
        }
        employeeItems.push({ fila_id: emp.fila_id, email: emp.email, sub_enterprise_id: subEnterpriseId });
      }

      let employeeEntries: BulkInviteEmployeeResultEntry[] = [];
      if (employeeItems.length > 0) {
        const employeesRes = await firstValueFrom(
          this.api.bulkInviteEmployees(enterpriseId, { items: employeeItems }),
        );
        employeeEntries = employeesRes.data?.entries ?? [];
      }
      this.employeeResults.set([...employeeEntries, ...unresolvedEmployeeEntries]);

      this.state.set('done');
    } catch (err: unknown) {
      const mapped = mapHttpError(err);
      this.errorMessage.set(mapped.errors[0]?.message ?? 'No se pudo procesar la carga masiva.');
      this.state.set('error');
    }
  }

  /** Unidades creadas con éxito, con su `company_code` (no viaja en
   * `BulkCreateSubEnterpriseResultEntry`, se recupera de la fila original
   * parseada por `fila_id`) -- lo que un caller (ej. Backoffice, para
   * enrolar al producto) necesita para construir la asignación masiva. */
  createdUnits(): { fila_id: string; sub_enterprise_id: string; business_name: string; company_code: string }[] {
    const byFilaId = new Map(this.units().map((u) => [u.fila_id, u]));
    return this.unitResults()
      .filter((e): e is BulkCreateSubEnterpriseResultEntry & { sub_enterprise_id: string } =>
        e.status === 'created' && !!e.sub_enterprise_id,
      )
      .map((e) => ({
        fila_id: e.fila_id,
        sub_enterprise_id: e.sub_enterprise_id,
        business_name: e.business_name,
        company_code: byFilaId.get(e.fila_id)?.company_code ?? '',
      }));
  }

  /** Filas con problema (`error`/`skipped`), para el reporte descargable. */
  exceptionRows(): BulkHierarchyResultRow[] {
    const unitRows: BulkHierarchyResultRow[] = this.unitResults()
      .filter((e) => e.status !== 'created')
      .map((e) => ({
        sheet: UNITS_SHEET, fila_id: e.fila_id, identifier: e.business_name,
        status: e.status, reason: e.reason ?? '',
      }));
    const employeeRows: BulkHierarchyResultRow[] = this.employeeResults()
      .filter((e) => e.status !== 'invited')
      .map((e) => ({
        sheet: EMPLOYEES_SHEET, fila_id: e.fila_id, identifier: e.email,
        status: e.status, reason: e.reason ?? '',
      }));
    return [...unitRows, ...employeeRows];
  }

  downloadExceptionsReport(): void {
    const rows = this.exceptionRows();
    const header = ['Hoja', 'fila_id', 'Identificador', 'Estado', 'Motivo'];
    const aoa = [header, ...rows.map((r) => [r.sheet, r.fila_id, r.identifier, r.status, r.reason])];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(aoa), 'Excepciones');
    const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'excepciones-carga-masiva.xlsx';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  reset(): void {
    this.state.set('idle');
    this.fileName.set(null);
    this.parseIssues.set([]);
    this.units.set([]);
    this.employees.set([]);
    this.errorMessage.set(null);
    this.unitResults.set([]);
    this.employeeResults.set([]);
  }
}
