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
} from '@pleniu/core-domain';
import { coreAdminV1Base, corePublicV1Base } from './core-api-base';

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
    let httpParams = new HttpParams().set('sub_enterprise_id', params.sub_enterprise_id);
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

  /** Admin/Enterprise: verify salary. */
  verifyProfile(profileId: string): Observable<ApiEnvelope<CustomerEmploymentProfile>> {
    const url = `${coreAdminV1Base(this.config)}/employment-profiles/${profileId}/verify`;
    return this.http.patch<ApiEnvelope<CustomerEmploymentProfile>>(url, {});
  }

  /** Admin/Enterprise: terminate profile. */
  terminateProfile(
    profileId: string,
    payload: TerminateEmploymentProfileRequest,
  ): Observable<ApiEnvelope<CustomerEmploymentProfile>> {
    const url = `${coreAdminV1Base(this.config)}/employment-profiles/${profileId}/terminate`;
    return this.http.patch<ApiEnvelope<CustomerEmploymentProfile>>(url, payload);
  }

  /** Admin: get full employment history for a customer. */
  getCustomerEmploymentHistory(
    customerId: string,
  ): Observable<ApiEnvelope<CustomerEmploymentProfileListResponse>> {
    const url = `${coreAdminV1Base(this.config)}/customers/${customerId}/employment`;
    return this.http.get<ApiEnvelope<CustomerEmploymentProfileListResponse>>(url);
  }
}
