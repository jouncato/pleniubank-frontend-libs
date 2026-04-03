import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  AdminCreateEnterpriseEnvelope,
  AdminCreateEnterpriseResponse,
  AdminCreateEnterpriseRequest,
  AdminEconomicSectorDto,
  AdminEconomicSectorEnvelope,
  AdminEconomicSectorsListEnvelope,
  AdminEnterpriseDetailDto,
  AdminEnterpriseDetailEnvelope,
  AdminEnterpriseSummaryDto,
  AdminEnterprisesListEnvelope,
  AdminEnterprisesListParams,
  AdminPatchEconomicSectorRequest,
  AdminPatchEnterpriseKybRequest,
  AdminCreateUserEnvelope,
  AdminCreateUserResponse,
  AdminCreateUserRequest,
  AdminPatchUserRequest,
  AdminUserDetailDto,
  AdminUserDetailEnvelope,
  AdminUsersListEnvelope,
  AdminUsersListParams,
  AdminUserDto,
} from 'identity-domain';
import { API_CONFIG, ApiConfig, ApiEnvelope, ApiMeta } from 'shared-http';

@Injectable({ providedIn: 'root' })
export class IdentityAdminApiService {
  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) private readonly apiConfig: ApiConfig,
  ) {}

  createUser(payload: AdminCreateUserRequest): Observable<AdminCreateUserEnvelope> {
    return this.http
      .post<AdminCreateUserEnvelope | AdminCreateUserResponse>(
        `${this.apiConfig.identityBaseUrl}/api/v1/admin/users`,
        payload,
      )
      .pipe(map((raw) => this.asEnvelope(raw)));
  }

  createEnterprise(payload: AdminCreateEnterpriseRequest): Observable<AdminCreateEnterpriseEnvelope> {
    return this.http
      .post<AdminCreateEnterpriseEnvelope | AdminCreateEnterpriseResponse>(
        `${this.apiConfig.identityBaseUrl}/api/v1/admin/enterprises`,
        payload,
      )
      .pipe(map((raw) => this.asEnvelope(raw)));
  }

  listUsers(params: AdminUsersListParams = {}): Observable<AdminUsersListEnvelope> {
    return this.http
      .get<AdminUsersListEnvelope | { items?: AdminUserDto[]; cursor?: string | null; has_more?: boolean; total?: number | null }>(
        `${this.apiConfig.identityBaseUrl}/api/v1/admin/users`,
        { params: this.buildAdminUsersQueryParams(params) },
      )
      .pipe(map((raw) => this.asUsersListEnvelope(raw)));
  }

  getUserById(userId: string): Observable<AdminUserDetailEnvelope> {
    return this.http
      .get<AdminUserDetailEnvelope | AdminUserDetailDto>(
        `${this.apiConfig.identityBaseUrl}/api/v1/admin/users/${encodeURIComponent(userId)}`,
      )
      .pipe(map((raw) => this.asEnvelope(raw)));
  }

  patchUser(userId: string, payload: AdminPatchUserRequest): Observable<AdminUserDetailEnvelope> {
    return this.http
      .patch<AdminUserDetailEnvelope | AdminUserDetailDto>(
        `${this.apiConfig.identityBaseUrl}/api/v1/admin/users/${encodeURIComponent(userId)}`,
        payload,
      )
      .pipe(map((raw) => this.asEnvelope(raw)));
  }

  listEnterprises(params: AdminEnterprisesListParams = {}): Observable<AdminEnterprisesListEnvelope> {
    return this.http
      .get<
        | AdminEnterprisesListEnvelope
        | {
            items?: AdminEnterpriseSummaryDto[];
            cursor?: string | null;
            has_more?: boolean;
            total?: number | null;
          }
      >(`${this.apiConfig.identityBaseUrl}/api/v1/admin/enterprises`, {
        params: this.buildAdminEnterprisesQueryParams(params),
      })
      .pipe(map((raw) => this.asEnterprisesListEnvelope(raw)));
  }

  getEnterpriseById(enterpriseId: string): Observable<AdminEnterpriseDetailEnvelope> {
    return this.http
      .get<AdminEnterpriseDetailEnvelope | AdminEnterpriseDetailDto>(
        `${this.apiConfig.identityBaseUrl}/api/v1/admin/enterprises/${encodeURIComponent(enterpriseId)}`,
      )
      .pipe(map((raw) => this.asEnvelope(raw)));
  }

  patchEnterpriseKyb(
    enterpriseId: string,
    payload: AdminPatchEnterpriseKybRequest,
  ): Observable<AdminEnterpriseDetailEnvelope> {
    return this.http
      .patch<AdminEnterpriseDetailEnvelope | AdminEnterpriseDetailDto>(
        `${this.apiConfig.identityBaseUrl}/api/v1/admin/enterprises/${encodeURIComponent(enterpriseId)}/kyb`,
        payload,
      )
      .pipe(map((raw) => this.asEnvelope(raw)));
  }

  listAdminEconomicSectors(): Observable<AdminEconomicSectorsListEnvelope> {
    return this.http
      .get<AdminEconomicSectorsListEnvelope | { data?: AdminEconomicSectorDto[] }>(
        `${this.apiConfig.identityBaseUrl}/api/v1/admin/economic-sectors`,
      )
      .pipe(map((raw) => this.asEconomicSectorsEnvelope(raw)));
  }

  patchAdminEconomicSector(
    sectorId: string,
    payload: AdminPatchEconomicSectorRequest,
  ): Observable<AdminEconomicSectorEnvelope> {
    return this.http
      .patch<AdminEconomicSectorEnvelope | AdminEconomicSectorDto>(
        `${this.apiConfig.identityBaseUrl}/api/v1/admin/economic-sectors/${encodeURIComponent(sectorId)}`,
        payload,
      )
      .pipe(map((raw) => this.asEnvelope(raw)));
  }

  private buildAdminUsersQueryParams(params: AdminUsersListParams): HttpParams {
    return this.toHttpParams({
      email: params.email,
      role: params.role,
      enterprise_id: params.enterprise_id,
      status: params.status,
      cursor: params.cursor,
      limit: params.limit,
    });
  }

  private buildAdminEnterprisesQueryParams(params: AdminEnterprisesListParams): HttpParams {
    return this.toHttpParams({
      search: params.search,
      status: params.status,
      cursor: params.cursor,
      limit: params.limit,
    });
  }

  private toHttpParams(record: Record<string, string | number | boolean | undefined | null>): HttpParams {
    let hp = new HttpParams();
    for (const [key, value] of Object.entries(record)) {
      if (value === undefined || value === null || value === '') {
        continue;
      }
      hp = hp.set(key, String(value));
    }
    return hp;
  }

  private asUsersListEnvelope(
    payload:
      | AdminUsersListEnvelope
      | { items?: AdminUserDto[]; cursor?: string | null; has_more?: boolean; total?: number | null },
  ): AdminUsersListEnvelope {
    if (this.isEnvelope(payload)) {
      return payload;
    }
    const list = Array.isArray(payload?.items) ? payload.items : [];
    const meta: ApiMeta = {
      cursor: payload?.cursor ?? null,
      has_more: payload?.has_more ?? false,
      total: payload?.total ?? null,
    };
    return { data: list, meta };
  }

  private asEnterprisesListEnvelope(
    payload:
      | AdminEnterprisesListEnvelope
      | {
          items?: AdminEnterpriseSummaryDto[];
          cursor?: string | null;
          has_more?: boolean;
          total?: number | null;
        },
  ): AdminEnterprisesListEnvelope {
    if (this.isEnvelope(payload)) {
      return payload;
    }
    const list = Array.isArray(payload?.items) ? payload.items : [];
    const meta: ApiMeta = {
      cursor: payload?.cursor ?? null,
      has_more: payload?.has_more ?? false,
      total: payload?.total ?? null,
    };
    return { data: list, meta };
  }

  private asEnvelope<T>(payload: ApiEnvelope<T> | T): ApiEnvelope<T> {
    if (this.isEnvelope(payload)) {
      return payload;
    }
    return { data: payload };
  }

  private asEconomicSectorsEnvelope(
    payload: AdminEconomicSectorsListEnvelope | { data?: AdminEconomicSectorDto[] },
  ): AdminEconomicSectorsListEnvelope {
    if (this.isEnvelope(payload)) {
      return payload as AdminEconomicSectorsListEnvelope;
    }
    return { data: payload?.data ?? [] };
  }

  private isEnvelope<T>(value: unknown): value is ApiEnvelope<T> {
    return Boolean(value) && typeof value === 'object' && 'data' in (value as Record<string, unknown>);
  }
}
