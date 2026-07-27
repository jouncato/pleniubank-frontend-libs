import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig } from '@pleniu/shared-http';

import { coreAdminV1Base } from './core-api-base';

export interface CoreScoringOutboxEvent {
  id: string;
  event_type: string;
  payload: Record<string, unknown>;
  partition_key: string | null;
  status: string;
  created_at: string;
  processed_at: string | null;
  retry_count: number;
  error: string | null;
}

export interface CoreScoringOutboxListResponse {
  data: CoreScoringOutboxEvent[];
  meta: {
    total?: number;
    limit?: number;
    offset?: number;
  };
}

export interface CoreScoringOutboxRetryResponse {
  id: string;
  status: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class CoreScoringOutboxApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject<ApiConfig>(API_CONFIG);
  private readonly base = `${coreAdminV1Base(this.apiConfig)}/system/scoring/outbox`;

  list(status = 'DEAD_LETTER', limit = 100, offset = 0): Observable<CoreScoringOutboxListResponse> {
    return this.http.get<CoreScoringOutboxListResponse>(this.base, {
      params: { status, limit: String(limit), offset: String(offset) },
    });
  }

  retry(eventId: string): Observable<CoreScoringOutboxRetryResponse> {
    return this.http.post<CoreScoringOutboxRetryResponse>(`${this.base}/${encodeURIComponent(eventId)}/retry`, {});
  }
}
