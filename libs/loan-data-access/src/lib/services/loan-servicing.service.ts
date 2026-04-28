import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import type { PaymentDto } from '../dtos/loan-servicing.dto';
import { LOAN_API_BASE_URL } from '../tokens';

@Injectable({ providedIn: 'root' })
export class LoanServicingService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(LOAN_API_BASE_URL);

  disburse(
    arrangementId: string,
    payload: { amount: string; currency: string; disbursementAccountId: string },
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/lending-arrangements/${arrangementId}/disburse`,
      {
        amount: payload.amount,
        currency: payload.currency,
        disbursement_account_id: payload.disbursementAccountId,
      },
    );
  }

  applyPayment(
    arrangementId: string,
    payload: {
      amount: string;
      currency: string;
      paymentDate: string;
      source: string;
      reference?: string;
    },
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/lending-arrangements/${arrangementId}/payments`,
      {
        amount: payload.amount,
        currency: payload.currency,
        payment_date: payload.paymentDate,
        source: payload.source,
        reference: payload.reference,
      },
    );
  }

  listPayments(arrangementId: string): Observable<PaymentDto[]> {
    return this.http
      .get<{ items: PaymentDto[] }>(
        `${this.baseUrl}/lending-arrangements/${arrangementId}/payments`,
      )
      .pipe(map((res) => res.items));
  }
}
