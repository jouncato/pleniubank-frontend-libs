import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';

import { coreAdminV1Base } from './core-api-base';

import type { AuditLogDto } from './core-types';

export interface ListAuditLogsParams {
  cursor?: string | null;
  limit?: number;
  entity_type?: string | null;
  action?: string | null;
  created_by?: string | null;
}

@Injectable({ providedIn: 'root' })
export class CoreAuditApiService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    this.base = `${coreAdminV1Base(apiConfig)}/audit/logs`;
  }

  list(params: ListAuditLogsParams): Observable<ApiEnvelope<AuditLogDto[]>> {
    let hp = new HttpParams();
    if (params.cursor) {
      hp = hp.set('cursor', params.cursor);
    }
    if (params.limit != null) {
      hp = hp.set('limit', String(params.limit));
    }
    if (params.entity_type?.trim()) {
      hp = hp.set('entity_type', params.entity_type.trim());
    }
    if (params.action?.trim()) {
      hp = hp.set('action', params.action.trim());
    }
    if (params.created_by?.trim()) {
      hp = hp.set('created_by', params.created_by.trim());
    }
    return this.http.get<ApiEnvelope<AuditLogDto[]>>(this.base, { params: hp });
  }

  getById(logId: string): Observable<ApiEnvelope<AuditLogDto>> {
    return this.http.get<ApiEnvelope<AuditLogDto>>(`${this.base}/${logId}`);
  }
}
