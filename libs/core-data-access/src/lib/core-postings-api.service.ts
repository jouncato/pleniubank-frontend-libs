import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_CONFIG, ApiConfig, ApiEnvelope } from 'shared-http';

import { corePublicV1Base } from './core-api-base';
import type {
  AuthorizeRequest,
  BatchDetailResponse,
  BatchRequest,
  BatchResponse,
  CustomPostingRequest,
  PostingFilters,
  PostingListResponse,
  PostingResponse,
  ReleaseRequest,
  SettleRequest,
} from 'core-domain';

/** Respuesta HTTP + cuerpo para distinguir 201 de 200 (idempotencia batch). */
export interface PostingBatchHttpResult {
  status: number;
  envelope: ApiEnvelope<BatchResponse>;
}

@Injectable({ providedIn: 'root' })
export class CorePostingsApiService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    this.base = `${corePublicV1Base(apiConfig)}/postings`;
  }

  authorize(body: AuthorizeRequest): Observable<ApiEnvelope<PostingResponse>> {
    return this.http.post<ApiEnvelope<PostingResponse>>(`${this.base}/authorize`, body);
  }

  settle(body: SettleRequest): Observable<ApiEnvelope<PostingResponse>> {
    return this.http.post<ApiEnvelope<PostingResponse>>(`${this.base}/settle`, body);
  }

  release(body: ReleaseRequest): Observable<ApiEnvelope<PostingResponse>> {
    return this.http.post<ApiEnvelope<PostingResponse>>(`${this.base}/release`, body);
  }

  custom(body: CustomPostingRequest): Observable<ApiEnvelope<BatchResponse>> {
    return this.http.post<ApiEnvelope<BatchResponse>>(`${this.base}/custom`, body);
  }

  batch(body: BatchRequest): Observable<PostingBatchHttpResult> {
    return this.http
      .post<ApiEnvelope<BatchResponse>>(`${this.base}/batch`, body, { observe: 'response' })
      .pipe(
        map((r) => {
          if (!r.body) {
            throw new Error('Empty batch response body');
          }
          return { status: r.status, envelope: r.body };
        }),
      );
  }

  getBatch(batchId: string): Observable<ApiEnvelope<BatchDetailResponse>> {
    return this.http.get<ApiEnvelope<BatchDetailResponse>>(`${this.base}/${batchId}`);
  }

  getPostings(filters: PostingFilters): Observable<ApiEnvelope<PostingListResponse>> {
    let params = new HttpParams()
      .set('page', String(filters.page))
      .set('size', String(filters.size));
    if (filters.sort) {
      params = params.set('sort', filters.sort);
    }
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    if (filters.from) {
      params = params.set('from', filters.from);
    }
    if (filters.to) {
      params = params.set('to', filters.to);
    }
    return this.http.get<ApiEnvelope<PostingListResponse>>(this.base, { params });
  }

  getReversal(batchId: string): Observable<ApiEnvelope<PostingResponse | null>> {
    return this.http.get<ApiEnvelope<PostingResponse | null>>(`${this.base}/${batchId}/reversal`);
  }
}
