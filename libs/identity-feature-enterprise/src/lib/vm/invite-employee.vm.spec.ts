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
});
