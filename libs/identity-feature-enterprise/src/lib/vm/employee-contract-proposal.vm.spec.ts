import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import {
  CoreBusinessUnitAssignmentsApiService,
  CoreClientContractsApiService,
  CoreEmploymentProfilesApiService,
} from '@pleniu/core-data-access';

import { EmployeeContractProposalVm } from './employee-contract-proposal';

describe('EmployeeContractProposalVm', () => {
  const assignment = {
    id: 'assign-1',
    sub_enterprise_id: 'sub-1',
    company_code: 'UNT-ACME',
    template_contract_id: 'tpl-1',
    product_type: 'PAYROLL_ADVANCE',
    status: 'ACTIVE',
    terms: {
      title: 'Anticipo de nómina ACME',
      description: 'Adelanta hasta 40% de tu salario',
      conditions: ['Máximo 40% del salario por defecto', 'Sin reporte en centrales por defecto'],
    },
    effective_from: '2026-01-01T00:00:00Z',
    effective_to: null,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: null,
    updated_by: null,
  };

  const profile = {
    profile_id: 'prof-1',
    customer_id: 'cust-1',
    sub_enterprise_id: 'sub-1',
    company_code: 'UNT-ACME',
    employment_status: 'ACTIVE' as const,
    job_title: 'Empleado',
    department: null,
    employment_start_date: '2026-01-15',
    employment_end_date: null,
    salary_amount: '0',
    salary_currency: 'COP',
    contract_type: 'INDEFINIDO',
    verification_status: 'PENDING' as const,
    verified_at: null,
    verified_by: null,
    salary_verified_at: null,
    salary_verified_by: null,
    created_at: '2026-01-15T00:00:00Z',
    created_by: 'system',
    updated_at: null,
  };

  const makeApis = (overrides: {
    listAvailableProducts?: () => unknown;
    getMyProfile?: () => unknown;
    createFromProposal?: () => unknown;
  } = {}) => ({
    listAvailableProducts: overrides.listAvailableProducts ?? (() => of({ data: [assignment] })),
    getMyProfile: overrides.getMyProfile ?? (() => of({ data: profile })),
    createFromProposal: overrides.createFromProposal ?? (() => of({ data: { id: 'contract-1' } })),
  });

  it('loads assignment and profile', () => {
    const apis = makeApis();
    TestBed.configureTestingModule({
      providers: [
        EmployeeContractProposalVm,
        { provide: CoreBusinessUnitAssignmentsApiService, useValue: { listAvailableProducts: apis.listAvailableProducts } },
        { provide: CoreEmploymentProfilesApiService, useValue: { getMyProfile: apis.getMyProfile } },
        { provide: CoreClientContractsApiService, useValue: { createFromProposal: apis.createFromProposal } },
      ],
    });

    const vm = TestBed.inject(EmployeeContractProposalVm);
    vm.load('sub-1');

    expect(vm.state()).toBe('idle');
    expect(vm.assignment()).toEqual(assignment);
    expect(vm.profile()).toEqual(profile);
  });

  it('loads a master-only assignment (no legacy template) synthesized by available-products', () => {
    // Encontrado por verificación en vivo (2026-08-05): una unidad asignada
    // solo vía PayrollAdvanceMasterAssignment (sin fila legacy) no tiene
    // `template_contract_id`; `available-products` la sintetiza igual con
    // `master_contract_id`/`master_assignment_id`.
    const masterOnlyAssignment = {
      ...assignment,
      id: 'master-assign-1',
      template_contract_id: null,
      master_contract_id: 'master-contract-1',
      master_assignment_id: 'master-assign-1',
      terms: {},
    };
    const apis = makeApis({ listAvailableProducts: () => of({ data: [masterOnlyAssignment] }) });
    TestBed.configureTestingModule({
      providers: [
        EmployeeContractProposalVm,
        { provide: CoreBusinessUnitAssignmentsApiService, useValue: { listAvailableProducts: apis.listAvailableProducts } },
        { provide: CoreEmploymentProfilesApiService, useValue: { getMyProfile: apis.getMyProfile } },
        { provide: CoreClientContractsApiService, useValue: { createFromProposal: apis.createFromProposal } },
      ],
    });

    const vm = TestBed.inject(EmployeeContractProposalVm);
    vm.load('sub-1');

    expect(vm.state()).toBe('idle');
    expect(vm.assignment()).toEqual(masterOnlyAssignment);
  });

  it('shows error when no active assignment exists', () => {
    const apis = makeApis({ listAvailableProducts: () => of({ data: [] }) });
    TestBed.configureTestingModule({
      providers: [
        EmployeeContractProposalVm,
        { provide: CoreBusinessUnitAssignmentsApiService, useValue: { listAvailableProducts: apis.listAvailableProducts } },
        { provide: CoreEmploymentProfilesApiService, useValue: { getMyProfile: apis.getMyProfile } },
        { provide: CoreClientContractsApiService, useValue: { createFromProposal: apis.createFromProposal } },
      ],
    });

    const vm = TestBed.inject(EmployeeContractProposalVm);
    vm.load('sub-1');

    expect(vm.state()).toBe('error');
    expect(vm.errorMessage()).toContain('No hay una propuesta');
  });

  it('creates contract after terms accepted', () => {
    const createSpy = vi.fn(() => of({ data: { id: 'contract-1' } }));
    const apis = makeApis({ createFromProposal: createSpy });
    TestBed.configureTestingModule({
      providers: [
        EmployeeContractProposalVm,
        { provide: CoreBusinessUnitAssignmentsApiService, useValue: { listAvailableProducts: apis.listAvailableProducts } },
        { provide: CoreEmploymentProfilesApiService, useValue: { getMyProfile: apis.getMyProfile } },
        { provide: CoreClientContractsApiService, useValue: { createFromProposal: apis.createFromProposal } },
      ],
    });

    const vm = TestBed.inject(EmployeeContractProposalVm);
    vm.load('sub-1');
    vm.toggleTermsAccepted(true);
    vm.accept('sub-1');

    expect(vm.state()).toBe('success');
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        sub_enterprise_id: 'sub-1',
        accepted_at: expect.any(String),
        user_agent: expect.any(String),
      }),
    );
  });

  it('blocks acceptance until terms are accepted', () => {
    const apis = makeApis();
    TestBed.configureTestingModule({
      providers: [
        EmployeeContractProposalVm,
        { provide: CoreBusinessUnitAssignmentsApiService, useValue: { listAvailableProducts: apis.listAvailableProducts } },
        { provide: CoreEmploymentProfilesApiService, useValue: { getMyProfile: apis.getMyProfile } },
        { provide: CoreClientContractsApiService, useValue: { createFromProposal: apis.createFromProposal } },
      ],
    });

    const vm = TestBed.inject(EmployeeContractProposalVm);
    vm.load('sub-1');
    vm.accept('sub-1');

    expect(vm.state()).toBe('idle');
    expect(vm.errorMessage()).toContain('términos');
  });

  it('maps 409 to active contract message', () => {
    const apis = makeApis({
      createFromProposal: () =>
        throwError(() => ({
          status: 409,
          url: '/api/v1/client-contracts/from-proposal',
          error: { errors: [{ code: 'PAYROLL_ADVANCE_GLOBAL_BLOCK', message: 'blocked' }] },
        })),
    });
    TestBed.configureTestingModule({
      providers: [
        EmployeeContractProposalVm,
        { provide: CoreBusinessUnitAssignmentsApiService, useValue: { listAvailableProducts: apis.listAvailableProducts } },
        { provide: CoreEmploymentProfilesApiService, useValue: { getMyProfile: apis.getMyProfile } },
        { provide: CoreClientContractsApiService, useValue: { createFromProposal: apis.createFromProposal } },
      ],
    });

    const vm = TestBed.inject(EmployeeContractProposalVm);
    vm.load('sub-1');
    vm.toggleTermsAccepted(true);
    vm.accept('sub-1');

    expect(vm.state()).toBe('error');
    expect(vm.errorMessage()).toContain('Ya tienes un contrato activo');
  });
});
