import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';

import { corePublicV1Base } from './core-api-base';

export interface PayrollEligibilityRequest {
  customer_id: string;
  employment_tenure_months?: number | null;
  salary_amount?: number | null;
}

export interface PayrollEligibilityResponse {
  customer_id: string;
  max_advance_amount: number;
  denomination: string;
  score: number;
  is_eligible: boolean;
  estimated_payroll_deduction_date?: string | null;
}

@Injectable({ providedIn: 'root' })
export class CoreScoringApiService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    this.base = `${corePublicV1Base(apiConfig)}/credit-scores`;
  }

  getPayrollEligibility(body: PayrollEligibilityRequest): Observable<ApiEnvelope<PayrollEligibilityResponse>> {
    return this.http.post<ApiEnvelope<PayrollEligibilityResponse>>(
      `${this.base}/payroll-eligibility`,
      body,
    );
  }
}
