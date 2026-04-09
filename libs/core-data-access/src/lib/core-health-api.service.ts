import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig } from '@pleniu/shared-http';

import { corePublicV1Base } from './core-api-base';
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
    const root = corePublicV1Base(apiConfig);
    this.healthUrl = `${root}/health`;
    this.readinessUrl = `${root}/readiness`;
  }

  getHealth(): Observable<CoreHealthResponse> {
    return this.http.get<CoreHealthResponse>(this.healthUrl);
  }

  getReadiness(): Observable<CoreReadinessResponse> {
    return this.http.get<CoreReadinessResponse>(this.readinessUrl);
  }
}
