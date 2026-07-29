import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { IdentityEnterpriseApiService } from '@pleniu/identity-data-access';

import { AcceptEmployeeInvitationVm } from './accept-employee-invitation';

describe('AcceptEmployeeInvitationVm', () => {
  const validValidation = {
    enterprise_id: 'ent-1',
    sub_enterprise_id: 'sub-1',
    business_name: 'Empresa SAS',
    sub_enterprise_name: 'Unidad Norte',
    email: 'emp@acme.test',
    status: 'pending',
    expires_at: '2026-08-01T00:00:00Z',
    is_valid: true,
  };

  const makeRouter = () => ({ navigate: vi.fn() });

  it('loads and stores valid invitation', () => {
    TestBed.configureTestingModule({
      providers: [
        AcceptEmployeeInvitationVm,
        { provide: Router, useValue: makeRouter() },
        {
          provide: IdentityEnterpriseApiService,
          useValue: {
            validateEmployeeInvitation: () => of(validValidation),
            acceptEmployeeInvitation: () => of({ next_step: 'register', email: 'emp@acme.test', sub_enterprise_id: 'sub-1', enterprise_id: 'ent-1', token: 'tok-1' }),
          },
        },
      ],
    });
    const vm = TestBed.inject(AcceptEmployeeInvitationVm);
    vm.load('tok-1');
    expect(vm.validation()).toEqual(validValidation);
    expect(vm.state()).toBe('idle');
  });

  it('regression: identity-service returns the raw validation object (no ApiEnvelope data wrapper) — a genuinely valid, pending invitation must not be treated as invalid', () => {
    // Bug found via live Chrome DevTools audit: the real
    // GET /employee-invitations/{token}/validate response body is the plain
    // ValidateEmployeeInvitationResponse object, never wrapped in `{ data: ... }`.
    // The VM used to read `envelope.data`, which was always undefined here,
    // so every real (valid) invitation was misreported as "used/expired/invalid".
    TestBed.configureTestingModule({
      providers: [
        AcceptEmployeeInvitationVm,
        { provide: Router, useValue: makeRouter() },
        {
          provide: IdentityEnterpriseApiService,
          useValue: {
            validateEmployeeInvitation: () => of(validValidation),
            acceptEmployeeInvitation: () => of({}),
          },
        },
      ],
    });
    const vm = TestBed.inject(AcceptEmployeeInvitationVm);
    vm.load('tok-1');
    expect(vm.state()).toBe('idle');
    expect(vm.errorMessage()).toBeNull();
    expect(vm.validation()).toEqual(validValidation);
  });

  it('shows error for invalid invitation', () => {
    TestBed.configureTestingModule({
      providers: [
        AcceptEmployeeInvitationVm,
        { provide: Router, useValue: makeRouter() },
        {
          provide: IdentityEnterpriseApiService,
          useValue: {
            validateEmployeeInvitation: () =>
              of({ ...validValidation, status: 'accepted', is_valid: false }),
            acceptEmployeeInvitation: () => of({ next_step: 'register', email: 'emp@acme.test', sub_enterprise_id: 'sub-1', enterprise_id: 'ent-1', token: 'tok-1' }),
          },
        },
      ],
    });
    const vm = TestBed.inject(AcceptEmployeeInvitationVm);
    vm.load('tok-1');
    expect(vm.state()).toBe('error');
    expect(vm.errorMessage()).toContain('usada');
  });

  it('accept redirects to register when next_step is register', () => {
    const router = makeRouter();
    TestBed.configureTestingModule({
      providers: [
        AcceptEmployeeInvitationVm,
        { provide: Router, useValue: router },
        {
          provide: IdentityEnterpriseApiService,
          useValue: {
            validateEmployeeInvitation: () => of(validValidation),
            acceptEmployeeInvitation: () =>
              of({
                next_step: 'register' as const,
                email: 'emp@acme.test',
                sub_enterprise_id: 'sub-1',
                enterprise_id: 'ent-1',
                token: 'tok-1',
              }),
          },
        },
      ],
    });
    const vm = TestBed.inject(AcceptEmployeeInvitationVm);
    vm.load('tok-1');
    vm.accept('tok-1');
    expect(vm.state()).toBe('success');
    // Regression: must navigate directly to the person registration form, NOT
    // through '/auth/register' -> party-type-selector, whose "Soy una persona"
    // link is a static routerLink with no query params (would silently drop
    // invite_token/email and defeat the pre-filled + locked email field).
    expect(router.navigate).toHaveBeenCalledWith(['/customer/party/customer/register'], {
      queryParams: {
        invite_token: 'tok-1',
        email: 'emp@acme.test',
        sub_enterprise_id: 'sub-1',
        enterprise_id: 'ent-1',
      },
    });
  });

  it('maps 409 to already accepted message', () => {
    TestBed.configureTestingModule({
      providers: [
        AcceptEmployeeInvitationVm,
        { provide: Router, useValue: makeRouter() },
        {
          provide: IdentityEnterpriseApiService,
          useValue: {
            validateEmployeeInvitation: () => of(validValidation),
            acceptEmployeeInvitation: () =>
              throwError(() => ({
                status: 409,
                url: '/api/v1/employee-invitations/tok-1/accept',
                error: { errors: [{ code: 'CONFLICT', message: 'used' }] },
              })),
          },
        },
      ],
    });
    const vm = TestBed.inject(AcceptEmployeeInvitationVm);
    vm.load('tok-1');
    vm.accept('tok-1');
    expect(vm.state()).toBe('error');
    expect(vm.errorMessage()).toContain('aceptada');
  });
});
