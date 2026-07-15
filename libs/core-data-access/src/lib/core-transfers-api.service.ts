import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';
import type {
  CreateTransferRequest,
  ResolvedTransferDestination,
  Transfer,
  TransferKeyType,
  TransferListFilters,
  TransferListResponse,
} from 'core-domain';

import { corePublicV1Base } from './core-api-base';

/** `b2c-transfers` (pleniubank-core, openspec change `b2c-persona-closure`). */
@Injectable({ providedIn: 'root' })
export class CoreTransfersApiService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    this.base = `${corePublicV1Base(apiConfig)}/transfers`;
  }

  /** Crea una transferencia (propia o P2P interna). Requiere clave de idempotencia por intento. */
  create(body: CreateTransferRequest, idempotencyKey: string): Observable<ApiEnvelope<Transfer>> {
    return this.http.post<ApiEnvelope<Transfer>>(this.base, body, {
      headers: new HttpHeaders({ 'X-Idempotency-Key': idempotencyKey }),
    });
  }

  list(filters: TransferListFilters = {}): Observable<ApiEnvelope<TransferListResponse>> {
    let params = new HttpParams();
    if (filters.account_id) params = params.set('account_id', filters.account_id);
    if (filters.date_from) params = params.set('date_from', filters.date_from);
    if (filters.date_to) params = params.set('date_to', filters.date_to);
    if (filters.direction) params = params.set('direction', filters.direction);
    if (filters.cursor) params = params.set('cursor', filters.cursor);
    if (filters.limit !== undefined) params = params.set('limit', String(filters.limit));
    return this.http.get<ApiEnvelope<TransferListResponse>>(this.base, { params });
  }

  get(transferId: string): Observable<ApiEnvelope<Transfer>> {
    return this.http.get<ApiEnvelope<Transfer>>(`${this.base}/${transferId}`);
  }

  /** Resuelve una llave Bre-B local (HMAC) a una cuenta destino. Solo llaves activas y verificadas. */
  resolveDestination(
    keyType: TransferKeyType,
    keyValue: string,
  ): Observable<ApiEnvelope<ResolvedTransferDestination>> {
    const params = new HttpParams().set('key_type', keyType).set('key_value', keyValue);
    return this.http.get<ApiEnvelope<ResolvedTransferDestination>>(
      `${this.base}/resolve-destination`,
      { params },
    );
  }
}
