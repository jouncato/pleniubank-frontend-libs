import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';

import { coreAdminV1Base } from './core-api-base';

/**
 * Requisito de negocio (2026-08-15): variable global de cambio INMEDIATO
 * (sin maker-checker) para el techo de usura de Anticipo de Nómina en
 * Colombia -- visible en el dashboard principal del backoffice para
 * cualquier usuario autenticado. Historial append-only inmutable: registrar
 * una nueva vigencia cierra la anterior, nunca la sobrescribe.
 */
export const PAYROLL_ADVANCE_USURY_CEILING_MANAGE_ROLES = [
  'admin',
  'risk_officer',
  'compliance_officer',
] as const;

export interface PayrollAdvanceUsuryCeilingVersionDto {
  id: string;
  country_code: string;
  /** Fracción efectiva anual (0.2966 = 29.66% EA). */
  ceiling_value: string;
  fuente_oficial: string;
  effective_from: string;
  effective_to: string | null;
  is_current: boolean;
  created_at: string;
  created_by: string | null;
  updated_at: string | null;
  updated_by: string | null;
}

export interface RegisterUsuryCeilingBody {
  ceiling_value: number;
  fuente_oficial: string;
  reason: string;
}

@Injectable({ providedIn: 'root' })
export class CorePayrollAdvanceUsuryCeilingApiService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    this.base = `${coreAdminV1Base(apiConfig)}/payroll-advances/usury-ceiling`;
  }

  register(
    body: RegisterUsuryCeilingBody,
  ): Observable<ApiEnvelope<PayrollAdvanceUsuryCeilingVersionDto>> {
    return this.http.post<ApiEnvelope<PayrollAdvanceUsuryCeilingVersionDto>>(this.base, body);
  }

  getCurrent(): Observable<ApiEnvelope<PayrollAdvanceUsuryCeilingVersionDto | null>> {
    return this.http.get<ApiEnvelope<PayrollAdvanceUsuryCeilingVersionDto | null>>(
      `${this.base}/current`,
    );
  }

  listHistory(
    params: { limit?: number } = {},
  ): Observable<ApiEnvelope<{ items: PayrollAdvanceUsuryCeilingVersionDto[] }>> {
    let httpParams = new HttpParams();
    if (params.limit !== undefined) httpParams = httpParams.set('limit', String(params.limit));
    return this.http.get<ApiEnvelope<{ items: PayrollAdvanceUsuryCeilingVersionDto[] }>>(
      `${this.base}/history`,
      { params: httpParams },
    );
  }
}
