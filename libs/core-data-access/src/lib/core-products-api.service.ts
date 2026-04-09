import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';

import { corePublicV1Base } from './core-api-base';

import type { CreateProductRequest, ProductActivateResultDto, ProductDto } from 'core-domain';

export interface ListProductsParams {
  cursor?: string | null;
  limit?: number;
  product_type?: string | null;
  /** `true` / `false` o vacío para no filtrar. */
  is_active?: boolean | null;
}

@Injectable({ providedIn: 'root' })
export class CoreProductsApiService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    this.base = `${corePublicV1Base(apiConfig)}/products`;
  }

  list(params: ListProductsParams = {}): Observable<ApiEnvelope<ProductDto[]>> {
    let hp = new HttpParams();
    if (params.cursor) {
      hp = hp.set('cursor', params.cursor);
    }
    if (params.limit != null) {
      hp = hp.set('limit', String(params.limit));
    }
    if (params.product_type) {
      hp = hp.set('product_type', params.product_type);
    }
    if (params.is_active !== undefined && params.is_active !== null) {
      hp = hp.set('is_active', params.is_active ? 'true' : 'false');
    }
    return this.http.get<ApiEnvelope<ProductDto[]>>(this.base, { params: hp });
  }

  getById(productId: string): Observable<ApiEnvelope<ProductDto>> {
    return this.http.get<ApiEnvelope<ProductDto>>(`${this.base}/${productId}`);
  }

  create(body: CreateProductRequest): Observable<ApiEnvelope<ProductDto>> {
    return this.http.post<ApiEnvelope<ProductDto>>(this.base, body);
  }

  activate(productId: string): Observable<ApiEnvelope<ProductActivateResultDto>> {
    return this.http.put<ApiEnvelope<ProductActivateResultDto>>(
      `${this.base}/${productId}/activate`,
      {},
    );
  }
}
