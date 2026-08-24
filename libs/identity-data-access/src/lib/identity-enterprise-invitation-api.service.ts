import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';
import {
  AcceptEmployeeInvitationEnvelope,
  AcceptEmployeeInvitationRequest,
  AcceptInviteEnvelope,
  AcceptInviteRequest,
  BulkCreatePayrollUsersEnvelope,
  BulkCreatePayrollUsersRequest,
  BulkCreatePayrollUsersResponse,
  BulkInviteEmployeesEnvelope,
  BulkInviteEmployeesRequest,
  BulkInviteEmployeesResponse,
  EmployeeInvitationsListEnvelope,
  InviteEmployeeEnvelope,
  InviteEmployeeRequest,
  InviteUserEnvelope,
  InviteUserRequest,
  ListEmployeeInvitationsParams,
  ValidateEmployeeInvitationEnvelope,
} from 'identity-domain';

/** Identity devuelve muchos POST como cuerpo plano; Core usa `{ data, meta }`.
 * Mismo helper que `IdentitySubEnterpriseApiService` (duplicado a propósito --
 * cada servicio por subdominio se mantiene independiente, sin un import
 * cruzado solo por 6 líneas). */
function asApiEnvelope<T>(body: ApiEnvelope<T> | T): ApiEnvelope<T> {
  if (body !== null && typeof body === 'object' && 'data' in (body as object)) {
    const env = body as ApiEnvelope<T>;
    if (env.data !== undefined && env.data !== null) {
      return env;
    }
  }
  return { data: body as T };
}

/**
 * Invitaciones de usuario dentro de una empresa (B2B): crear invitación y
 * aceptarla. Extraído de `IdentityEnterpriseApiService` (God Class original)
 * como parte de la separación por subdominio.
 */
@Injectable({ providedIn: 'root' })
export class IdentityEnterpriseInvitationApiService {
  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) private readonly apiConfig: ApiConfig,
  ) {}

  inviteUser(payload: InviteUserRequest): Observable<InviteUserEnvelope> {
    return this.http.post<InviteUserEnvelope>(
      `${this.apiConfig.identityBaseUrl}/api/v1/enterprise/invite-user`,
      payload,
    );
  }

  inviteEmployee(payload: InviteEmployeeRequest): Observable<InviteEmployeeEnvelope> {
    return this.http.post<InviteEmployeeEnvelope>(
      `${this.apiConfig.identityBaseUrl}/api/v1/enterprise/invite-employee`,
      payload,
    );
  }

  /** Carga masiva de invitaciones (plan 2026-08-18), hasta 500 por llamada.
   * `enterpriseId` va en el path (a diferencia del invite individual, que lo
   * deriva del propio actor) porque este endpoint también admite un token de
   * staff de plataforma invitando en nombre de una empresa explícita. */
  bulkInviteEmployees(
    enterpriseId: string,
    payload: BulkInviteEmployeesRequest,
  ): Observable<BulkInviteEmployeesEnvelope> {
    return this.http
      .post<BulkInviteEmployeesEnvelope | BulkInviteEmployeesResponse>(
        `${this.apiConfig.identityBaseUrl}/api/v1/enterprise/${encodeURIComponent(enterpriseId)}/invite-employee/bulk`,
        payload,
      )
      .pipe(map((body) => asApiEnvelope<BulkInviteEmployeesResponse>(body)));
  }

  /** Carga masiva de cuentas de usuario para Anticipo de Nómina (crea el
   * `User` directamente con contraseña temporal, no solo invita), hasta 500
   * por llamada -- exclusiva del módulo payroll-advances. Mismo criterio de
   * `enterpriseId` en el path que `bulkInviteEmployees`. */
  bulkCreatePayrollUsers(
    enterpriseId: string,
    payload: BulkCreatePayrollUsersRequest,
  ): Observable<BulkCreatePayrollUsersEnvelope> {
    return this.http
      .post<BulkCreatePayrollUsersEnvelope | BulkCreatePayrollUsersResponse>(
        `${this.apiConfig.identityBaseUrl}/api/v1/enterprise/${encodeURIComponent(enterpriseId)}/payroll-users/bulk`,
        payload,
      )
      .pipe(map((body) => asApiEnvelope<BulkCreatePayrollUsersResponse>(body)));
  }

  validateEmployeeInvitation(token: string): Observable<ValidateEmployeeInvitationEnvelope> {
    return this.http.get<ValidateEmployeeInvitationEnvelope>(
      `${this.apiConfig.identityBaseUrl}/api/v1/employee-invitations/${encodeURIComponent(token)}/validate`,
    );
  }

  acceptEmployeeInvitation(
    token: string,
    payload: AcceptEmployeeInvitationRequest,
  ): Observable<AcceptEmployeeInvitationEnvelope> {
    return this.http.post<AcceptEmployeeInvitationEnvelope>(
      `${this.apiConfig.identityBaseUrl}/api/v1/employee-invitations/${encodeURIComponent(token)}/accept`,
      payload,
    );
  }

  acceptInvite(payload: AcceptInviteRequest): Observable<AcceptInviteEnvelope> {
    return this.http.post<AcceptInviteEnvelope>(
      `${this.apiConfig.identityBaseUrl}/api/v1/auth/accept-invite`,
      payload,
    );
  }

  listEmployeeInvitations(params: ListEmployeeInvitationsParams = {}): Observable<EmployeeInvitationsListEnvelope> {
    return this.http.get<EmployeeInvitationsListEnvelope>(
      `${this.apiConfig.identityBaseUrl}/api/v1/enterprise/employee-invitations`,
      { params: params.status ? { status: params.status } : {} },
    );
  }

  revokeEmployeeInvitation(inviteId: string): Observable<void> {
    return this.http.post<void>(
      `${this.apiConfig.identityBaseUrl}/api/v1/enterprise/employee-invitations/${encodeURIComponent(inviteId)}/revoke`,
      {},
    );
  }
}
