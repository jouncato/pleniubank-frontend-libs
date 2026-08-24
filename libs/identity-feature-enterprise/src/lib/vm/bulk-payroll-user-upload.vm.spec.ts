import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import * as XLSX from 'xlsx';
import { IdentityEnterpriseApiService } from '@pleniu/identity-data-access';

import { BulkPayrollUserUploadVm } from './bulk-payroll-user-upload';

const VALID_SUB_ENTERPRISE_ID = '3f9e4b0a-9d2e-4c1a-8b7a-1a2b3c4d5e6f';

function buildWorkbookFile(rows: (string | number)[][], opts: { skipSheet?: boolean } = {}): File {
  const workbook = XLSX.utils.book_new();
  if (opts.skipSheet) {
    // Un workbook sin ninguna hoja no se puede serializar (XLSX.write lanza
    // "Workbook is empty") -- se agrega una hoja con nombre distinto para
    // ejercer el caso real: "la hoja Usuarios no existe", no "archivo vacío".
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([['otra_columna']]), 'OtraHoja');
  } else {
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([
        ['fila_id', 'full_name', 'email', 'phone', 'document_type', 'document_number', 'sub_enterprise_id'],
        ...rows,
      ]),
      'Usuarios',
    );
  }
  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  return new File([buffer], 'carga.xlsx');
}

describe('BulkPayrollUserUploadVm', () => {
  function setup(apiOverrides: Record<string, unknown> = {}) {
    TestBed.configureTestingModule({
      providers: [
        BulkPayrollUserUploadVm,
        { provide: IdentityEnterpriseApiService, useValue: apiOverrides },
      ],
    });
    return TestBed.inject(BulkPayrollUserUploadVm);
  }

  it('parses a valid file into rows, state -> parsed', async () => {
    const vm = setup();
    const file = buildWorkbookFile([
      ['P-001', 'Ana Gómez', 'ana@empresa.com', '+573000000000', 'CC', '1020304050', VALID_SUB_ENTERPRISE_ID],
    ]);

    await vm.loadFile(file);

    expect(vm.state()).toBe('parsed');
    expect(vm.rows()).toHaveLength(1);
    expect(vm.rows()[0]).toMatchObject({
      fila_id: 'P-001', full_name: 'Ana Gómez', email: 'ana@empresa.com',
      document_type: 'CC', document_number: '1020304050', sub_enterprise_id: VALID_SUB_ENTERPRISE_ID,
    });
  });

  it('flags missing required column as a parse issue, state -> invalid', async () => {
    const vm = setup();
    const file = buildWorkbookFile([
      ['P-001', 'Ana Gómez', '', '+573000000000', 'CC', '1020304050', VALID_SUB_ENTERPRISE_ID], // email vacío
    ]);

    await vm.loadFile(file);

    expect(vm.state()).toBe('invalid');
    expect(vm.parseIssues()).toHaveLength(1);
    expect(vm.parseIssues()[0].message).toContain('email');
  });

  it('flags a missing sheet as a parse issue', async () => {
    const vm = setup();
    const file = buildWorkbookFile([], { skipSheet: true });

    await vm.loadFile(file);

    expect(vm.state()).toBe('invalid');
    expect(vm.parseIssues().some((i) => i.message.includes('Usuarios'))).toBe(true);
  });

  it('flags a duplicate fila_id within the sheet', async () => {
    const vm = setup();
    const file = buildWorkbookFile([
      ['P-001', 'Ana Gómez', 'ana@empresa.com', '+573000000000', 'CC', '1020304050', VALID_SUB_ENTERPRISE_ID],
      ['P-001', 'Otra Persona', 'otra@empresa.com', '+573000000001', 'CC', '1020304051', VALID_SUB_ENTERPRISE_ID],
    ]);

    await vm.loadFile(file);

    expect(vm.state()).toBe('invalid');
    expect(vm.parseIssues().some((i) => i.message.includes('repetido'))).toBe(true);
  });

  it('rejects an invalid document_type', async () => {
    const vm = setup();
    const file = buildWorkbookFile([
      ['P-001', 'Ana Gómez', 'ana@empresa.com', '+573000000000', 'NIT', '1020304050', VALID_SUB_ENTERPRISE_ID],
    ]);

    await vm.loadFile(file);

    expect(vm.state()).toBe('invalid');
    expect(vm.parseIssues()[0].message).toContain('document_type');
  });

  it('rejects a sub_enterprise_id that is not a valid UUID', async () => {
    const vm = setup();
    const file = buildWorkbookFile([
      ['P-001', 'Ana Gómez', 'ana@empresa.com', '+573000000000', 'CC', '1020304050', 'UN-001'],
    ]);

    await vm.loadFile(file);

    expect(vm.state()).toBe('invalid');
    expect(vm.parseIssues()[0].message).toContain('sub_enterprise_id');
  });

  it('submit(): sends parsed rows and reports results, state -> done', async () => {
    const bulkCreatePayrollUsers = vi.fn(() =>
      of({
        data: {
          created: 1, skipped: 0, errors: 0,
          entries: [{ fila_id: 'P-001', status: 'created', user_id: 'u-1', email: 'ana@empresa.com' }],
        },
      }),
    );
    const vm = setup({ bulkCreatePayrollUsers });
    const file = buildWorkbookFile([
      ['P-001', 'Ana Gómez', 'ana@empresa.com', '+573000000000', 'CC', '1020304050', VALID_SUB_ENTERPRISE_ID],
    ]);
    await vm.loadFile(file);

    await vm.submit('ent-1');

    expect(bulkCreatePayrollUsers).toHaveBeenCalledWith('ent-1', {
      items: [
        {
          fila_id: 'P-001', full_name: 'Ana Gómez', email: 'ana@empresa.com', phone: '+573000000000',
          document_type: 'CC', document_number: '1020304050', sub_enterprise_id: VALID_SUB_ENTERPRISE_ID,
          country_code: null,
        },
      ],
    });
    expect(vm.state()).toBe('done');
    expect(vm.results()).toHaveLength(1);
  });

  it('submit(): surfaces a mapped error message on API failure', async () => {
    const bulkCreatePayrollUsers = vi.fn(() =>
      throwError(() => ({
        status: 403,
        url: '/bulk',
        error: { errors: [{ code: 'FORBIDDEN', message: 'No autorizado' }] },
      })),
    );
    const vm = setup({ bulkCreatePayrollUsers });
    const file = buildWorkbookFile([
      ['P-001', 'Ana Gómez', 'ana@empresa.com', '+573000000000', 'CC', '1020304050', VALID_SUB_ENTERPRISE_ID],
    ]);
    await vm.loadFile(file);

    await vm.submit('ent-1');

    expect(vm.state()).toBe('error');
    expect(vm.errorMessage()).toContain('No autorizado');
  });

  it('exceptionRows() returns only non-created rows', () => {
    const vm = setup();
    vm.results.set([
      { fila_id: 'P-001', status: 'created', email: 'a@b.com' },
      { fila_id: 'P-002', status: 'skipped', email: 'c@d.com', reason: 'ya existe' },
    ]);

    const rows = vm.exceptionRows();

    expect(rows).toHaveLength(1);
    expect(rows[0].fila_id).toBe('P-002');
  });

  it('loadSubEnterpriseNames(): resolves sub_enterprise_id to business_name for the preview', () => {
    const listSubEnterprises = vi.fn(() =>
      of({ data: [{ sub_enterprise_id: VALID_SUB_ENTERPRISE_ID, business_name: 'Unidad Norte' }] }),
    );
    const vm = setup({ listSubEnterprises });

    vm.loadSubEnterpriseNames('ent-1');

    expect(listSubEnterprises).toHaveBeenCalledWith('ent-1', { limit: 200 });
    expect(vm.subEnterpriseLabel(VALID_SUB_ENTERPRISE_ID)).toBe('Unidad Norte');
  });

  it('subEnterpriseLabel(): never falls back to the raw UUID when unresolved', () => {
    const listSubEnterprises = vi.fn(() => throwError(() => new Error('network error')));
    const vm = setup({ listSubEnterprises });

    vm.loadSubEnterpriseNames('ent-1');

    expect(vm.subEnterpriseLabel(VALID_SUB_ENTERPRISE_ID)).toBe('Unidad no encontrada');
    expect(vm.subEnterpriseLabel(VALID_SUB_ENTERPRISE_ID)).not.toContain('-');
  });

  it('reset() clears parsed data and results', async () => {
    const vm = setup();
    const file = buildWorkbookFile([
      ['P-001', 'Ana Gómez', 'ana@empresa.com', '+573000000000', 'CC', '1020304050', VALID_SUB_ENTERPRISE_ID],
    ]);
    await vm.loadFile(file);
    expect(vm.rows()).toHaveLength(1);

    vm.reset();

    expect(vm.state()).toBe('idle');
    expect(vm.rows()).toEqual([]);
    expect(vm.fileName()).toBeNull();
  });
});
