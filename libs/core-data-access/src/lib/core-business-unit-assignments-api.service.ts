import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';

import { corePublicV1Base } from './core-api-base';

import type {
  BusinessUnitAssignmentCreateRequest,
  BusinessUnitAssignmentDto,
  BusinessUnitAssignmentPatchRequest,
} from './core-types';

export interface ListBuAssignmentsParams {
  company_code?: string | null;
  sub_enterprise_id?: string | null;
  product_type?: string | null;
  status?: string | null;
  cursor?: string | null;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class CoreBusinessUnitAssignmentsApiService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    this.base = `${corePublicV1Base(apiConfig)}/business-unit-assignments`;
  }

  list(params: ListBuAssignmentsParams): Observable<ApiEnvelope<BusinessUnitAssignmentDto[]>> {
    let hp = new HttpParams();
    if (params.company_code) {
      hp = hp.set('company_code', params.company_code);
    }
    if (params.sub_enterprise_id) {
      hp = hp.set('sub_enterprise_id', params.sub_enterprise_id);
    }
    if (params.product_type) {
      hp = hp.set('product_type', params.product_type);
    }
    if (params.status) {
      hp = hp.set('status', params.status);
    }
    if (params.cursor) {
      hp = hp.set('cursor', params.cursor);
    }
    if (params.limit != null) {
      hp = hp.set('limit', String(params.limit));
    }
    return this.http.get<ApiEnvelope<BusinessUnitAssignmentDto[]>>(this.base, { params: hp });
  }

  getById(assignmentId: string): Observable<ApiEnvelope<BusinessUnitAssignmentDto>> {
    return this.http.get<ApiEnvelope<BusinessUnitAssignmentDto>>(`${this.base}/${assignmentId}`);
  }

  create(body: BusinessUnitAssignmentCreateRequest): Observable<ApiEnvelope<BusinessUnitAssignmentDto>> {
    return this.http.post<ApiEnvelope<BusinessUnitAssignmentDto>>(this.base, body);
  }

  patch(assignmentId: string, body: BusinessUnitAssignmentPatchRequest): Observable<ApiEnvelope<BusinessUnitAssignmentDto>> {
    return this.http.patch<ApiEnvelope<BusinessUnitAssignmentDto>>(`${this.base}/${assignmentId}`, body);
  }

  listAvailableProducts(subEnterpriseId: string): Observable<ApiEnvelope<BusinessUnitAssignmentDto[]>> {
    return this.http.get<ApiEnvelope<BusinessUnitAssignmentDto[]>>(
      `${this.base}/sub-enterprise/${encodeURIComponent(subEnterpriseId)}/available-products`,
    );
  }

  findActiveByTemplate(
    companyCode: string,
    templateContractId: string,
  ): Observable<ApiEnvelope<BusinessUnitAssignmentDto>> {
    const params = new HttpParams()
      .set('company_code', companyCode)
      .set('template_contract_id', templateContractId);
    return this.http.get<ApiEnvelope<BusinessUnitAssignmentDto>>(`${this.base}/by-template`, { params });
  }
}
