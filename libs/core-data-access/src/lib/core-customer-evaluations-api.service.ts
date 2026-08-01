import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig } from '@pleniu/shared-http';
import { corePublicV1Base } from './core-api-base';

export interface RuleExplanationDto {
  rule_code: string;
  title: string;
  description: string;
  action_hint?: string | null;
}

export interface EvaluationExplanationDto {
  evaluation_id: string;
  decision: string;
  explanations: RuleExplanationDto[];
}

export interface EvaluationExplanationEnvelope {
  data: EvaluationExplanationDto;
  meta: Record<string, unknown>;
  errors: unknown[];
}

export interface DisputeRequest {
  reason?: string | null;
}

export interface DisputeResponse {
  id: string;
  evaluation_id: string;
  customer_id: string;
  reason: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | string;
  created_at: string;
}

export interface DisputeEnvelope {
  data: DisputeResponse;
  meta: Record<string, unknown>;
  errors: unknown[];
}

@Injectable({ providedIn: 'root' })
export class CoreCustomerEvaluationsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject<ApiConfig>(API_CONFIG);

  private base(): string {
    return `${corePublicV1Base(this.apiConfig)}/customer/evaluations`;
  }

  getExplanation(evaluationId: string, locale = 'es'): Observable<EvaluationExplanationEnvelope> {
    const params = new HttpParams().set('locale', locale);
    return this.http.get<EvaluationExplanationEnvelope>(
      `${this.base()}/${evaluationId}/explanation`,
      { params },
    );
  }

  createDispute(evaluationId: string, payload: DisputeRequest = {}): Observable<DisputeEnvelope> {
    return this.http.post<DisputeEnvelope>(
      `${this.base()}/${evaluationId}/dispute`,
      payload,
    );
  }

  getDispute(evaluationId: string): Observable<DisputeEnvelope> {
    return this.http.get<DisputeEnvelope>(`${this.base()}/${evaluationId}/dispute`);
  }
}
