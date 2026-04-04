import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from 'shared-http';

import type {
  ContractPolicyDefinitionDto,
  ContractPolicyResolveDto,
  ContractPolicyValueCreateRequest,
  ContractPolicyValueDto,
  ContractPolicyValuePatchRequest,
} from './core-types';
import { coreAdminV1Base } from './core-api-base';

@Injectable({ providedIn: 'root' })
export class CoreContractPoliciesApiService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    this.base = `${coreAdminV1Base(apiConfig)}/platform/contract-policies`;
  }

  listDefinitions(): Observable<ApiEnvelope<ContractPolicyDefinitionDto[]>> {
    return this.http.get<ApiEnvelope<ContractPolicyDefinitionDto[]>>(`${this.base}/definitions`);
  }

  listValues(definitionId?: string | null): Observable<ApiEnvelope<ContractPolicyValueDto[]>> {
    let params = new HttpParams();
    if (definitionId) {
      params = params.set('definition_id', definitionId);
    }
    return this.http.get<ApiEnvelope<ContractPolicyValueDto[]>>(`${this.base}/values`, { params });
  }

  resolve(params: {
    product_type?: string | null;
    country_code?: string | null;
    company_code?: string | null;
  }): Observable<ApiEnvelope<ContractPolicyResolveDto>> {
    let hp = new HttpParams();
    if (params.product_type) {
      hp = hp.set('product_type', params.product_type);
    }
    if (params.country_code) {
      hp = hp.set('country_code', params.country_code);
    }
    if (params.company_code) {
      hp = hp.set('company_code', params.company_code);
    }
    return this.http.get<ApiEnvelope<ContractPolicyResolveDto>>(`${this.base}/resolve`, { params: hp });
  }

  createValue(body: ContractPolicyValueCreateRequest): Observable<ApiEnvelope<ContractPolicyValueDto>> {
    return this.http.post<ApiEnvelope<ContractPolicyValueDto>>(`${this.base}/values`, body);
  }

  patchValue(
    valueId: string,
    body: ContractPolicyValuePatchRequest,
  ): Observable<ApiEnvelope<ContractPolicyValueDto>> {
    return this.http.patch<ApiEnvelope<ContractPolicyValueDto>>(`${this.base}/values/${valueId}`, body);
  }
}
