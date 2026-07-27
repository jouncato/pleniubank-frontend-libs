import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';

import { coreAdminV1Base } from './core-api-base';

export type CoreSystemStatus = 'healthy' | 'down' | 'unknown' | string;

export interface CoreSystemServiceHealth {
  name: string;
  version?: string | null;
  status: CoreSystemStatus;
  health_url?: string;
  last_heartbeat?: string | null;
  metrics?: Record<string, unknown>;
}

export interface CoreSystemInfrastructureComponent {
  name: string;
  version?: string | null;
  status: CoreSystemStatus;
  metrics?: Record<string, unknown>;
  config?: Record<string, unknown>;
}

export interface CoreSystemOverview {
  health: CoreSystemServiceHealth[];
  infrastructure: CoreSystemInfrastructureComponent[];
  observability: Record<string, unknown>;
  generated_at: string;
}

export interface CoreSystemServiceDetail extends CoreSystemServiceHealth {
  checked_at: string;
  config?: Record<string, unknown>;
}

export interface CorePrometheusQueryResult {
  query: string;
  result: unknown[];
  result_type?: string | null;
  status: string;
  generated_at: string;
}

export interface CoreSystemActionResult {
  action: string;
  status: string;
  execution_mode: string;
  executed: boolean;
  message: string;
  requested_by: string;
  reason?: string | null;
  dry_run: boolean;
  generated_at: string;
}

export interface CoreSystemConfigEntry {
  service_name: string;
  environment: string;
  config_json?: Record<string, unknown>;
  config?: Record<string, unknown>;
  version: number;
  is_active: boolean;
  updated_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  managed_by?: string;
  generated_at?: string;
}

export interface CoreSystemConfigAuditRecord {
  service_name: string;
  environment: string;
  config_json: Record<string, unknown>;
  version: number;
  updated_by?: string | null;
  updated_at: string;
  reason?: string | null;
}

export interface CoreSystemConfigList {
  items: CoreSystemConfigEntry[];
}

export interface CoreSystemConfigAuditList {
  items: CoreSystemConfigAuditRecord[];
  service_name: string;
  environment: string;
}

export interface CoreEnvironmentInfo {
  environment: string;
  source: string;
  is_read_only: boolean;
}

@Injectable({ providedIn: 'root' })
export class CoreSystemApiService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    this.base = `${coreAdminV1Base(apiConfig)}/system`;
  }

  overview(): Observable<ApiEnvelope<CoreSystemOverview>> {
    return this.http.get<ApiEnvelope<CoreSystemOverview>>(`${this.base}/overview`);
  }

  serviceDetail(serviceName: string): Observable<ApiEnvelope<CoreSystemServiceDetail>> {
    return this.http.get<ApiEnvelope<CoreSystemServiceDetail>>(`${this.base}/services/${encodeURIComponent(serviceName)}`);
  }

  queryMetrics(query: string): Observable<ApiEnvelope<CorePrometheusQueryResult>> {
    return this.http.post<ApiEnvelope<CorePrometheusQueryResult>>(`${this.base}/metrics/query`, { query });
  }

  runAction(action: string, reason: string | null, dryRun = true): Observable<ApiEnvelope<CoreSystemActionResult>> {
    return this.http.post<ApiEnvelope<CoreSystemActionResult>>(`${this.base}/actions/${encodeURIComponent(action)}`, {
      reason,
      dry_run: dryRun,
    });
  }

  listConfig(): Observable<ApiEnvelope<CoreSystemConfigList>> {
    return this.http.get<ApiEnvelope<CoreSystemConfigList>>(`${this.base}/config`);
  }

  getConfig(serviceName: string, environment?: string): Observable<ApiEnvelope<CoreSystemConfigEntry>> {
    return this.http.get<ApiEnvelope<CoreSystemConfigEntry>>(`${this.base}/config/${encodeURIComponent(serviceName)}`, {
      params: this.environmentParams(environment),
    });
  }

  getConfigAudit(serviceName: string, environment?: string, limit = 50): Observable<ApiEnvelope<CoreSystemConfigAuditList>> {
    let params = this.environmentParams(environment).set('limit', String(limit));
    return this.http.get<ApiEnvelope<CoreSystemConfigAuditList>>(
      `${this.base}/config/${encodeURIComponent(serviceName)}/audit`,
      { params },
    );
  }

  putConfig(
    serviceName: string,
    config: Record<string, unknown>,
    reason?: string | null,
    environment?: string,
  ): Observable<ApiEnvelope<CoreSystemConfigEntry>> {
    return this.http.put<ApiEnvelope<CoreSystemConfigEntry>>(
      `${this.base}/config/${encodeURIComponent(serviceName)}`,
      { config_json: config, reason },
      { params: this.environmentParams(environment) },
    );
  }

  patchConfig(
    serviceName: string,
    patch: Record<string, unknown>,
    reason?: string | null,
    environment?: string,
  ): Observable<ApiEnvelope<CoreSystemConfigEntry>> {
    return this.http.patch<ApiEnvelope<CoreSystemConfigEntry>>(
      `${this.base}/config/${encodeURIComponent(serviceName)}`,
      { patch, reason },
      { params: this.environmentParams(environment) },
    );
  }

  getEnvironment(): Observable<ApiEnvelope<CoreEnvironmentInfo>> {
    return this.http.get<ApiEnvelope<CoreEnvironmentInfo>>(`${this.base}/environment`);
  }

  private environmentParams(environment?: string): HttpParams {
    return environment ? new HttpParams().set('environment', environment) : new HttpParams();
  }
}
