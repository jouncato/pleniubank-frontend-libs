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

  it('loads sub-enterprises on init', () => {
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
            listSubEnterprises: () => of({ data: subEnterprises }),
            inviteEmployee: () => of({ data: { invite_id: 'inv-1' } }),
          },
        },
      ],
    });
    const vm = TestBed.inject(InviteEmployeeVm);
    vm.loadSubEnterprises();
    expect(vm.subEnterprises()).toEqual(subEnterprises);
    expect(vm.state()).toBe('idle');
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
            listSubEnterprises: () => of({ data: subEnterprises }),
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

  it('shows error when no enterprise_id in claims', () => {
    TestBed.configureTestingModule({
      providers: [
        InviteEmployeeVm,
        {
          provide: SessionStore,
          useValue: { claims: () => ({}) },
        },
        {
          provide: IdentityEnterpriseApiService,
          useValue: {},
        },
      ],
    });
    const vm = TestBed.inject(InviteEmployeeVm);
    vm.loadSubEnterprises();
    expect(vm.state()).toBe('error');
    expect(vm.errorMessage()).toContain('empresa');
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
            listSubEnterprises: () => of({ data: subEnterprises }),
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
