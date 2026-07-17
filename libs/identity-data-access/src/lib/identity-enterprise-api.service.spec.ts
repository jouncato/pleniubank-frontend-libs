import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { IdentityEnterpriseApiService } from './identity-enterprise-api.service';
import { IdentityEnterpriseContextApiService } from './identity-enterprise-context-api.service';
import { IdentityEnterpriseInvitationApiService } from './identity-enterprise-invitation-api.service';
import { IdentityEnterpriseOnboardingApiService } from './identity-enterprise-onboarding-api.service';
import { IdentitySubEnterpriseApiService } from './identity-sub-enterprise-api.service';

/**
 * `IdentityEnterpriseApiService` is now a thin facade over 4 per-subdomain
 * services (see `identity-enterprise-{onboarding,invitation,context}-api.service.ts`
 * and `identity-sub-enterprise-api.service.ts`). It exists only so that
 * existing consumers in pleniubank-customer-portal / pleniubank-backoffice-portal
 * keep working unchanged (same class name, same DI token). This spec confirms
 * that every one of the 18 original public methods delegates 1:1 to the right
 * sub-service with the exact same arguments. HTTP-level behavior (URLs, verbs,
 * bodies) is covered by the specs of the 4 delegate services themselves.
 *
 * All delegate calls return `of(...)` (synchronous), so `subscribe()` resolves
 * before the assertions run — no async helpers needed.
 */
describe('IdentityEnterpriseApiService (facade delegation)', () => {
  let service: IdentityEnterpriseApiService;
  let onboarding: { [K in keyof IdentityEnterpriseOnboardingApiService]: ReturnType<typeof vi.fn> };
  let invitations: { [K in keyof IdentityEnterpriseInvitationApiService]: ReturnType<typeof vi.fn> };
  let context: { [K in keyof IdentityEnterpriseContextApiService]: ReturnType<typeof vi.fn> };
  let subEnterprises: { [K in keyof IdentitySubEnterpriseApiService]: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    onboarding = {
      registerEnterprise: vi.fn(() => of('registerEnterprise-result')),
      listPublicEconomicSectors: vi.fn(() => of('listPublicEconomicSectors-result')),
      verifyEnterpriseEmail: vi.fn(() => of('verifyEnterpriseEmail-result')),
      resendEnterpriseEmailOtp: vi.fn(() => of('resendEnterpriseEmailOtp-result')),
      submitKybDocuments: vi.fn(() => of('submitKybDocuments-result')),
      getEnterpriseMeSummary: vi.fn(() => of('getEnterpriseMeSummary-result')),
    } as unknown as typeof onboarding;
    invitations = {
      inviteUser: vi.fn(() => of('inviteUser-result')),
      acceptInvite: vi.fn(() => of('acceptInvite-result')),
    } as unknown as typeof invitations;
    context = {
      switchContext: vi.fn(() => of('switchContext-result')),
    } as unknown as typeof context;
    subEnterprises = {
      createEnterpriseUser: vi.fn(() => of('createEnterpriseUser-result')),
      createSubEnterpriseUser: vi.fn(() => of('createSubEnterpriseUser-result')),
      listSubEnterpriseUsers: vi.fn(() => of('listSubEnterpriseUsers-result')),
      createSubEnterprise: vi.fn(() => of('createSubEnterprise-result')),
      listSubEnterprises: vi.fn(() => of('listSubEnterprises-result')),
      getSubEnterprise: vi.fn(() => of('getSubEnterprise-result')),
      updateSubEnterprise: vi.fn(() => of('updateSubEnterprise-result')),
      deactivateSubEnterprise: vi.fn(() => of('deactivateSubEnterprise-result')),
    } as unknown as typeof subEnterprises;

    TestBed.configureTestingModule({
      providers: [
        IdentityEnterpriseApiService,
        { provide: IdentityEnterpriseOnboardingApiService, useValue: onboarding },
        { provide: IdentityEnterpriseInvitationApiService, useValue: invitations },
        { provide: IdentityEnterpriseContextApiService, useValue: context },
        { provide: IdentitySubEnterpriseApiService, useValue: subEnterprises },
      ],
    });
    service = TestBed.inject(IdentityEnterpriseApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // --- Registro / onboarding empresa ---------------------------------------

  it('registerEnterprise() delega en IdentityEnterpriseOnboardingApiService', () => {
    const payload = { business_name: 'Acme' } as any;
    let result: unknown;
    service.registerEnterprise(payload).subscribe((res) => (result = res));
    expect(result).toBe('registerEnterprise-result');
    expect(onboarding.registerEnterprise).toHaveBeenCalledWith(payload);
  });

  it('listPublicEconomicSectors() delega en IdentityEnterpriseOnboardingApiService', () => {
    let result: unknown;
    service.listPublicEconomicSectors('agro').subscribe((res) => (result = res));
    expect(result).toBe('listPublicEconomicSectors-result');
    expect(onboarding.listPublicEconomicSectors).toHaveBeenCalledWith('agro');
  });

  it('verifyEnterpriseEmail() delega en IdentityEnterpriseOnboardingApiService', () => {
    const payload = { user_id: 'u1', code: '123456' };
    let result: unknown;
    service.verifyEnterpriseEmail(payload).subscribe((res) => (result = res));
    expect(result).toBe('verifyEnterpriseEmail-result');
    expect(onboarding.verifyEnterpriseEmail).toHaveBeenCalledWith(payload);
  });

  it('resendEnterpriseEmailOtp() delega en IdentityEnterpriseOnboardingApiService', () => {
    const payload = { user_id: 'u1' };
    let result: unknown;
    service.resendEnterpriseEmailOtp(payload).subscribe((res) => (result = res));
    expect(result).toBe('resendEnterpriseEmailOtp-result');
    expect(onboarding.resendEnterpriseEmailOtp).toHaveBeenCalledWith(payload);
  });

  it('submitKybDocuments() delega en IdentityEnterpriseOnboardingApiService', () => {
    const payload = { waive_all_mvp: true };
    let result: unknown;
    service.submitKybDocuments(payload).subscribe((res) => (result = res));
    expect(result).toBe('submitKybDocuments-result');
    expect(onboarding.submitKybDocuments).toHaveBeenCalledWith(payload);
  });

  it('getEnterpriseMeSummary() delega en IdentityEnterpriseOnboardingApiService', () => {
    let result: unknown;
    service.getEnterpriseMeSummary().subscribe((res) => (result = res));
    expect(result).toBe('getEnterpriseMeSummary-result');
    expect(onboarding.getEnterpriseMeSummary).toHaveBeenCalledWith();
  });

  // --- Invitaciones de usuario ----------------------------------------------

  it('inviteUser() delega en IdentityEnterpriseInvitationApiService', () => {
    const payload = { email: 'x@acme.test' };
    let result: unknown;
    service.inviteUser(payload).subscribe((res) => (result = res));
    expect(result).toBe('inviteUser-result');
    expect(invitations.inviteUser).toHaveBeenCalledWith(payload);
  });

  it('acceptInvite() delega en IdentityEnterpriseInvitationApiService', () => {
    const payload = { token: 'tok-1', password: 'x' };
    let result: unknown;
    service.acceptInvite(payload).subscribe((res) => (result = res));
    expect(result).toBe('acceptInvite-result');
    expect(invitations.acceptInvite).toHaveBeenCalledWith(payload);
  });

  // --- Cambio de contexto ----------------------------------------------------

  it('switchContext() delega en IdentityEnterpriseContextApiService con default {}', () => {
    let result: unknown;
    service.switchContext().subscribe((res) => (result = res));
    expect(result).toBe('switchContext-result');
    expect(context.switchContext).toHaveBeenCalledWith({});
  });

  it('switchContext(body) delega en IdentityEnterpriseContextApiService con el body provisto', () => {
    const body = { enterprise_id: 'ent-1' };
    let result: unknown;
    service.switchContext(body).subscribe((res) => (result = res));
    expect(result).toBe('switchContext-result');
    expect(context.switchContext).toHaveBeenCalledWith(body);
  });

  // --- Sub-empresas y sus usuarios --------------------------------------------

  it('createEnterpriseUser() delega en IdentitySubEnterpriseApiService', () => {
    const payload = { email: 'x@acme.test' } as any;
    let result: unknown;
    service.createEnterpriseUser('ent-1', payload).subscribe((res) => (result = res));
    expect(result).toBe('createEnterpriseUser-result');
    expect(subEnterprises.createEnterpriseUser).toHaveBeenCalledWith('ent-1', payload);
  });

  it('createSubEnterpriseUser() delega en IdentitySubEnterpriseApiService', () => {
    const payload = { email: 'x@acme.test' } as any;
    let result: unknown;
    service.createSubEnterpriseUser('sub-1', payload).subscribe((res) => (result = res));
    expect(result).toBe('createSubEnterpriseUser-result');
    expect(subEnterprises.createSubEnterpriseUser).toHaveBeenCalledWith('sub-1', payload);
  });

  it('listSubEnterpriseUsers() delega en IdentitySubEnterpriseApiService', () => {
    let result: unknown;
    service.listSubEnterpriseUsers('sub-1').subscribe((res) => (result = res));
    expect(result).toBe('listSubEnterpriseUsers-result');
    expect(subEnterprises.listSubEnterpriseUsers).toHaveBeenCalledWith('sub-1');
  });

  it('createSubEnterprise() delega en IdentitySubEnterpriseApiService', () => {
    const payload = { business_name: 'Sucursal' } as any;
    let result: unknown;
    service.createSubEnterprise('ent-1', payload).subscribe((res) => (result = res));
    expect(result).toBe('createSubEnterprise-result');
    expect(subEnterprises.createSubEnterprise).toHaveBeenCalledWith('ent-1', payload);
  });

  it('listSubEnterprises() delega en IdentitySubEnterpriseApiService con params por defecto {}', () => {
    let result: unknown;
    service.listSubEnterprises('ent-1').subscribe((res) => (result = res));
    expect(result).toBe('listSubEnterprises-result');
    expect(subEnterprises.listSubEnterprises).toHaveBeenCalledWith('ent-1', {});
  });

  it('listSubEnterprises(params) delega en IdentitySubEnterpriseApiService con los params provistos', () => {
    const params = { status: 'active' as const };
    let result: unknown;
    service.listSubEnterprises('ent-1', params).subscribe((res) => (result = res));
    expect(result).toBe('listSubEnterprises-result');
    expect(subEnterprises.listSubEnterprises).toHaveBeenCalledWith('ent-1', params);
  });

  it('getSubEnterprise() delega en IdentitySubEnterpriseApiService', () => {
    let result: unknown;
    service.getSubEnterprise('sub-1').subscribe((res) => (result = res));
    expect(result).toBe('getSubEnterprise-result');
    expect(subEnterprises.getSubEnterprise).toHaveBeenCalledWith('sub-1');
  });

  it('updateSubEnterprise() delega en IdentitySubEnterpriseApiService', () => {
    const payload = { email: 'nuevo@acme.test' };
    let result: unknown;
    service.updateSubEnterprise('sub-1', payload).subscribe((res) => (result = res));
    expect(result).toBe('updateSubEnterprise-result');
    expect(subEnterprises.updateSubEnterprise).toHaveBeenCalledWith('sub-1', payload);
  });

  it('deactivateSubEnterprise() delega en IdentitySubEnterpriseApiService', () => {
    let result: unknown;
    service.deactivateSubEnterprise('sub-1').subscribe((res) => (result = res));
    expect(result).toBe('deactivateSubEnterprise-result');
    expect(subEnterprises.deactivateSubEnterprise).toHaveBeenCalledWith('sub-1');
  });
});
