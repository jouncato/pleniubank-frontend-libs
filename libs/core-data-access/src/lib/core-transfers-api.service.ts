import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';
import type { CreateTransferRequest, Transfer, TransferListFilters } from 'core-domain';

import { corePublicV1Base } from './core-api-base';

/**
 * `b2c-transfers` (pleniubank-core, openspec change `b2c-persona-closure`).
 * No hay endpoint de resolución de destino: una llave Bre-B solo se resuelve
 * server-side dentro de `create()`; el error `BREB_KEY_NOT_RESOLVABLE` llega
 * en la respuesta de creación si la llave no es válida/verificada.
 */
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

  list(filters: TransferListFilters = {}): Observable<ApiEnvelope<Transfer[]>> {
    let params = new HttpParams();
    if (filters.account_id) params = params.set('account_id', filters.account_id);
    if (filters.date_from) params = params.set('date_from', filters.date_from);
    if (filters.date_to) params = params.set('date_to', filters.date_to);
    if (filters.cursor) params = params.set('cursor', filters.cursor);
    if (filters.limit !== undefined) params = params.set('limit', String(filters.limit));
    return this.http.get<ApiEnvelope<Transfer[]>>(this.base, { params });
  }

  get(transferId: string): Observable<ApiEnvelope<Transfer>> {
    return this.http.get<ApiEnvelope<Transfer>>(`${this.base}/${transferId}`);
  }
}
