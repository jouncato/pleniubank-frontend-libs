import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';

import { corePublicV1Base } from './core-api-base';

export interface ExternalAccountDto {
  external_account_id: string;
  customer_id: string;
  bank_code: string;
  bank_name: string;
  account_number: string;
  account_type: 'SAVINGS' | 'CHECKING';
  owner_name: string;
  alias: string | null;
  is_primary: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING_VERIFICATION';
  created_at: string;
}

export interface RegisterExternalAccountRequest {
  bank_code: string;
  bank_name: string;
  account_number: string;
  account_type: 'SAVINGS' | 'CHECKING';
  owner_name: string;
  alias?: string;
}

@Injectable({ providedIn: 'root' })
export class CoreExternalAccountsApiService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    this.base = `${corePublicV1Base(apiConfig)}/external-accounts`;
  }

  list(): Observable<ApiEnvelope<ExternalAccountDto[]>> {
    return this.http.get<ApiEnvelope<ExternalAccountDto[]>>(this.base);
  }

  register(body: RegisterExternalAccountRequest): Observable<ApiEnvelope<ExternalAccountDto>> {
    return this.http.post<ApiEnvelope<ExternalAccountDto>>(this.base, body);
  }

  getById(id: string): Observable<ApiEnvelope<ExternalAccountDto>> {
    return this.http.get<ApiEnvelope<ExternalAccountDto>>(`${this.base}/${id}`);
  }

  setPrimary(id: string): Observable<ApiEnvelope<ExternalAccountDto>> {
    return this.http.post<ApiEnvelope<ExternalAccountDto>>(`${this.base}/${id}/set-primary`, {});
  }

  deactivate(id: string): Observable<ApiEnvelope<{ deactivated: boolean }>> {
    return this.http.delete<ApiEnvelope<{ deactivated: boolean }>>(`${this.base}/${id}`);
  }
}
