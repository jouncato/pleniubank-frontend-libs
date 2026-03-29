import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ContractTemplateDto,
  CreateContractTemplateRequest,
  ListContractTemplatesParams,
} from 'core-domain';
import { API_CONFIG, ApiConfig, ApiEnvelope } from 'shared-http';

@Injectable({ providedIn: 'root' })
export class CoreContractTemplatesApiService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    this.base = `${apiConfig.coreBaseUrl}/api/v1/contract-templates`;
  }

  list(params: ListContractTemplatesParams): Observable<ApiEnvelope<ContractTemplateDto[]>> {
    let hp = new HttpParams().set('company_code', params.company_code);
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
}
