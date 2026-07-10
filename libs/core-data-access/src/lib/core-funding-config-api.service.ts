import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';
import { coreAdminV1Base } from './core-api-base';

export type FundingAuthMode = 'API_KEY' | 'OAUTH2' | 'BASIC' | 'MTLS';

export interface FundingProfileDto {
  profile_id: string;
  party_bank_account_id: string;
  account_alias: string;
  provider_name: string;
  api_base_url: string;
  auth_mode: FundingAuthMode;
  token_url: string | null;
  client_id: string | null;
  webhook_endpoint: string | null;
  operation_window_start: string;
  operation_window_end: string;
  operation_timezone: string;
  is_active: boolean;
  gl_liquidity_account_code: string;
  gl_risk_account_code: string;
  gl_transit_account_code: string;
  gl_counterparty_account_code: string | null;
  reconciliation_rule_code: string;
  reconciliation_tolerance_amount: number;
  reconciliation_auto_apply: boolean;
  risk_rule_code: string | null;
  risk_exposure_account_code: string | null;
}

export interface FundingConfigData {
  profiles: FundingProfileDto[];
}

export interface FundingConfigResponse {
  service_name: string;
  is_active: boolean;
  last_tested_at: string | null;
  last_test_status: 'ok' | 'error' | null;
  last_test_message: string | null;
  config_data: FundingConfigData;
  secrets_preview: Record<string, string>;
  updated_at: string;
}

export interface FundingProfileUpsertRequest extends FundingProfileDto {
  api_key?: string;
  client_secret?: string;
  basic_username?: string;
  basic_password?: string;
}

export interface FundingConfigUpsertRequest {
  profiles: FundingProfileUpsertRequest[];
}

export interface FundingTestResult {
  status: 'ok' | 'error';
  message: string;
  tested_at: string;
}

@Injectable({ providedIn: 'root' })
export class CoreFundingConfigApiService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    this.base = `${coreAdminV1Base(apiConfig)}/service-config/funding_accounts`;
  }

  get(): Observable<ApiEnvelope<FundingConfigResponse>> {
    return this.http.get<ApiEnvelope<FundingConfigResponse>>(this.base);
  }

  put(payload: FundingConfigUpsertRequest): Observable<ApiEnvelope<FundingConfigResponse>> {
    return this.http.put<ApiEnvelope<FundingConfigResponse>>(this.base, payload);
  }

  toggle(isActive: boolean): Observable<ApiEnvelope<FundingConfigResponse>> {
    return this.http.patch<ApiEnvelope<FundingConfigResponse>>(`${this.base}/toggle`, {
      is_active: isActive,
    });
  }

  test(): Observable<ApiEnvelope<FundingTestResult>> {
    return this.http.post<ApiEnvelope<FundingTestResult>>(`${this.base}/test`, {});
  }
}

