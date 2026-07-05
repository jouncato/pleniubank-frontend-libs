import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';

import { corePublicV1Base } from './core-api-base';

export type BrebKeyType = 'CEDULA' | 'CELULAR' | 'EMAIL';

export interface BrebKeyDto {
  id: string;
  customer_id: string;
  key_type: BrebKeyType;
  is_active: boolean;
  verified_at: string | null;
  mandate_id: string | null;
  created_at: string;
}

export interface RegisterBrebKeyRequest {
  key_type: BrebKeyType;
  key_value: string;
}

export interface BrebKeyListResponse {
  items: BrebKeyDto[];
  total: number;
}

@Injectable({ providedIn: 'root' })
export class CoreBrebKeysApiService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    this.base = `${corePublicV1Base(apiConfig)}/customers`;
  }

  list(customerId: string): Observable<ApiEnvelope<BrebKeyListResponse>> {
    return this.http.get<ApiEnvelope<BrebKeyListResponse>>(`${this.base}/${customerId}/breb-keys`);
  }

  getActive(customerId: string): Observable<ApiEnvelope<BrebKeyDto>> {
    return this.http.get<ApiEnvelope<BrebKeyDto>>(`${this.base}/${customerId}/breb-key`);
  }

  register(customerId: string, body: RegisterBrebKeyRequest): Observable<ApiEnvelope<BrebKeyDto>> {
    return this.http.post<ApiEnvelope<BrebKeyDto>>(`${this.base}/${customerId}/breb-key`, body);
  }

  revoke(customerId: string, keyId: string): Observable<ApiEnvelope<{ deactivated: boolean; breb_key_id: string }>> {
    return this.http.delete<ApiEnvelope<{ deactivated: boolean; breb_key_id: string }>>(`${this.base}/${customerId}/breb-keys/${keyId}`);
  }
}
