import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { IdentityEnterpriseApiService } from '@pleniu/identity-data-access';
import { SessionStore } from '@pleniu/shared-auth';

import { InviteEmployeeVm } from './invite-employee';

describe('InviteEmployeeVm', () => {
  const subEnterprises = [
    {
      sub_enterprise_id: 'sub-1',
      enterprise_id: 'ent-1',
      business_name: 'Unidad Norte',
      company_code: 'UNT-N',
      document_type: 'NIT' as const,
      document_number: '900987654-1',
      email: 'norte@empresa.com',
      phone: '+573001112233',
      status: 'active',
      created_at: '2026-01-01T00:00:00Z',
    },
  ];

  it('resolves the preselected sub-enterprise by id, without loading the full list', () => {
    const getSubEnterprise = vi.fn(() => of({ data: subEnterprises[0] }));
    TestBed.configureTestingModule({
      providers: [
        InviteEmployeeVm,
        {
          provide: SessionStore,
          useValue: { claims: () => ({ enterprise_id: 'ent-1' }) },
        },
        {
          provide: IdentityEnterpriseApiService,
          useValue: { getSubEnterprise },
        },
      ],
    });
    const vm = TestBed.inject(InviteEmployeeVm);
    vm.resolvePreselected('sub-1');
    expect(getSubEnterprise).toHaveBeenCalledWith('sub-1');
    expect(vm.selectedSubEnterprise()).toEqual(subEnterprises[0]);
    expect(vm.state()).toBe('idle');
  });

  it('searches sub-enterprises with debounce, minimum length and a bounded limit', () => {
    vi.useFakeTimers();
    try {
      const listSubEnterprises = vi.fn(() => of({ data: subEnterprises }));
      TestBed.configureTestingModule({
        providers: [
          InviteEmployeeVm,
          {
            provide: SessionStore,
            useValue: { claims: () => ({ enterprise_id: 'ent-1' }) },
          },
          {
            provide: IdentityEnterpriseApiService,
            useValue: { listSubEnterprises },
          },
        ],
      });
      const vm = TestBed.inject(InviteEmployeeVm);

      vm.onQueryChange('n');
      vi.advanceTimersByTime(300);
      expect(listSubEnterprises).not.toHaveBeenCalled();
      expect(vm.searchResults()).toEqual([]);

      vm.onQueryChange('norte');
      vi.advanceTimersByTime(300);
      expect(listSubEnterprises).toHaveBeenCalledWith('ent-1', { search: 'norte', limit: 20 });
      expect(vm.searchResults()).toEqual(subEnterprises);
      expect(vm.searchState()).toBe('idle');
    } finally {
      vi.useRealTimers();
    }
  });

  it('selecting a search result clears the query and results', () => {
    TestBed.configureTestingModule({
      providers: [
        InviteEmployeeVm,
        {
          provide: SessionStore,
          useValue: { claims: () => ({ enterprise_id: 'ent-1' }) },
        },
        { provide: IdentityEnterpriseApiService, useValue: {} },
      ],
    });
    const vm = TestBed.inject(InviteEmployeeVm);
    vm.selectSubEnterprise(subEnterprises[0]);
    expect(vm.selectedSubEnterprise()).toEqual(subEnterprises[0]);
    expect(vm.searchQuery()).toBe('');
    expect(vm.searchResults()).toEqual([]);
  });

  it('submits invitation with selected sub-enterprise', () => {
    let sentPayload: { email: string; sub_enterprise_id: string } | undefined;
    TestBed.configureTestingModule({
      providers: [
        InviteEmployeeVm,
        {
          provide: SessionStore,
          useValue: { claims: () => ({ enterprise_id: 'ent-1' }) },
        },
        {
          provide: IdentityEnterpriseApiService,
          useValue: {
            inviteEmployee: (payload: { email: string; sub_enterprise_id: string }) => {
              sentPayload = payload;
              return of({
                data: {
                  invite_id: 'inv-1',
                  sub_enterprise_id: payload.sub_enterprise_id,
                  email: payload.email,
                  expires_at: '2026-08-01T00:00:00Z',
                  status: 'pending',
                },
              });
            },
            // Rediseño 2026-08-07: el éxito refresca las pendientes.
            listEmployeeInvitations: () => of({ data: [] }),
          },
        },
      ],
    });
    const vm = TestBed.inject(InviteEmployeeVm);
    vm.selectSubEnterprise(subEnterprises[0]);
    vm.submit({ email: 'emp@empresa.com', sub_enterprise_id: '' });
    expect(sentPayload).toEqual({ email: 'emp@empresa.com', sub_enterprise_id: 'sub-1' });
    expect(vm.state()).toBe('success');
  });

  it('shows error when submitting without a selected unit', () => {
    TestBed.configureTestingModule({
      providers: [
        InviteEmployeeVm,
        {
          provide: SessionStore,
          useValue: { claims: () => ({ enterprise_id: 'ent-1' }) },
        },
        { provide: IdentityEnterpriseApiService, useValue: {} },
      ],
    });
    const vm = TestBed.inject(InviteEmployeeVm);
    vm.submit({ email: 'emp@empresa.com', sub_enterprise_id: '' });
    expect(vm.state()).toBe('error');
    expect(vm.errorMessage()).toContain('Selecciona una unidad');
  });

  it('maps 409 to pending invitation message', () => {
    TestBed.configureTestingModule({
      providers: [
        InviteEmployeeVm,
        {
          provide: SessionStore,
          useValue: { claims: () => ({ enterprise_id: 'ent-1' }) },
        },
        {
          provide: IdentityEnterpriseApiService,
          useValue: {
            inviteEmployee: () =>
              throwError(() => ({
                status: 409,
                url: '/api/v1/enterprise/invite-employee',
                error: { errors: [{ code: 'CONFLICT', message: 'pending' }] },
              })),
          },
        },
      ],
    });
    const vm = TestBed.inject(InviteEmployeeVm);
    vm.selectSubEnterprise(subEnterprises[0]);
    vm.submit({ email: 'dup@empresa.com', sub_enterprise_id: '' });
    expect(vm.state()).toBe('error');
    expect(vm.errorMessage()).toContain('invitación activa');
  });

  it('mapea el 422 de empresa sin KYB completo a un mensaje de negocio en español (hallazgo E2E 2026-08-20)', () => {
    TestBed.configureTestingModule({
      providers: [
        InviteEmployeeVm,
        {
          provide: SessionStore,
          useValue: { claims: () => ({ enterprise_id: 'ent-1' }) },
        },
        {
          provide: IdentityEnterpriseApiService,
          useValue: {
            inviteEmployee: () =>
              throwError(() => ({
                status: 422,
                url: '/api/v1/enterprise/invite-employee',
                error: {
                  errors: [
                    {
                      code: 'VALIDATION_ERROR',
                      message: 'Invitations are only available for active enterprises',
                    },
                  ],
                },
              })),
          },
        },
      ],
    });
    const vm = TestBed.inject(InviteEmployeeVm);
    vm.selectSubEnterprise(subEnterprises[0]);
    vm.submit({ email: 'emp@empresa.com', sub_enterprise_id: '' });
    expect(vm.state()).toBe('error');
    expect(vm.errorMessage()).toContain('verificación (KYB)');
    expect(vm.errorMessage()).not.toContain('active enterprises');
  });

  // ── Rediseño 2026-08-07: evidencia de invitaciones ──────────────────────

  it('éxito: registra la invitación con unidad, referencia y vencimiento, y refresca pendientes', () => {
    const listEmployeeInvitations = vi.fn(() =>
      of({
        data: [
          {
            invite_id: 'inv-1',
            sub_enterprise_id: 'sub-1',
            email: 'emp@empresa.com',
            status: 'pending',
            expires_at: '2026-08-01T00:00:00Z',
            created_at: '2026-07-31T00:00:00Z',
          },
        ],
      }),
    );
    TestBed.configureTestingModule({
      providers: [
        InviteEmployeeVm,
        { provide: SessionStore, useValue: { claims: () => ({ enterprise_id: 'ent-1' }) } },
        {
          provide: IdentityEnterpriseApiService,
          useValue: {
            inviteEmployee: () =>
              of({
                data: {
                  invite_id: 'inv-1',
                  sub_enterprise_id: 'sub-1',
                  email: 'emp@empresa.com',
                  expires_at: '2026-08-01T00:00:00Z',
                  status: 'pending',
                },
              }),
            listEmployeeInvitations,
          },
        },
      ],
    });
    const vm = TestBed.inject(InviteEmployeeVm);
    vm.selectSubEnterprise(subEnterprises[0]);
    vm.submit({ email: 'emp@empresa.com', sub_enterprise_id: '' });

    const last = vm.lastInvite();
    expect(last?.invite_id).toBe('inv-1');
    expect(last?.unit_name).toBe('Unidad Norte');
    expect(last?.unit_code).toBe('UNT-N');
    expect(vm.sentLog().map((r) => r.invite_id)).toEqual(['inv-1']);
    expect(listEmployeeInvitations).toHaveBeenCalledWith({ status: 'pending' });
    expect(vm.pendingInvitations()).toHaveLength(1);
    expect(vm.pendingState()).toBe('loaded');
  });

  it('revoca una invitación pendiente y la retira de la lista', () => {
    const revokeEmployeeInvitation = vi.fn(() => of(void 0));
    TestBed.configureTestingModule({
      providers: [
        InviteEmployeeVm,
        { provide: SessionStore, useValue: { claims: () => ({ enterprise_id: 'ent-1' }) } },
        {
          provide: IdentityEnterpriseApiService,
          useValue: {
            listEmployeeInvitations: () =>
              of({
                data: [
                  {
                    invite_id: 'inv-9',
                    sub_enterprise_id: 'sub-1',
                    email: 'pend@empresa.com',
                    status: 'pending',
                    expires_at: '2026-08-01T00:00:00Z',
                    created_at: '2026-07-31T00:00:00Z',
                  },
                ],
              }),
            revokeEmployeeInvitation,
          },
        },
      ],
    });
    const vm = TestBed.inject(InviteEmployeeVm);
    vm.loadPendingInvitations();
    expect(vm.pendingInvitations()).toHaveLength(1);

    vm.revokePendingInvitation('inv-9');
    expect(revokeEmployeeInvitation).toHaveBeenCalledWith('inv-9');
    expect(vm.pendingInvitations()).toHaveLength(0);
  });

  it('resetKeepUnit() limpia el estado pero conserva la unidad seleccionada', () => {
    TestBed.configureTestingModule({
      providers: [
        InviteEmployeeVm,
        { provide: SessionStore, useValue: { claims: () => ({ enterprise_id: 'ent-1' }) } },
        { provide: IdentityEnterpriseApiService, useValue: {} },
      ],
    });
    const vm = TestBed.inject(InviteEmployeeVm);
    vm.selectSubEnterprise(subEnterprises[0]);
    vm.resetKeepUnit();

    expect(vm.state()).toBe('idle');
    expect(vm.selectedSubEnterprise()).toEqual(subEnterprises[0]);
  });
});
