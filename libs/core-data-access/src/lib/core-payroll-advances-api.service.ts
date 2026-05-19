import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';

import { corePublicV1Base } from './core-api-base';

export interface RegisterPayrollAdvanceRequest {
  contract_id: string;
  account_id: string;
  product_id: string;
  customer_id: string;
  employer_id: string;
  amount: number;
  customer_account_id: string;
  disbursement_source_account_id: string;
  denomination?: string;
  correlation_id?: string | null;
  contract_version_id?: string | null;
}

export interface RegisterPayrollAdvanceResponse {
  advance_id: string;
  status: string;
  posting_directives_count: number;
}

export interface PayrollAdvanceListParams {
  status?: string;
  cursor?: string;
  limit?: number;
}

export interface PayrollAdvanceListDto {
  items: PayrollAdvanceDto[];
  next_cursor: string | null;
  total_active: number;
}

export interface SimulatePayrollAdvanceRequest {
  contract_id: string;
  amount: number;
  salary_amount?: number | null;
  denomination?: string;
}

export interface SimulatePayrollAdvanceResponse {
  amount: number;
  fee_rate: number;
  commission: number;
  total_deduction: number;
  denomination: string;
  estimated_deduction_date: string | null;
  exceeds_salary_threshold: boolean | null;
  salary_threshold_pct: number | null;
  salary_data_available: boolean;
}

export interface PayrollAdvanceDto {
  advance_id: string;
  account_id: string;
  product_id: string;
  customer_id: string;
  employer_id: string;
  amount: number;
  denomination: string;
  status: string;
  correlation_id: string | null;
  contract_version_id: string | null;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class CorePayrollAdvancesApiService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    this.base = `${corePublicV1Base(apiConfig)}/payroll-advances`;
  }

  register(body: RegisterPayrollAdvanceRequest): Observable<ApiEnvelope<RegisterPayrollAdvanceResponse>> {
    return this.http.post<ApiEnvelope<RegisterPayrollAdvanceResponse>>(this.base, body);
  }

  getById(advanceId: string): Observable<ApiEnvelope<PayrollAdvanceDto>> {
    return this.http.get<ApiEnvelope<PayrollAdvanceDto>>(`${this.base}/${advanceId}`);
  }

  listByCustomer(customerId: string): Observable<ApiEnvelope<PayrollAdvanceDto[]>> {
    return this.http.get<ApiEnvelope<PayrollAdvanceDto[]>>(this.base, {
      params: { customer_id: customerId },
    });
  }

  list(params: PayrollAdvanceListParams = {}): Observable<ApiEnvelope<PayrollAdvanceListDto>> {
    const httpParams: Record<string, string> = {};
    if (params.status) httpParams['status'] = params.status;
    if (params.cursor) httpParams['cursor'] = params.cursor;
    if (params.limit !== undefined) httpParams['limit'] = String(params.limit);
    return this.http.get<ApiEnvelope<PayrollAdvanceListDto>>(this.base, { params: httpParams });
  }

  simulate(body: SimulatePayrollAdvanceRequest): Observable<ApiEnvelope<SimulatePayrollAdvanceResponse>> {
    return this.http.post<ApiEnvelope<SimulatePayrollAdvanceResponse>>(`${this.base}/simulate`, body);
  }
}
