import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_CONFIG, ApiConfig, ApiEnvelope } from 'shared-http';

import type {
  AuthorizeRequest,
  BatchDetailResponse,
  BatchRequest,
  BatchResponse,
  CustomPostingRequest,
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
    this.base = `${apiConfig.coreBaseUrl}/api/v1/postings`;
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
}
