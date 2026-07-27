import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';

import { coreAdminV1Base } from './core-api-base';

export interface BrebPositionDto {
  suspense_account_id: string;
  account_status: string;
  jurisdiction: string | null;
  balance: {
    committed: string;
    pending_out: string;
    pending_in: string;
    denomination: string;
  };
  as_of: string;
}

export interface BrebReconciliationResultDto {
  railReference: string;
  orderId: string | null;
  result: 'MATCHED' | 'DIVERGED' | 'NOT_FOUND';
  expectedAmount: string | null;
  extractAmount: string | null;
}

export interface BrebReconciliationRunResponse {
  country: string;
  cycleDate: string;
  results: BrebReconciliationResultDto[];
}

export interface BrebReconciliationExceptionDto {
  exceptionId: string;
  orderId: string | null;
  railReference: string;
  result: string;
  expectedAmount: string | null;
  extractAmount: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface BrebReconciliationExceptionsResponse {
  country: string;
  cycleDate: string;
  exceptions: BrebReconciliationExceptionDto[];
}

@Injectable({ providedIn: 'root' })
export class CoreBrebTreasuryApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject<ApiConfig>(API_CONFIG);
  private readonly base = coreAdminV1Base(this.apiConfig);

  getPosition(): Observable<ApiEnvelope<BrebPositionDto>> {
    return this.http.get<ApiEnvelope<BrebPositionDto>>(`${this.base}/gl-reporting/treasury/breb-position`);
  }

  runReconciliation(country: string, cycleDate: string): Observable<BrebReconciliationRunResponse> {
    return this.http.post<BrebReconciliationRunResponse>(`${this.base}/paymenthub/rails/breb/reconciliation`, {
      country,
      cycle_date: cycleDate,
    });
  }

  listReconciliationExceptions(country: string, cycleDate: string): Observable<BrebReconciliationExceptionsResponse> {
    const params = new HttpParams().set('country', country).set('cycle_date', cycleDate);
    return this.http.get<BrebReconciliationExceptionsResponse>(
      `${this.base}/paymenthub/rails/breb/reconciliation/exceptions`,
      { params },
    );
  }
}
