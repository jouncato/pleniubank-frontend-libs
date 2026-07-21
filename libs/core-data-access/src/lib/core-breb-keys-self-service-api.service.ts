import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';
import {
  AliasProposalsResponseDto,
  BrebKeyRegisterRequest,
  BrebKeyRevokeResponseDto,
  BrebKeySelfServiceDto,
  BrebKeySelfServiceListResponseDto,
  SetBrebKeyPrimaryResponseDto,
} from '@pleniu/core-domain';

import { corePublicV1Base } from './core-api-base';

/**
 * Bre-B self-service API (`virtual-account-data-access`).
 * Caller-scoped endpoints under `/api/v1/public/customers/me/breb-keys`.
 * Distinto de `CoreBrebKeysApiService` (endpoints administrados por
 * `customer_id` explícito, montados bajo `/customers/{customerId}/breb-key(s)`).
 *
 * El listado y el registro NUNCA re-exponen el valor de la llave (ni
 * enmascarado): `key_value` solo viaja en el cuerpo del POST.
 */
@Injectable({ providedIn: 'root' })
export class CoreBrebKeysSelfServiceApiService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    this.base = `${corePublicV1Base(apiConfig)}/customers/me/breb-keys`;
  }

  list(): Observable<ApiEnvelope<BrebKeySelfServiceListResponseDto>> {
    return this.http.get<ApiEnvelope<BrebKeySelfServiceListResponseDto>>(this.base);
  }

  /**
   * `register_own_breb_key` (core) exige `X-Idempotency-Key`. Se genera una
   * fresca por cada llamada aquí (no expuesta al caller) — cada invocación de
   * `register()` representa una acción explícita distinta del cliente, a
   * diferencia de un reintento de red que deba reutilizar la misma clave.
   */
  register(body: BrebKeyRegisterRequest): Observable<ApiEnvelope<BrebKeySelfServiceDto>> {
    return this.http.post<ApiEnvelope<BrebKeySelfServiceDto>>(this.base, body, {
      headers: new HttpHeaders({ 'X-Idempotency-Key': crypto.randomUUID() }),
    });
  }

  remove(brebKeyId: string): Observable<ApiEnvelope<BrebKeyRevokeResponseDto>> {
    return this.http.delete<ApiEnvelope<BrebKeyRevokeResponseDto>>(`${this.base}/${brebKeyId}`);
  }

  /**
   * `POST .../proposals` (core): sugerencias pre-pobladas (documento/celular/
   * correo) con disponibilidad, derivadas del KYC del cliente autenticado.
   * Nunca incluye CUSTOM (es de ingreso manual) — ver `BrebKeyProposalType`.
   */
  getProposals(): Observable<ApiEnvelope<AliasProposalsResponseDto>> {
    return this.http.post<ApiEnvelope<AliasProposalsResponseDto>>(`${this.base}/proposals`, {});
  }

  /**
   * `PUT .../{id}/primary` (core, extend-breb-key-management-co): designa
   * `brebKeyId` como la llave principal del cliente (exactamente una activa
   * por cliente). 404 si la llave no existe, no está activa o no es propia.
   */
  setPrimary(brebKeyId: string): Observable<ApiEnvelope<SetBrebKeyPrimaryResponseDto>> {
    return this.http.put<ApiEnvelope<SetBrebKeyPrimaryResponseDto>>(
      `${this.base}/${brebKeyId}/primary`,
      {},
    );
  }
}
