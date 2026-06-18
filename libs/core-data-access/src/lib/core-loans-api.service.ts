import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';

import { corePublicV1Base } from './core-api-base';

import type {
  CreateLoanRequest,
  LoanDto,
  PaymentLineDto,
  SimulateLoanRequest,
  SimulateLoanResponse,
  UpdateLoanRequest,
} from 'core-domain';

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

/**
 * @deprecated Since v0.5.0. Use `LendingArrangementService` from `@pleniu/loan-data-access` instead.
 *
 * This service targets the pre-BIAN Core `/api/v1/loans` endpoint.
 * The BIAN-aligned replacement is `LendingArrangementService` which targets `/api/v1/lending-arrangements`.
 *
 * Sunset: 2026-12-31. See migration guide:
 * `docs/migration/libranza-to-lending-arrangement.md`
 *
 * @see LendingArrangementService
 */
@Injectable({ providedIn: 'root' })
export class CoreLoansApiService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    this.base = `${corePublicV1Base(apiConfig)}/loans`;
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
    return this.http.get<ApiEnvelope<LoanDto[]>>(this.base, { params: hp });
  }

  getById(loanId: string): Observable<ApiEnvelope<LoanDto>> {
    return this.http.get<ApiEnvelope<LoanDto>>(`${this.base}/${loanId}`);
  }

  getPayments(loanId: string): Observable<ApiEnvelope<PaymentLineDto[]>> {
    return this.http.get<ApiEnvelope<PaymentLineDto[]>>(`${this.base}/${loanId}/payments`);
  }

  /** Puede responder 501 hasta que exista cronograma en Core. */
  getAmortization(loanId: string): Observable<ApiEnvelope<unknown>> {
    return this.http.get<ApiEnvelope<unknown>>(`${this.base}/${loanId}/amortization`);
  }

  create(body: CreateLoanRequest): Observable<ApiEnvelope<LoanDto>> {
    return this.http.post<ApiEnvelope<LoanDto>>(this.base, body);
  }

  update(loanId: string, body: UpdateLoanRequest): Observable<ApiEnvelope<LoanDto>> {
    return this.http.put<ApiEnvelope<LoanDto>>(`${this.base}/${loanId}`, body);
  }

  simulate(body: SimulateLoanRequest): Observable<ApiEnvelope<SimulateLoanResponse>> {
    return this.http.post<ApiEnvelope<SimulateLoanResponse>>(`${this.base}/simulate`, body);
  }
}
