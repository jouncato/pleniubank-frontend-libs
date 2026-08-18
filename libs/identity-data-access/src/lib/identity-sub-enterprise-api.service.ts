import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';
import {
  BulkCreateSubEnterprisesEnvelope,
  BulkCreateSubEnterprisesRequest,
  BulkCreateSubEnterprisesResponse,
  CreateSubEnterpriseEnvelope,
  CreateSubEnterpriseRequest,
  CreateUserEnterpriseEnvelope,
  CreateUserEnterpriseRequest,
  SubEnterpriseDetailDto,
  SubEnterpriseDetailEnvelope,
  SubEnterpriseSummaryDto,
  SubEnterprisesListEnvelope,
  SubEnterprisesListParams,
  SubEnterpriseUsersListEnvelope,
  UpdateSubEnterpriseRequest,
} from 'identity-domain';

/** Identity devuelve muchos POST como cuerpo plano; Core usa `{ data, meta }`. Normalizamos aquí. */
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
 * Sub-empresas (unidades de negocio) y sus usuarios: alta de usuarios de
 * empresa/sub-empresa, y CRUD + listado de sub-empresas. Extraído de
 * `IdentityEnterpriseApiService` (God Class original) como parte de la
 * separación por subdominio.
 */
@Injectable({ providedIn: 'root' })
export class IdentitySubEnterpriseApiService {
  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) private readonly apiConfig: ApiConfig,
  ) {}

  createEnterpriseUser(enterpriseId: string, payload: CreateUserEnterpriseRequest): Observable<CreateUserEnterpriseEnvelope> {
    return this.http.post<CreateUserEnterpriseEnvelope>(
      `${this.apiConfig.identityBaseUrl}/api/v1/enterprise/${encodeURIComponent(enterpriseId)}/users`,
      payload,
    );
  }

  /** List active users linked to a sub-enterprise (business unit). */
  listSubEnterpriseUsers(subEnterpriseId: string): Observable<SubEnterpriseUsersListEnvelope> {
    return this.http.get<SubEnterpriseUsersListEnvelope>(
      `${this.apiConfig.identityBaseUrl}/api/v1/sub-enterprise/${encodeURIComponent(subEnterpriseId)}/users`,
    );
  }

  createSubEnterprise(enterpriseId: string, payload: CreateSubEnterpriseRequest): Observable<CreateSubEnterpriseEnvelope> {
    return this.http
      .post<CreateSubEnterpriseEnvelope | CreateSubEnterpriseEnvelope['data']>(
        `${this.apiConfig.identityBaseUrl}/api/v1/enterprise/${encodeURIComponent(enterpriseId)}/sub-enterprises`,
        payload,
      )
      .pipe(map((body) => asApiEnvelope<CreateSubEnterpriseEnvelope['data']>(body)));
  }

  /** Carga masiva de Unidades de Negocio (plan 2026-08-18), hasta 200 por
   * llamada -- misma respuesta plana normalizada que `createSubEnterprise`. */
  bulkCreateSubEnterprises(
    enterpriseId: string,
    payload: BulkCreateSubEnterprisesRequest,
  ): Observable<BulkCreateSubEnterprisesEnvelope> {
    return this.http
      .post<BulkCreateSubEnterprisesEnvelope | BulkCreateSubEnterprisesResponse>(
        `${this.apiConfig.identityBaseUrl}/api/v1/enterprise/${encodeURIComponent(enterpriseId)}/sub-enterprises/bulk`,
        payload,
      )
      .pipe(map((body) => asApiEnvelope<BulkCreateSubEnterprisesResponse>(body)));
  }

  /** List business units (sub-enterprises) under a parent enterprise. */
  listSubEnterprises(
    enterpriseId: string,
    params: SubEnterprisesListParams = {},
  ): Observable<SubEnterprisesListEnvelope> {
    let httpParams = new HttpParams();
    if (params.status) {
      httpParams = httpParams.set('status', params.status);
    }
    if (params.search && params.search.trim()) {
      httpParams = httpParams.set('search', params.search.trim());
    }
    if (params.limit && params.limit > 0) {
      httpParams = httpParams.set('limit', String(params.limit));
    }
    return this.http
      .get<SubEnterprisesListEnvelope | SubEnterpriseSummaryDto[]>(
        `${this.apiConfig.identityBaseUrl}/api/v1/enterprise/${encodeURIComponent(enterpriseId)}/sub-enterprises`,
        { params: httpParams },
      )
      .pipe(
        map((body) =>
          Array.isArray(body)
            ? ({ data: body } as SubEnterprisesListEnvelope)
            : asApiEnvelope<SubEnterpriseSummaryDto[]>(body),
        ),
      );
  }

  /** Fetch full detail of a business unit (includes user_count). */
  getSubEnterprise(subEnterpriseId: string): Observable<SubEnterpriseDetailEnvelope> {
    return this.http
      .get<SubEnterpriseDetailEnvelope | SubEnterpriseDetailDto>(
        `${this.apiConfig.identityBaseUrl}/api/v1/sub-enterprise/${encodeURIComponent(subEnterpriseId)}`,
      )
      .pipe(map((body) => asApiEnvelope<SubEnterpriseDetailDto>(body)));
  }

  /** Partial update (contact data) of a business unit. */
  updateSubEnterprise(
    subEnterpriseId: string,
    payload: UpdateSubEnterpriseRequest,
  ): Observable<SubEnterpriseDetailEnvelope> {
    return this.http
      .patch<SubEnterpriseDetailEnvelope | SubEnterpriseDetailDto>(
        `${this.apiConfig.identityBaseUrl}/api/v1/sub-enterprise/${encodeURIComponent(subEnterpriseId)}`,
        payload,
      )
      .pipe(map((body) => asApiEnvelope<SubEnterpriseDetailDto>(body)));
  }

  /** Soft delete / deactivate a business unit. Backend returns 204 No Content. */
  deactivateSubEnterprise(subEnterpriseId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiConfig.identityBaseUrl}/api/v1/sub-enterprise/${encodeURIComponent(subEnterpriseId)}`,
    );
  }
}
