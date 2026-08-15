import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import {
  CoreBusinessUnitAssignmentsApiService,
  CoreClientContractsApiService,
  CoreEmploymentProfilesApiService,
  CorePayrollAdvancesApiService,
} from '@pleniu/core-data-access';
import { SessionStore } from '@pleniu/shared-auth';

import { EmployeeContractProposalVm } from './employee-contract-proposal';

const ELIGIBILITY_STUB = { provide: CorePayrollAdvancesApiService, useValue: { getEligibility: () => of({ data: { decision: null, fee_fixed_amount: 5000 } }) } };
const SESSION_STORE_STUB = { provide: SessionStore, useValue: { claims: () => ({}) } };

describe('EmployeeContractProposalVm', () => {
  const assignment = {
    id: 'assign-1',
    sub_enterprise_id: 'sub-1',
    company_code: 'UNT-ACME',
    template_contract_id: 'tpl-1',
    product_type: 'PAYROLL_ADVANCE',
    status: 'ACTIVE',
    master_contract_id: 'master-contract-1',
    master_assignment_id: 'assign-1',
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
    listMyAssignedContracts?: () => unknown;
  } = {}) => ({
    listAvailableProducts: overrides.listAvailableProducts ?? (() => of({ data: [assignment] })),
    getMyProfile: overrides.getMyProfile ?? (() => of({ data: profile })),
    createFromProposal: overrides.createFromProposal ?? (() => of({ data: { id: 'contract-1' } })),
    // Auditoría 2026-08-11: por defecto, "sin contrato previo" -- así los
    // tests existentes (que no le conciernen a este chequeo) siguen el
    // camino normal sin cambios.
    listMyAssignedContracts: overrides.listMyAssignedContracts ?? (() => of({ data: [] })),
  });

  it('loads assignment and profile', () => {
    const apis = makeApis();
    TestBed.configureTestingModule({
      providers: [
        EmployeeContractProposalVm,
        { provide: CoreBusinessUnitAssignmentsApiService, useValue: { listAvailableProducts: apis.listAvailableProducts } },
        { provide: CoreEmploymentProfilesApiService, useValue: { getMyProfile: apis.getMyProfile } },
        {
          provide: CoreClientContractsApiService,
          useValue: {
            createFromProposal: apis.createFromProposal,
            listMyAssignedContracts: apis.listMyAssignedContracts,
          },
        },
        ELIGIBILITY_STUB,
        SESSION_STORE_STUB,
      ],
    });

    const vm = TestBed.inject(EmployeeContractProposalVm);
    vm.load('sub-1');

    expect(vm.state()).toBe('idle');
    expect(vm.assignment()).toEqual(assignment);
    expect(vm.profile()).toEqual(profile);
  });

  it('loads feeFixedAmount from the eligibility response when customer_id is available (auditoría 2026-08-11)', () => {
    const apis = makeApis();
    const getEligibility = vi.fn(() => of({ data: { decision: null, fee_fixed_amount: 5000 } }));
    TestBed.configureTestingModule({
      providers: [
        EmployeeContractProposalVm,
        { provide: CoreBusinessUnitAssignmentsApiService, useValue: { listAvailableProducts: apis.listAvailableProducts } },
        { provide: CoreEmploymentProfilesApiService, useValue: { getMyProfile: apis.getMyProfile } },
        {
          provide: CoreClientContractsApiService,
          useValue: {
            createFromProposal: apis.createFromProposal,
            listMyAssignedContracts: apis.listMyAssignedContracts,
          },
        },
        { provide: CorePayrollAdvancesApiService, useValue: { getEligibility } },
        { provide: SessionStore, useValue: { claims: () => ({ customer_id: 'cust-1' }) } },
      ],
    });

    const vm = TestBed.inject(EmployeeContractProposalVm);
    vm.load('sub-1');

    expect(getEligibility).toHaveBeenCalledWith({ customer_id: 'cust-1' });
    expect(vm.feeFixedAmount()).toBe(5000);
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
        {
          provide: CoreClientContractsApiService,
          useValue: {
            createFromProposal: apis.createFromProposal,
            listMyAssignedContracts: apis.listMyAssignedContracts,
          },
        },
        ELIGIBILITY_STUB,
        SESSION_STORE_STUB,
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
        {
          provide: CoreClientContractsApiService,
          useValue: {
            createFromProposal: apis.createFromProposal,
            listMyAssignedContracts: apis.listMyAssignedContracts,
          },
        },
        ELIGIBILITY_STUB,
        SESSION_STORE_STUB,
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
        {
          provide: CoreClientContractsApiService,
          useValue: {
            createFromProposal: apis.createFromProposal,
            listMyAssignedContracts: apis.listMyAssignedContracts,
          },
        },
        ELIGIBILITY_STUB,
        SESSION_STORE_STUB,
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
        {
          provide: CoreClientContractsApiService,
          useValue: {
            createFromProposal: apis.createFromProposal,
            listMyAssignedContracts: apis.listMyAssignedContracts,
          },
        },
        ELIGIBILITY_STUB,
        SESSION_STORE_STUB,
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
        {
          provide: CoreClientContractsApiService,
          useValue: {
            createFromProposal: apis.createFromProposal,
            listMyAssignedContracts: apis.listMyAssignedContracts,
          },
        },
        ELIGIBILITY_STUB,
        SESSION_STORE_STUB,
      ],
    });

    const vm = TestBed.inject(EmployeeContractProposalVm);
    vm.load('sub-1');
    vm.toggleTermsAccepted(true);
    vm.accept('sub-1');

    expect(vm.state()).toBe('error');
    expect(vm.errorMessage()).toContain('Ya tienes un anticipo de nómina activo');
  });

  // Auditoría 2026-08-11: confirmado en vivo (Carlos, Sub Empresa Demo
  // Example SAS) -- esta pantalla nunca comprobaba si el empleado ya había
  // aceptado la propuesta, así que un segundo ingreso mostraba el mismo
  // formulario de aceptación de siempre; al hacer clic, Core lo rechazaba
  // con 409 (DUPLICATE_ENTITY) y el empleado veía un error confuso en vez
  // de ser llevado a solicitar su anticipo, que es lo que ya podía hacer.
  describe('propuesta ya aceptada previamente (auditoría 2026-08-11)', () => {
    it('salta directo a success (redirección) si ya existe un contrato ACTIVE para esta asignación', () => {
      const existingContract = {
        id: 'contract-existing-1',
        master_assignment_id: 'assign-1',
        status: 'ACTIVE',
        terms: { amount: '300000' },
        template_contract_id: 'tpl-1',
        correlation_id: null,
        created_at: '2026-08-11T23:49:46Z',
      };
      const apis = makeApis({
        listMyAssignedContracts: () => of({ data: [existingContract] }),
      });
      const getEligibility = vi.fn(() => of({ data: { decision: null, fee_fixed_amount: 5000 } }));
      TestBed.configureTestingModule({
        providers: [
          EmployeeContractProposalVm,
          { provide: CoreBusinessUnitAssignmentsApiService, useValue: { listAvailableProducts: apis.listAvailableProducts } },
          { provide: CoreEmploymentProfilesApiService, useValue: { getMyProfile: apis.getMyProfile } },
          {
            provide: CoreClientContractsApiService,
            useValue: {
              createFromProposal: apis.createFromProposal,
              listMyAssignedContracts: apis.listMyAssignedContracts,
            },
          },
          { provide: CorePayrollAdvancesApiService, useValue: { getEligibility } },
          SESSION_STORE_STUB,
        ],
      });

      const vm = TestBed.inject(EmployeeContractProposalVm);
      vm.load('sub-1');

      expect(vm.state()).toBe('success');
      expect(vm.contract()).toEqual(existingContract);
      // No debe seguir cargando elegibilidad/perfil -- ya se redirige.
      expect(getEligibility).not.toHaveBeenCalled();
    });

    it('sigue el camino normal si el contrato existente es de OTRA asignación', () => {
      const otherAssignmentContract = {
        id: 'contract-other-1',
        master_assignment_id: 'assign-2-otra',
        status: 'ACTIVE',
        terms: {},
        template_contract_id: 'tpl-2',
        correlation_id: null,
        created_at: '2026-08-11T23:49:46Z',
      };
      const apis = makeApis({
        listMyAssignedContracts: () => of({ data: [otherAssignmentContract] }),
      });
      TestBed.configureTestingModule({
        providers: [
          EmployeeContractProposalVm,
          { provide: CoreBusinessUnitAssignmentsApiService, useValue: { listAvailableProducts: apis.listAvailableProducts } },
          { provide: CoreEmploymentProfilesApiService, useValue: { getMyProfile: apis.getMyProfile } },
          {
            provide: CoreClientContractsApiService,
            useValue: {
              createFromProposal: apis.createFromProposal,
              listMyAssignedContracts: apis.listMyAssignedContracts,
            },
          },
          ELIGIBILITY_STUB,
          SESSION_STORE_STUB,
        ],
      });

      const vm = TestBed.inject(EmployeeContractProposalVm);
      vm.load('sub-1');

      expect(vm.state()).toBe('idle');
      expect(vm.assignment()).toEqual(assignment);
    });

    it('si falla la consulta de contratos previos, sigue el camino normal (fail-open)', () => {
      const apis = makeApis({
        listMyAssignedContracts: () => throwError(() => ({ status: 500, error: {} })),
      });
      TestBed.configureTestingModule({
        providers: [
          EmployeeContractProposalVm,
          { provide: CoreBusinessUnitAssignmentsApiService, useValue: { listAvailableProducts: apis.listAvailableProducts } },
          { provide: CoreEmploymentProfilesApiService, useValue: { getMyProfile: apis.getMyProfile } },
          {
            provide: CoreClientContractsApiService,
            useValue: {
              createFromProposal: apis.createFromProposal,
              listMyAssignedContracts: apis.listMyAssignedContracts,
            },
          },
          ELIGIBILITY_STUB,
          SESSION_STORE_STUB,
        ],
      });

      const vm = TestBed.inject(EmployeeContractProposalVm);
      vm.load('sub-1');

      expect(vm.state()).toBe('idle');
      expect(vm.assignment()).toEqual(assignment);
    });
  });
});
