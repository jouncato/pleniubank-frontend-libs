import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';

import { coreAdminV1Base } from './core-api-base';

export type CoreServiceName = 'aml' | 'fcm' | 'smtp' | 'breb' | 'funding_accounts' | 'ai_llm';

export interface CoreServiceConfigResponse {
  service_name: CoreServiceName;
  is_active: boolean;
  last_tested_at: string | null;
  last_test_status: 'ok' | 'error' | 'untested' | null;
  last_test_message: string | null;
  config_data: Record<string, unknown>;
  secrets_preview: Record<string, string>;
  updated_at: string;
}

export interface CoreTestConnectionResult {
  status: 'ok' | 'error';
  message: string;
  tested_at: string;
}

@Injectable({ providedIn: 'root' })
export class CoreServiceConfigApiService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    this.base = `${coreAdminV1Base(apiConfig)}/service-config`;
  }

  get(serviceName: CoreServiceName): Observable<ApiEnvelope<CoreServiceConfigResponse>> {
    return this.http.get<ApiEnvelope<CoreServiceConfigResponse>>(`${this.base}/${serviceName}`);
  }

  save(
    serviceName: CoreServiceName,
    config: Record<string, unknown>,
  ): Observable<ApiEnvelope<CoreServiceConfigResponse>> {
    return this.http.put<ApiEnvelope<CoreServiceConfigResponse>>(`${this.base}/${serviceName}`, config);
  }

  toggle(
    serviceName: CoreServiceName,
    isActive: boolean,
  ): Observable<ApiEnvelope<CoreServiceConfigResponse>> {
    return this.http.patch<ApiEnvelope<CoreServiceConfigResponse>>(`${this.base}/${serviceName}/toggle`, {
      is_active: isActive,
    });
  }

  test(serviceName: CoreServiceName): Observable<ApiEnvelope<CoreTestConnectionResult>> {
    return this.http.post<ApiEnvelope<CoreTestConnectionResult>>(`${this.base}/${serviceName}/test`, {});
  }
}
