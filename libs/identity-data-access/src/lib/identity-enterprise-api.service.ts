import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiEnvelope } from '@pleniu/shared-http';
import {
  AcceptInviteEnvelope,
  AcceptInviteRequest,
  CreateSubEnterpriseEnvelope,
  CreateSubEnterpriseRequest,
  CreateUserEnterpriseEnvelope,
  CreateUserEnterpriseRequest,
  EconomicSectorsListEnvelope,
  InviteUserEnvelope,
  InviteUserRequest,
  EnterpriseMeSummaryResponse,
  KybDocumentsEnvelope,
  KybDocumentsRequest,
  RegisterEnterpriseEnvelope,
  RegisterEnterpriseRequest,
  ResendEnterpriseEmailOtpEnvelope,
  ResendEnterpriseEmailOtpRequest,
  SubEnterpriseDetailEnvelope,
  SubEnterprisesListEnvelope,
  SubEnterprisesListParams,
  SubEnterpriseUsersListEnvelope,
  UpdateSubEnterpriseRequest,
  VerifyEnterpriseEmailEnvelope,
  VerifyEnterpriseEmailRequest,
} from 'identity-domain';

import { IdentityEnterpriseContextApiService } from './identity-enterprise-context-api.service';
import { IdentityEnterpriseInvitationApiService } from './identity-enterprise-invitation-api.service';
import { IdentityEnterpriseOnboardingApiService } from './identity-enterprise-onboarding-api.service';
import { IdentitySubEnterpriseApiService } from './identity-sub-enterprise-api.service';

/**
 * Fachada delgada sobre los 4 servicios por subdominio en los que se dividió
 * la antigua God Class `IdentityEnterpriseApiService` (registro/onboarding,
 * invitaciones, cambio de contexto y sub-empresas). Se mantiene con el mismo
 * nombre y el mismo token de DI para que los consumidores existentes en
 * `pleniubank-customer-portal` y `pleniubank-backoffice-portal` (que inyectan
 * `IdentityEnterpriseApiService` directamente, incluida su sustitución por
 * mocks en specs vía `{ provide: IdentityEnterpriseApiService, useValue }`)
 * no requieran ningún cambio. No añade lógica propia: cada método delega
 * 1:1 al servicio correspondiente, preservando exactamente las mismas URLs,
 * verbos HTTP y bodies que antes de la división (ver characterization spec).
 */
@Injectable({ providedIn: 'root' })
export class IdentityEnterpriseApiService {
  constructor(
    private readonly onboarding: IdentityEnterpriseOnboardingApiService,
    private readonly invitations: IdentityEnterpriseInvitationApiService,
    private readonly context: IdentityEnterpriseContextApiService,
    private readonly subEnterprises: IdentitySubEnterpriseApiService,
  ) {}

  // --- Registro / onboarding empresa ---------------------------------------

  registerEnterprise(payload: RegisterEnterpriseRequest): Observable<RegisterEnterpriseEnvelope> {
    return this.onboarding.registerEnterprise(payload);
  }

  listPublicEconomicSectors(category?: string | null): Observable<EconomicSectorsListEnvelope> {
    return this.onboarding.listPublicEconomicSectors(category);
  }

  verifyEnterpriseEmail(payload: VerifyEnterpriseEmailRequest): Observable<VerifyEnterpriseEmailEnvelope> {
    return this.onboarding.verifyEnterpriseEmail(payload);
  }

  resendEnterpriseEmailOtp(payload: ResendEnterpriseEmailOtpRequest): Observable<ResendEnterpriseEmailOtpEnvelope> {
    return this.onboarding.resendEnterpriseEmailOtp(payload);
  }

  submitKybDocuments(payload: KybDocumentsRequest): Observable<KybDocumentsEnvelope> {
    return this.onboarding.submitKybDocuments(payload);
  }

  getEnterpriseMeSummary(): Observable<EnterpriseMeSummaryResponse> {
    return this.onboarding.getEnterpriseMeSummary();
  }

  // --- Invitaciones de usuario ----------------------------------------------

  inviteUser(payload: InviteUserRequest): Observable<InviteUserEnvelope> {
    return this.invitations.inviteUser(payload);
  }

  acceptInvite(payload: AcceptInviteRequest): Observable<AcceptInviteEnvelope> {
    return this.invitations.acceptInvite(payload);
  }

  // --- Cambio de contexto ----------------------------------------------------

  switchContext(body: Record<string, unknown> = {}): Observable<ApiEnvelope<unknown>> {
    return this.context.switchContext(body);
  }

  // --- Sub-empresas y sus usuarios --------------------------------------------

  createEnterpriseUser(enterpriseId: string, payload: CreateUserEnterpriseRequest): Observable<CreateUserEnterpriseEnvelope> {
    return this.subEnterprises.createEnterpriseUser(enterpriseId, payload);
  }

  createSubEnterpriseUser(subEnterpriseId: string, payload: CreateUserEnterpriseRequest): Observable<CreateUserEnterpriseEnvelope> {
    return this.subEnterprises.createSubEnterpriseUser(subEnterpriseId, payload);
  }

  listSubEnterpriseUsers(subEnterpriseId: string): Observable<SubEnterpriseUsersListEnvelope> {
    return this.subEnterprises.listSubEnterpriseUsers(subEnterpriseId);
  }

  createSubEnterprise(enterpriseId: string, payload: CreateSubEnterpriseRequest): Observable<CreateSubEnterpriseEnvelope> {
    return this.subEnterprises.createSubEnterprise(enterpriseId, payload);
  }

  listSubEnterprises(
    enterpriseId: string,
    params: SubEnterprisesListParams = {},
  ): Observable<SubEnterprisesListEnvelope> {
    return this.subEnterprises.listSubEnterprises(enterpriseId, params);
  }

  getSubEnterprise(subEnterpriseId: string): Observable<SubEnterpriseDetailEnvelope> {
    return this.subEnterprises.getSubEnterprise(subEnterpriseId);
  }

  updateSubEnterprise(
    subEnterpriseId: string,
    payload: UpdateSubEnterpriseRequest,
  ): Observable<SubEnterpriseDetailEnvelope> {
    return this.subEnterprises.updateSubEnterprise(subEnterpriseId, payload);
  }

  deactivateSubEnterprise(subEnterpriseId: string): Observable<void> {
    return this.subEnterprises.deactivateSubEnterprise(subEnterpriseId);
  }
}
