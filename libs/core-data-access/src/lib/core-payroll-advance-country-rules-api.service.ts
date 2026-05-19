import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';

import { corePublicV1Base } from './core-api-base';

export interface PayrollAdvanceCountryRuleDto {
  id: string;
  country_code: string;
  currency: string;
  max_advance_amount: number | null;
  max_salary_ratio: number | null;
  min_salary_amount: number | null;
  required_employee_consent: boolean;
  effective_from: string;
  effective_to: string | null;
  regulatory_reference: string;
  metadata: Record<string, unknown>;
}

export interface PayrollAdvanceCountryRuleLookupDto {
  enabled: boolean;
  country_code: string;
  as_of: string;
  reason: string | null;
  rule: PayrollAdvanceCountryRuleDto | null;
}

@Injectable({ providedIn: 'root' })
export class CorePayrollAdvanceCountryRulesApiService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    this.base = `${corePublicV1Base(apiConfig)}/payroll/advance/country-rules`;
  }

  lookup(params: {
    country_code: string;
    as_of?: string | null;
  }): Observable<ApiEnvelope<PayrollAdvanceCountryRuleLookupDto>> {
    let hp = new HttpParams().set('country_code', params.country_code);
    if (params.as_of) hp = hp.set('as_of', params.as_of);
    return this.http.get<ApiEnvelope<PayrollAdvanceCountryRuleLookupDto>>(this.base, {
      params: hp,
    });
  }
}
