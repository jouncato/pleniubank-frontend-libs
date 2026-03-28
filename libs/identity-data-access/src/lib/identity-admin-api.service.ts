import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  AdminCreateEnterpriseEnvelope,
  AdminCreateEnterpriseResponse,
  AdminCreateEnterpriseRequest,
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
        { params: params as Record<string, string | number | boolean> },
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

  private asEnvelope<T>(payload: ApiEnvelope<T> | T): ApiEnvelope<T> {
    if (this.isEnvelope(payload)) {
      return payload;
    }
    return { data: payload };
  }

  private isEnvelope<T>(value: unknown): value is ApiEnvelope<T> {
    return Boolean(value) && typeof value === 'object' && 'data' in (value as Record<string, unknown>);
  }
}
