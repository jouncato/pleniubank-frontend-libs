import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';
import type { PayrollAdvanceEligibilityResponse } from '@pleniu/core-domain';

import { corePublicV1Base } from './core-api-base';

export interface RegisterPayrollAdvanceRequest {
  contract_id: string;
  client_contract_id?: string | null;
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
  /** Approved ADR-008 lineage; omitted for legacy contracts during migration. */
  master_contract_id?: string | null;
  master_assignment_id?: string | null;
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
  customer_id?: string;
  employer_id?: string;
}

export interface DisbursePayrollAdvanceRequest {
  payment_reference?: string | null;
}

export interface DisbursePayrollAdvanceResponse {
  advance_id: string;
  status: string;
  payment_reference: string | null;
}

export interface RepayPayrollAdvanceRequest {
  account_id: string;
  payment_source_account_id: string;
  repayment_amount: number;
  repayment_is_full: boolean;
  denomination?: string;
  effective_date?: string | null;
}

export interface RepayPayrollAdvanceResponse {
  advance_id: string;
  status: string;
  repayment_amount: number;
  repayment_is_full: boolean;
  posting_directives_count: number;
}

export interface UpdatePayrollAdvanceStatusRequest {
  new_status: string;
}

export interface UpdatePayrollAdvanceStatusResponse {
  advance_id: string;
  status: string;
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
  /**
   * OpenSpec centralize-payroll-advance-policy-co (fase 4, tarea 4.3 /
   * fase 8, tarea 8.2): aditivos. Cuando AMBOS se envían, Core además evalúa
   * con el evaluador canónico (`PayrollAdvancePolicyEvaluator`, solo
   * lectura) y anexa `policy_version`/`decision`/`reason_codes`/cupos a la
   * respuesta (design.md Decision 11). Sin ellos, la simulación se comporta
   * EXACTAMENTE igual que antes.
   */
  customer_id?: string | null;
  employer_id?: string | null;
  master_contract_id?: string | null;
  master_assignment_id?: string | null;
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
  // ── Campos canónicos aditivos (tarea 4.3/8.2) ──────────────────────────
  // `null` cuando `customer_id`/`employer_id` no se enviaron en el request o
  // el evaluador canónico no está disponible — el caller sigue recibiendo la
  // simulación de comisión/deducción de siempre, sin ningún campo previo
  // renombrado ni removido.
  policy_version?: string | null;
  decision?: string | null;
  reason_codes?: string[];
  effective_max_amount?: number | null;
  effective_min_amount?: number | null;
  monthly_disbursed_count?: number | null;
  max_monthly_frequency?: number | null;
  remaining_monthly_quota?: number | null;
  has_active_advance?: boolean | null;
}

export interface PayrollAdvanceEligibilityParams {
  customer_id: string;
  /** Si se omite, Core lo resuelve del perfil laboral verificado del cliente. */
  employer_id?: string | null;
  master_contract_id?: string | null;
  master_assignment_id?: string | null;
  /** Monto hipotético a evaluar. Si se omite, se evalúa contra el propio techo efectivo. */
  requested_amount?: number | null;
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
  master_contract_id?: string | null;
  master_assignment_id?: string | null;
  enterprise_id?: string | null;
  created_at: string;
  updated_at: string | null;
  employer_name?: string | null;
  customer_name?: string | null;
  estimated_deduction_date?: string | null;
  disbursed_at?: string | null;
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

  list(params: PayrollAdvanceListParams = {}): Observable<ApiEnvelope<PayrollAdvanceListDto>> {
    let hp = new HttpParams();
    if (params.status) hp = hp.set('status', params.status);
    if (params.cursor) hp = hp.set('cursor', params.cursor);
    if (params.limit !== undefined) hp = hp.set('limit', String(params.limit));
    if (params.customer_id) hp = hp.set('customer_id', params.customer_id);
    if (params.employer_id) hp = hp.set('employer_id', params.employer_id);
    return this.http.get<ApiEnvelope<PayrollAdvanceListDto>>(this.base, { params: hp });
  }

  simulate(body: SimulatePayrollAdvanceRequest): Observable<ApiEnvelope<SimulatePayrollAdvanceResponse>> {
    return this.http.post<ApiEnvelope<SimulatePayrollAdvanceResponse>>(`${this.base}/simulate`, body);
  }

  /**
   * `GET /payroll-advances/eligibility` (OpenSpec centralize-payroll-advance-policy-co,
   * fase 4 tarea 4.2 / fase 8 tarea 8.2): elegibilidad canónica de Core —
   * MISMO evaluador que `/simulate` y `POST /payroll-advances`
   * (design.md Decision 11). Siempre HTTP 200: la decisión completa
   * (incluyendo `REJECTED`/`MANUAL_REVIEW`/`UNAVAILABLE`) viaja en
   * `data.decision`/`data.unavailable_reason`.
   */
  getEligibility(
    params: PayrollAdvanceEligibilityParams,
  ): Observable<ApiEnvelope<PayrollAdvanceEligibilityResponse>> {
    let hp = new HttpParams().set('customer_id', params.customer_id);
    if (params.employer_id) hp = hp.set('employer_id', params.employer_id);
    if (params.master_contract_id) hp = hp.set('master_contract_id', params.master_contract_id);
    if (params.master_assignment_id) hp = hp.set('master_assignment_id', params.master_assignment_id);
    if (params.requested_amount !== undefined && params.requested_amount !== null) {
      hp = hp.set('requested_amount', String(params.requested_amount));
    }
    return this.http.get<ApiEnvelope<PayrollAdvanceEligibilityResponse>>(`${this.base}/eligibility`, {
      params: hp,
    });
  }

  disburse(
    advanceId: string,
    body: DisbursePayrollAdvanceRequest = {},
  ): Observable<ApiEnvelope<DisbursePayrollAdvanceResponse>> {
    return this.http.post<ApiEnvelope<DisbursePayrollAdvanceResponse>>(
      `${this.base}/${advanceId}/disburse`,
      body,
    );
  }

  repay(
    advanceId: string,
    body: RepayPayrollAdvanceRequest,
  ): Observable<ApiEnvelope<RepayPayrollAdvanceResponse>> {
    return this.http.post<ApiEnvelope<RepayPayrollAdvanceResponse>>(
      `${this.base}/${advanceId}/repay`,
      body,
    );
  }

  updateStatus(
    advanceId: string,
    body: UpdatePayrollAdvanceStatusRequest,
  ): Observable<ApiEnvelope<UpdatePayrollAdvanceStatusResponse>> {
    return this.http.patch<ApiEnvelope<UpdatePayrollAdvanceStatusResponse>>(
      `${this.base}/${advanceId}/status`,
      body,
    );
  }
}
