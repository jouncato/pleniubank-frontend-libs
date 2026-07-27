import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig } from '@pleniu/shared-http';
import { corePublicV1Base } from './core-api-base';

export interface CreditApprovalEvaluateRequest {
  application_id?: string | null;
  product_type: string;
  requested_amount: number;
  requested_payment?: number | null;
  requested_term_months?: number | null;
}

export interface CreditApprovalEvaluateResponse {
  decision: 'APPROVED' | 'REJECTED' | 'PENDING_REVIEW' | string;
  max_amount: number | null;
  rules_evaluated: number;
  rules_passed: number;
  rules_failed: number;
  rejection_reason: string | null;
  correlation_id: string;
  evaluation_id: string;
  source: string;
}

export interface CreditApprovalEnvelope {
  data: CreditApprovalEvaluateResponse;
  meta: Record<string, unknown>;
  errors: unknown[];
}

@Injectable({ providedIn: 'root' })
export class CoreCreditApprovalApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject<ApiConfig>(API_CONFIG);

  private get base(): string {
    return `${corePublicV1Base(this.apiConfig)}/credit-approvals`;
  }

  evaluate(payload: CreditApprovalEvaluateRequest): Observable<CreditApprovalEnvelope> {
    return this.http.post<CreditApprovalEnvelope>(`${this.base}/evaluate`, payload);
  }
}
