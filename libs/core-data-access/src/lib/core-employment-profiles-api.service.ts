import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';
import {
  CreateEmploymentProfileRequest,
  CustomerEmploymentProfile,
  CustomerEmploymentProfileListResponse,
  EmploymentProfileListParams,
  PatchEmploymentProfileRequest,
  TerminateEmploymentProfileRequest,
  VerifyEmploymentProfileRequest,
} from '@pleniu/core-domain';
import { coreAdminV1Base, corePublicV1Base } from './core-api-base';

export interface EmploymentProfileAuditEntryDto {
  id: string;
  action: string;
  payload: {
    request?: Record<string, unknown>;
    response?: Record<string, unknown>;
  } | null;
  performed_by: string;
  performed_at: string;
}

export interface ListEmploymentProfileAuditParams {
  cursor?: string | null;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class CoreEmploymentProfilesApiService {
  constructor(
    private http: HttpClient,
    @Inject(API_CONFIG) private config: ApiConfig,
  ) {}

  /** Customer: get own active employment profile (public surface). */
  getMyProfile(): Observable<ApiEnvelope<CustomerEmploymentProfile>> {
    const url = `${corePublicV1Base(this.config)}/employment-profiles/me`;
    return this.http.get<ApiEnvelope<CustomerEmploymentProfile>>(url);
  }

  /** Admin: create employment profile. */
  createProfile(
    payload: CreateEmploymentProfileRequest,
  ): Observable<ApiEnvelope<CustomerEmploymentProfile>> {
    const url = `${coreAdminV1Base(this.config)}/employment-profiles`;
    return this.http.post<ApiEnvelope<CustomerEmploymentProfile>>(url, payload);
  }

  /** Admin/Enterprise: list profiles for a sub-enterprise. */
  listProfiles(
    params: EmploymentProfileListParams,
  ): Observable<ApiEnvelope<CustomerEmploymentProfileListResponse>> {
    const url = `${coreAdminV1Base(this.config)}/employment-profiles`;
    const ids = Array.isArray(params.sub_enterprise_id)
      ? params.sub_enterprise_id
      : [params.sub_enterprise_id];
    let httpParams = ids.reduce(
      (acc, id) => acc.append('sub_enterprise_id', id),
      new HttpParams(),
    );
    if (params.employment_status) {
      httpParams = httpParams.set('employment_status', params.employment_status);
    }
    if (params.verification_status) {
      httpParams = httpParams.set('verification_status', params.verification_status);
    }
    if (params.limit != null) {
      httpParams = httpParams.set('limit', String(params.limit));
    }
    if (params.offset != null) {
      httpParams = httpParams.set('offset', String(params.offset));
    }
    return this.http.get<ApiEnvelope<CustomerEmploymentProfileListResponse>>(url, {
      params: httpParams,
    });
  }

  /** Admin/Enterprise: update profile fields. */
  updateProfile(
    profileId: string,
    payload: PatchEmploymentProfileRequest,
  ): Observable<ApiEnvelope<CustomerEmploymentProfile>> {
    const url = `${coreAdminV1Base(this.config)}/employment-profiles/${profileId}`;
    return this.http.patch<ApiEnvelope<CustomerEmploymentProfile>>(url, payload);
  }

  /**
   * Admin/Enterprise: verify salary.
   *
   * Bug found via live audit: this used to PATCH an empty body, but Core's
   * `CustomerEmploymentProfileVerifyRequest` requires a non-empty
   * `certification_reference` (min_length=1) -- every call would 422.
   */
  verifyProfile(
    profileId: string,
    payload: VerifyEmploymentProfileRequest,
  ): Observable<ApiEnvelope<CustomerEmploymentProfile>> {
    const url = `${coreAdminV1Base(this.config)}/employment-profiles/${profileId}/verify`;
    return this.http.patch<ApiEnvelope<CustomerEmploymentProfile>>(url, payload);
  }

  /** Admin/Enterprise: terminate profile. */
  terminateProfile(
    profileId: string,
    payload: TerminateEmploymentProfileRequest,
  ): Observable<ApiEnvelope<CustomerEmploymentProfile>> {
    const url = `${coreAdminV1Base(this.config)}/employment-profiles/${profileId}/terminate`;
    return this.http.patch<ApiEnvelope<CustomerEmploymentProfile>>(url, payload);
  }

  /** Admin/Enterprise: bitácora de negocio (auditoría) de un perfil laboral. */
  getProfileAudit(
    profileId: string,
    params: ListEmploymentProfileAuditParams = {},
  ): Observable<ApiEnvelope<EmploymentProfileAuditEntryDto[]>> {
    const url = `${coreAdminV1Base(this.config)}/employment-profiles/${profileId}/audit`;
    let httpParams = new HttpParams();
    if (params.cursor) {
      httpParams = httpParams.set('cursor', params.cursor);
    }
    if (params.limit != null) {
      httpParams = httpParams.set('limit', String(params.limit));
    }
    return this.http.get<ApiEnvelope<EmploymentProfileAuditEntryDto[]>>(url, { params: httpParams });
  }

  /** Admin: get full employment history for a customer. */
  getCustomerEmploymentHistory(
    customerId: string,
  ): Observable<ApiEnvelope<CustomerEmploymentProfileListResponse>> {
    const url = `${coreAdminV1Base(this.config)}/customers/${customerId}/employment`;
    return this.http.get<ApiEnvelope<CustomerEmploymentProfileListResponse>>(url);
  }
}
