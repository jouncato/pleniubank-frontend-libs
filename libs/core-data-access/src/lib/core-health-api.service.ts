import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig } from 'shared-http';

import type { CoreHealthResponse, CoreReadinessResponse } from './core-types';

/**
 * Health/readiness del Core: respuestas JSON planas (no envelope estándar).
 */
@Injectable({ providedIn: 'root' })
export class CoreHealthApiService {
  private readonly healthUrl: string;
  private readonly readinessUrl: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    const base = apiConfig.coreBaseUrl;
    this.healthUrl = `${base}/api/v1/health`;
    this.readinessUrl = `${base}/api/v1/readiness`;
  }

  getHealth(): Observable<CoreHealthResponse> {
    return this.http.get<CoreHealthResponse>(this.healthUrl);
  }

  getReadiness(): Observable<CoreReadinessResponse> {
    return this.http.get<CoreReadinessResponse>(this.readinessUrl);
  }
}
