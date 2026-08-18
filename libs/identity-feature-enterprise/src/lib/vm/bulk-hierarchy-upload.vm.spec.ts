import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import * as XLSX from 'xlsx';
import { IdentityEnterpriseApiService } from '@pleniu/identity-data-access';

import { BulkHierarchyUploadVm } from './bulk-hierarchy-upload';

function buildWorkbookFile(
  unitRows: (string | number)[][],
  employeeRows: (string | number)[][],
  opts: { skipUnitsSheet?: boolean; skipEmployeesSheet?: boolean } = {},
): File {
  const workbook = XLSX.utils.book_new();
  if (!opts.skipUnitsSheet) {
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([
        ['fila_id', 'business_name', 'document_type', 'document_number', 'company_code', 'email', 'phone'],
        ...unitRows,
      ]),
      'Unidades de Negocio',
    );
  }
  if (!opts.skipEmployeesSheet) {
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([['fila_id', 'unit_ref', 'email'], ...employeeRows]),
      'Empleados',
    );
  }
  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  return new File([buffer], 'carga.xlsx');
}

describe('BulkHierarchyUploadVm', () => {
  function setup(apiOverrides: Record<string, unknown> = {}) {
    TestBed.configureTestingModule({
      providers: [
        BulkHierarchyUploadVm,
        { provide: IdentityEnterpriseApiService, useValue: apiOverrides },
      ],
    });
    return TestBed.inject(BulkHierarchyUploadVm);
  }

  it('parses a valid file into units and employees, state -> parsed', async () => {
    const vm = setup();
    const file = buildWorkbookFile(
      [['UN-001', 'Sede Bogotá', 'NIT', '900123456', 'UNT-BOG', 'sede@empresa.com', '+573000000000']],
      [['E-001', 'UN-001', 'empleado@empresa.com']],
    );

    await vm.loadFile(file);

    expect(vm.state()).toBe('parsed');
    expect(vm.units()).toHaveLength(1);
    expect(vm.units()[0]).toMatchObject({
      fila_id: 'UN-001', business_name: 'Sede Bogotá', document_type: 'NIT',
      document_number: '900123456', company_code: 'UNT-BOG', email: 'sede@empresa.com',
    });
    expect(vm.employees()).toHaveLength(1);
    expect(vm.employees()[0]).toMatchObject({ fila_id: 'E-001', unit_ref: 'UN-001', email: 'empleado@empresa.com' });
  });

  it('flags missing required column as a parse issue, state -> invalid', async () => {
    const vm = setup();
    const file = buildWorkbookFile(
      [['UN-001', 'Sede Bogotá', 'NIT', '900123456', '', 'sede@empresa.com', '+573000000000']], // company_code vacío
      [],
    );

    await vm.loadFile(file);

    expect(vm.state()).toBe('invalid');
    expect(vm.parseIssues()).toHaveLength(1);
    expect(vm.parseIssues()[0].message).toContain('company_code');
  });

  it('flags a missing sheet as a parse issue', async () => {
    const vm = setup();
    const file = buildWorkbookFile([], [], { skipEmployeesSheet: true });

    await vm.loadFile(file);

    expect(vm.state()).toBe('invalid');
    expect(vm.parseIssues().some((i) => i.message.includes('Empleados'))).toBe(true);
  });

  it('flags a duplicate fila_id within the units sheet', async () => {
    const vm = setup();
    const file = buildWorkbookFile(
      [
        ['UN-001', 'Sede A', 'NIT', '900111111', 'UNT-A', 'a@empresa.com', '+573000000001'],
        ['UN-001', 'Sede B', 'NIT', '900222222', 'UNT-B', 'b@empresa.com', '+573000000002'],
      ],
      [],
    );

    await vm.loadFile(file);

    expect(vm.state()).toBe('invalid');
    expect(vm.parseIssues().some((i) => i.message.includes('repetido'))).toBe(true);
  });

  it('rejects an invalid document_type', async () => {
    const vm = setup();
    const file = buildWorkbookFile(
      [['UN-001', 'Sede A', 'XX', '900111111', 'UNT-A', 'a@empresa.com', '+573000000001']],
      [],
    );

    await vm.loadFile(file);

    expect(vm.state()).toBe('invalid');
    expect(vm.parseIssues()[0].message).toContain('document_type');
  });

  it('submit(): builds fila_id -> sub_enterprise_id map only from successfully created rows', async () => {
    const bulkCreateSubEnterprises = vi.fn(() =>
      of({
        data: {
          created: 1, skipped: 0, errors: 1,
          entries: [
            { fila_id: 'UN-001', status: 'created', sub_enterprise_id: 'sub-real-1', business_name: 'Sede A' },
            { fila_id: 'UN-002', status: 'error', business_name: 'Sede B', reason: 'documento inválido' },
          ],
        },
      }),
    );
    const bulkInviteEmployees = vi.fn(() =>
      of({
        data: {
          invited: 1, skipped: 0, errors: 0,
          entries: [{ fila_id: 'E-001', status: 'invited', invite_id: 'inv-1', email: 'e1@empresa.com' }],
        },
      }),
    );
    const vm = setup({ bulkCreateSubEnterprises, bulkInviteEmployees });
    const file = buildWorkbookFile(
      [
        ['UN-001', 'Sede A', 'NIT', '900111111', 'UNT-A', 'a@empresa.com', '+573000000001'],
        ['UN-002', 'Sede B', 'NIT', '900222222', 'UNT-B', 'b@empresa.com', '+573000000002'],
      ],
      [
        ['E-001', 'UN-001', 'e1@empresa.com'], // unidad creada con éxito
        ['E-002', 'UN-002', 'e2@empresa.com'], // unidad que falló -> debe quedar en error sin llamar al API
      ],
    );
    await vm.loadFile(file);

    await vm.submit('ent-1');

    expect(bulkCreateSubEnterprises).toHaveBeenCalledWith('ent-1', {
      items: expect.arrayContaining([expect.objectContaining({ fila_id: 'UN-001' })]),
    });
    // Solo la fila referenciando la unidad creada llega al API de invitación.
    expect(bulkInviteEmployees).toHaveBeenCalledWith('ent-1', {
      items: [{ fila_id: 'E-001', email: 'e1@empresa.com', sub_enterprise_id: 'sub-real-1' }],
    });

    expect(vm.state()).toBe('done');
    const employeeResults = vm.employeeResults();
    expect(employeeResults).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fila_id: 'E-001', status: 'invited' }),
        expect.objectContaining({ fila_id: 'E-002', status: 'error' }),
      ]),
    );
    const failedRow = employeeResults.find((r) => r.fila_id === 'E-002');
    expect(failedRow?.reason).toContain('UN-002');
  });

  it('submit(): treats an employee unit_ref not present in the file as an existing sub_enterprise_id', async () => {
    const existingSubEnterpriseId = '3f9e4b0a-9d2e-4c1a-8b7a-1a2b3c4d5e6f';
    const bulkInviteEmployees = vi.fn(() =>
      of({
        data: {
          invited: 1, skipped: 0, errors: 0,
          entries: [{ fila_id: 'E-001', status: 'invited', invite_id: 'inv-1', email: 'e1@empresa.com' }],
        },
      }),
    );
    const vm = setup({ bulkInviteEmployees });
    const file = buildWorkbookFile(
      [],
      [['E-001', existingSubEnterpriseId, 'e1@empresa.com']],
      { skipUnitsSheet: false },
    );
    await vm.loadFile(file);

    await vm.submit('ent-1');

    expect(bulkInviteEmployees).toHaveBeenCalledWith('ent-1', {
      items: [{ fila_id: 'E-001', email: 'e1@empresa.com', sub_enterprise_id: existingSubEnterpriseId }],
    });
    expect(vm.state()).toBe('done');
  });

  it('submit(): flags an employee unit_ref that is neither a local fila_id nor a valid UUID as an error, without calling the API', async () => {
    // Bug real encontrado en validación E2E (customer-portal, 2026-08-18): un
    // unit_ref inexistente y no-UUID (ej. typo, o referencia a una unidad que
    // nunca existió) se enviaba literal como sub_enterprise_id -- el backend
    // lo tipa como UUID y rechaza el batch COMPLETO con 422, arrastrando
    // también las filas de empleado válidas del mismo lote.
    const bulkCreateSubEnterprises = vi.fn(() =>
      of({
        data: {
          created: 1, skipped: 0, errors: 0,
          entries: [{ fila_id: 'UN-001', status: 'created', sub_enterprise_id: 'sub-real-1', business_name: 'Sede A' }],
        },
      }),
    );
    const bulkInviteEmployees = vi.fn(() =>
      of({
        data: {
          invited: 1, skipped: 0, errors: 0,
          entries: [{ fila_id: 'E-001', status: 'invited', invite_id: 'inv-1', email: 'e1@empresa.com' }],
        },
      }),
    );
    const vm = setup({ bulkCreateSubEnterprises, bulkInviteEmployees });
    const file = buildWorkbookFile(
      [['UN-001', 'Sede A', 'NIT', '900111111', 'UNT-A', 'a@empresa.com', '+573000000001']],
      [
        ['E-001', 'UN-001', 'e1@empresa.com'], // unidad válida de este archivo
        ['E-002', 'UN-999', 'e2@empresa.com'], // no es fila_id local ni UUID
      ],
    );
    await vm.loadFile(file);

    await vm.submit('ent-1');

    // Solo la fila resoluble llega al API -- la fila con unit_ref inválido
    // nunca debe formar parte del payload que tumbaría el batch entero.
    expect(bulkInviteEmployees).toHaveBeenCalledWith('ent-1', {
      items: [{ fila_id: 'E-001', email: 'e1@empresa.com', sub_enterprise_id: 'sub-real-1' }],
    });
    expect(vm.state()).toBe('done');
    const failedRow = vm.employeeResults().find((r) => r.fila_id === 'E-002');
    expect(failedRow).toMatchObject({ status: 'error' });
    expect(failedRow?.reason).toContain('UN-999');
  });

  it('submit(): surfaces a mapped error message on API failure', async () => {
    const bulkCreateSubEnterprises = vi.fn(() =>
      throwError(() => ({
        status: 403,
        url: '/bulk',
        error: { errors: [{ code: 'FORBIDDEN', message: 'No autorizado' }] },
      })),
    );
    const vm = setup({ bulkCreateSubEnterprises });
    const file = buildWorkbookFile(
      [['UN-001', 'Sede A', 'NIT', '900111111', 'UNT-A', 'a@empresa.com', '+573000000001']],
      [],
    );
    await vm.loadFile(file);

    await vm.submit('ent-1');

    expect(vm.state()).toBe('error');
    expect(vm.errorMessage()).toContain('No autorizado');
  });

  it('createdUnits() recovers company_code from the parsed row by fila_id', async () => {
    const bulkCreateSubEnterprises = vi.fn(() =>
      of({
        data: {
          created: 1, skipped: 0, errors: 0,
          entries: [{ fila_id: 'UN-001', status: 'created', sub_enterprise_id: 'sub-1', business_name: 'Sede A' }],
        },
      }),
    );
    const vm = setup({ bulkCreateSubEnterprises });
    const file = buildWorkbookFile(
      [['UN-001', 'Sede A', 'NIT', '900111111', 'UNT-A', 'a@empresa.com', '+573000000001']],
      [],
    );
    await vm.loadFile(file);

    await vm.submit('ent-1');

    expect(vm.createdUnits()).toEqual([
      { fila_id: 'UN-001', sub_enterprise_id: 'sub-1', business_name: 'Sede A', company_code: 'UNT-A' },
    ]);
  });

  it('exceptionRows() returns only non-success rows from both sheets', () => {
    const vm = setup();
    vm.unitResults.set([
      { fila_id: 'UN-001', status: 'created', business_name: 'A', sub_enterprise_id: 'x' },
      { fila_id: 'UN-002', status: 'skipped', business_name: 'B', reason: 'dup' },
    ]);
    vm.employeeResults.set([
      { fila_id: 'E-001', status: 'invited', email: 'a@b.com' },
      { fila_id: 'E-002', status: 'error', email: 'c@d.com', reason: 'unidad no creada' },
    ]);

    const rows = vm.exceptionRows();

    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.fila_id)).toEqual(['UN-002', 'E-002']);
  });

  it('reset() clears parsed data and results', async () => {
    const vm = setup();
    const file = buildWorkbookFile(
      [['UN-001', 'Sede A', 'NIT', '900111111', 'UNT-A', 'a@empresa.com', '+573000000001']],
      [],
    );
    await vm.loadFile(file);
    expect(vm.units()).toHaveLength(1);

    vm.reset();

    expect(vm.state()).toBe('idle');
    expect(vm.units()).toEqual([]);
    expect(vm.fileName()).toBeNull();
  });
});
