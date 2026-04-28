import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import type { AmortizationSchedule } from '@pleniu/loan-domain';
import type {
  AmortizationScheduleResponse,
  GenerateScheduleRequest,
} from '../dtos/amortization-schedule.dto';
import { amortizationToDomain } from '../mappers/amortization-schedule.mapper';
import { LOAN_API_BASE_URL } from '../tokens';

@Injectable({ providedIn: 'root' })
export class AmortizationScheduleService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(LOAN_API_BASE_URL);

  generate(
    arrangementId: string,
    payload: GenerateScheduleRequest,
  ): Observable<AmortizationSchedule[]> {
    return this.http
      .post<{ items: AmortizationScheduleResponse[] }>(
        `${this.baseUrl}/lending-arrangements/${arrangementId}/amortization-schedule`,
        payload,
      )
      .pipe(map((res) => res.items.map(amortizationToDomain)));
  }

  get(arrangementId: string): Observable<AmortizationSchedule[]> {
    return this.http
      .get<{ items: AmortizationScheduleResponse[] }>(
        `${this.baseUrl}/lending-arrangements/${arrangementId}/amortization-schedule`,
      )
      .pipe(map((res) => res.items.map(amortizationToDomain)));
  }
}
