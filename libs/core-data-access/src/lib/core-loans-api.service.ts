import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';

import { corePublicV1Base } from './core-api-base';

import type {
  CreateLoanRequest,
  LendingArrangementPartyRoleDto,
  LoanDto,
  PaymentLineDto,
  SimulateLoanRequest,
  SimulateLoanResponse,
  UpdateLoanRequest,
} from 'core-domain';

type LendingArrangementResponse = Record<string, unknown> & {
  arrangement_id?: string;
  id?: string;
  version?: number;
  account_id?: string;
  product_id?: string;
  contract_version_id?: string | null;
  customer_id?: string;
  employer_id?: string;
  party_roles?: LendingArrangementPartyRoleDto[];
  principal_amount?: string;
  currency?: string;
  amount?: string;
  denomination?: string;
  status?: string;
  instance_parameters?: Record<string, unknown> | null;
  extension_data?: Record<string, unknown> | null;
  created_at?: string | null;
  updated_at?: string | null;
};

function mapToLoanDto(raw: LendingArrangementResponse): LoanDto {
  const partyRoles = raw.party_roles ?? [];
  // Bug found via live audit: Core's LendingArrangementResponse never had a flat
  // `employer_id` field -- the employer travels in `party_roles` (role=EMPLOYER).
  // `raw.employer_id` was always undefined, so "Empresa empleadora" rendered
  // blank for every lending arrangement, not just payroll-advance ones.
  const employerPartyId = partyRoles.find((role) => role.role === 'EMPLOYER')?.party_id;
  return {
    id: raw.arrangement_id ?? raw.id ?? '',
    version: raw.version ?? 1,
    account_id: raw.account_id ?? '',
    product_id: raw.product_id ?? '',
    contract_version_id: raw.contract_version_id ?? null,
    customer_id: raw.customer_id ?? '',
    employer_id: raw.employer_id ?? employerPartyId ?? '',
    party_roles: partyRoles,
    amount: raw.amount ?? raw.principal_amount ?? '0',
    denomination: raw.denomination ?? raw.currency ?? 'COP',
    status: raw.status ?? '',
    instance_parameters: raw.instance_parameters ?? raw.extension_data ?? null,
    created_at: raw.created_at ?? null,
    updated_at: raw.updated_at ?? null,
  };
}

export interface ListLoansParams {
  cursor?: string | null;
  limit?: number;
  status?: string | null;
  customer_id?: string | null;
  /** Obligatorio para tokens enterprise (Core). */
  employer_id?: string | null;
  /** Búsqueda server-side por referencia (ID o fragmento de UUID). */
  search?: string | null;
}

@Injectable({ providedIn: 'root' })
export class CoreLoansApiService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    this.base = `${corePublicV1Base(apiConfig)}/lending-arrangements`;
  }

  list(params: ListLoansParams = {}): Observable<ApiEnvelope<LoanDto[]>> {
    let hp = new HttpParams();
    if (params.cursor) {
      hp = hp.set('cursor', params.cursor);
    }
    if (params.limit != null) {
      hp = hp.set('limit', String(params.limit));
    }
    if (params.status) {
      hp = hp.set('status', params.status);
    }
    if (params.customer_id) {
      hp = hp.set('customer_id', params.customer_id);
    }
    if (params.employer_id) {
      hp = hp.set('employer_id', params.employer_id);
    }
    if (params.search) {
      hp = hp.set('search', params.search);
    }
    return this.http
      .get<ApiEnvelope<LendingArrangementResponse[]>>(this.base, { params: hp })
      .pipe(map((env) => ({ ...env, data: (env.data ?? []).map(mapToLoanDto) })));
  }

  getById(loanId: string): Observable<ApiEnvelope<LoanDto>> {
    return this.http
      .get<ApiEnvelope<LendingArrangementResponse>>(`${this.base}/${loanId}`)
      .pipe(map((env) => ({ ...env, data: mapToLoanDto(env.data) })));
  }

  getPayments(loanId: string): Observable<ApiEnvelope<PaymentLineDto[]>> {
    return this.http.get<ApiEnvelope<PaymentLineDto[]>>(`${this.base}/${loanId}/payments`);
  }

  /** Puede responder 501 hasta que exista cronograma en Core. */
  getAmortization(loanId: string): Observable<ApiEnvelope<unknown>> {
    return this.http.get<ApiEnvelope<unknown>>(`${this.base}/${loanId}/amortization`);
  }

  create(body: CreateLoanRequest): Observable<ApiEnvelope<LoanDto>> {
    return this.http
      .post<ApiEnvelope<LendingArrangementResponse>>(this.base, body)
      .pipe(map((env) => ({ ...env, data: mapToLoanDto(env.data) })));
  }

  update(loanId: string, body: UpdateLoanRequest): Observable<ApiEnvelope<LoanDto>> {
    return this.http
      .put<ApiEnvelope<LendingArrangementResponse>>(`${this.base}/${loanId}`, body)
      .pipe(map((env) => ({ ...env, data: mapToLoanDto(env.data) })));
  }

  simulate(body: SimulateLoanRequest): Observable<ApiEnvelope<SimulateLoanResponse>> {
    return this.http.post<ApiEnvelope<SimulateLoanResponse>>(`${this.base}/simulate`, body);
  }
}
