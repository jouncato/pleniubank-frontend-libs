import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import type { LendingArrangement, ProductType } from '@pleniu/loan-domain';
import type {
  CreateLendingArrangementRequest,
  LendingArrangementResponse,
  ListLendingArrangementsParams,
  ListLendingArrangementsResponse,
} from '../dtos/lending-arrangement.dto';
import { toDomain, toCreateRequest } from '../mappers/lending-arrangement.mapper';
import { LOAN_API_BASE_URL } from '../tokens';

@Injectable({ providedIn: 'root' })
export class LendingArrangementService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(LOAN_API_BASE_URL);

  create(
    payload: Partial<LendingArrangement> & {
      borrowerPartyId?: string;
      productType: ProductType;
      extensionData?: Record<string, unknown>;
    },
  ): Observable<LendingArrangement> {
    const body: CreateLendingArrangementRequest = toCreateRequest(payload);
    return this.http
      .post<{ data: LendingArrangementResponse } | LendingArrangementResponse>(`${this.baseUrl}/lending-arrangements`, body)
      .pipe(map((res) => {
        const dto = 'data' in res && res.data ? (res as { data: LendingArrangementResponse }).data : (res as LendingArrangementResponse);
        return toDomain(dto);
      }));
  }

  getById(arrangementId: string): Observable<LendingArrangement> {
    return this.http
      .get<{ data: LendingArrangementResponse }>(`${this.baseUrl}/lending-arrangements/${arrangementId}`)
      .pipe(map((res) => toDomain(res.data ?? (res as unknown as LendingArrangementResponse))));
  }

  getVersions(arrangementId: string): Observable<LendingArrangement[]> {
    return this.http
      .get<ListLendingArrangementsResponse>(
        `${this.baseUrl}/lending-arrangements/${arrangementId}/versions`,
      )
      .pipe(map((res) => res.data.map(toDomain)));
  }

  list(
    params: ListLendingArrangementsParams,
  ): Observable<{ items: LendingArrangement[]; total: number }> {
    let p = new HttpParams();
    if (params.customerId) p = p.set('customer_id', params.customerId);
    if (params.status) p = p.set('status', params.status);
    if (params.productType) p = p.set('product_type', params.productType);
    if (params.companyCode) p = p.set('company_code', params.companyCode);
    if (params.page != null) p = p.set('page', String(params.page));
    if (params.pageSize != null) p = p.set('page_size', String(params.pageSize));
    return this.http
      .get<ListLendingArrangementsResponse>(`${this.baseUrl}/lending-arrangements`, { params: p })
      .pipe(map((res) => ({ items: res.data.map(toDomain), total: res.meta.total })));
  }

  activate(arrangementId: string, reason?: string): Observable<LendingArrangement> {
    return this.http
      .post<{ data: LendingArrangementResponse } | LendingArrangementResponse>(
        `${this.baseUrl}/lending-arrangements/${arrangementId}/activate`,
        { reason },
      )
      .pipe(map((res) => { const dto = 'data' in res && res.data ? (res as { data: LendingArrangementResponse }).data : (res as LendingArrangementResponse); return toDomain(dto); }));
  }

  suspend(arrangementId: string, reason: string): Observable<LendingArrangement> {
    return this.http
      .post<{ data: LendingArrangementResponse } | LendingArrangementResponse>(
        `${this.baseUrl}/lending-arrangements/${arrangementId}/suspend`,
        { reason },
      )
      .pipe(map((res) => { const dto = 'data' in res && res.data ? (res as { data: LendingArrangementResponse }).data : (res as LendingArrangementResponse); return toDomain(dto); }));
  }

  resume(arrangementId: string): Observable<LendingArrangement> {
    return this.http
      .post<{ data: LendingArrangementResponse } | LendingArrangementResponse>(
        `${this.baseUrl}/lending-arrangements/${arrangementId}/resume`,
        {},
      )
      .pipe(map((res) => { const dto = 'data' in res && res.data ? (res as { data: LendingArrangementResponse }).data : (res as LendingArrangementResponse); return toDomain(dto); }));
  }

  close(arrangementId: string, reason?: string): Observable<LendingArrangement> {
    return this.http
      .post<{ data: LendingArrangementResponse } | LendingArrangementResponse>(
        `${this.baseUrl}/lending-arrangements/${arrangementId}/close`,
        { reason },
      )
      .pipe(map((res) => { const dto = 'data' in res && res.data ? (res as { data: LendingArrangementResponse }).data : (res as LendingArrangementResponse); return toDomain(dto); }));
  }

  amend(
    arrangementId: string,
    changes: {
      nominalRate?: number;
      maturityDate?: string;
      dayCountConvention?: string;
      extensionData?: Record<string, unknown>;
      reason?: string;
    },
  ): Observable<LendingArrangement> {
    return this.http
      .post<{ data: LendingArrangementResponse } | LendingArrangementResponse>(
        `${this.baseUrl}/lending-arrangements/${arrangementId}/amend`,
        changes,
      )
      .pipe(map((res) => { const dto = 'data' in res && res.data ? (res as { data: LendingArrangementResponse }).data : (res as LendingArrangementResponse); return toDomain(dto); }));
  }

  markDefaulted(arrangementId: string, reason: string): Observable<LendingArrangement> {
    return this.http
      .post<{ data: LendingArrangementResponse } | LendingArrangementResponse>(
        `${this.baseUrl}/lending-arrangements/${arrangementId}/mark-defaulted`,
        { reason },
      )
      .pipe(map((res) => { const dto = 'data' in res && res.data ? (res as { data: LendingArrangementResponse }).data : (res as LendingArrangementResponse); return toDomain(dto); }));
  }

  writeOff(arrangementId: string, reason: string): Observable<LendingArrangement> {
    return this.http
      .post<{ data: LendingArrangementResponse } | LendingArrangementResponse>(
        `${this.baseUrl}/lending-arrangements/${arrangementId}/write-off`,
        { reason },
      )
      .pipe(map((res) => { const dto = 'data' in res && res.data ? (res as { data: LendingArrangementResponse }).data : (res as LendingArrangementResponse); return toDomain(dto); }));
  }
}
