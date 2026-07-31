import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ContractTemplateDto,
  CreateContractTemplateRequest,
  ListContractTemplatesParams,
} from 'core-domain';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';

import { coreAdminV1Base } from './core-api-base';

@Injectable({ providedIn: 'root' })
export class CoreContractTemplatesApiService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    this.base = `${coreAdminV1Base(apiConfig)}/contract-templates`;
  }

  list(params: ListContractTemplatesParams): Observable<ApiEnvelope<ContractTemplateDto[]>> {
    // ADR-008 (Opción B): exactamente uno de company_code/enterprise_id.
    let hp = new HttpParams();
    if (params.enterprise_id) {
      hp = hp.set('enterprise_id', params.enterprise_id);
    } else if (params.company_code) {
      hp = hp.set('company_code', params.company_code);
    }
    if (params.cursor) {
      hp = hp.set('cursor', params.cursor);
    }
    if (params.limit != null) {
      hp = hp.set('limit', String(params.limit));
    }
    return this.http.get<ApiEnvelope<ContractTemplateDto[]>>(this.base, { params: hp });
  }

  create(body: CreateContractTemplateRequest): Observable<ApiEnvelope<ContractTemplateDto>> {
    return this.http.post<ApiEnvelope<ContractTemplateDto>>(this.base, body);
  }

  getById(templateId: string): Observable<ApiEnvelope<ContractTemplateDto>> {
    return this.http.get<ApiEnvelope<ContractTemplateDto>>(`${this.base}/${templateId}`);
  }

  deactivate(templateId: string): Observable<ApiEnvelope<ContractTemplateDto>> {
    return this.http.patch<ApiEnvelope<ContractTemplateDto>>(
      `${this.base}/${templateId}/deactivate`,
      {},
    );
  }
}
