import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';

/**
 * Cambio de contexto multi-tenant (enterprise / sub-enterprise) para la sesión
 * actual. Es un único método pero pertenece conceptualmente a auth/sesión, no a
 * onboarding ni a sub-empresas — se mantiene como servicio propio en lugar de
 * forzarlo dentro de otro subdominio. Extraído de `IdentityEnterpriseApiService`
 * (God Class original).
 */
@Injectable({ providedIn: 'root' })
export class IdentityEnterpriseContextApiService {
  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) private readonly apiConfig: ApiConfig,
  ) {}

  /**
   * Reserved for multi-tenant switch; backend returns 501 in MVP. Call only when feature flag is on.
   */
  switchContext(body: Record<string, unknown> = {}): Observable<ApiEnvelope<unknown>> {
    return this.http.post<ApiEnvelope<unknown>>(
      `${this.apiConfig.identityBaseUrl}/api/v1/auth/switch-context`,
      body,
    );
  }
}
