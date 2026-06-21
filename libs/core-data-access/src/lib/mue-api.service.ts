import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig } from '@pleniu/shared-http';

// ── Tipos de dominio MUE ──────────────────────────────────────────────────

export type MueChannel = 'EMAIL' | 'SMS' | 'BOTH';
export type MueSchedule = 'IMMEDIATE' | 'DAILY_DIGEST' | 'WEEKLY_DIGEST';
export type MueEventType =
  | 'PAYROLL_ADVANCE_DISBURSED'
  | 'PAYROLL_ADVANCE_SETTLED'
  | 'LOAN_DISBURSED'
  | 'PAYMENT_RECEIVED'
  | 'STATEMENT_GENERATED'
  | 'PAYMENT_REMINDER';

export interface MuePreference {
  id: string;
  user_id: string;
  tenant_id: string;
  event_type: MueEventType;
  channel: MueChannel;
  schedule: MueSchedule;
  enabled: boolean;
}

export interface MuePreferenceUpsert {
  channel: MueChannel;
  schedule: MueSchedule;
  enabled: boolean;
}

export interface MueTenantConfig {
  tenant_id: string;
  tenant_type: string;
  sms_enabled: boolean;
  email_enabled: boolean;
  pdf_enabled: boolean;
  smtp_from_override: string | null;
  max_notifications_per_day: number;
}

export interface MueTenantConfigUpsert {
  tenant_type: string;
  parent_tenant_id?: string | null;
  name?: string;
  sms_enabled: boolean;
  email_enabled: boolean;
  pdf_enabled: boolean;
  smtp_host_override?: string | null;
  smtp_port_override?: number | null;
  smtp_from_override?: string | null;
  max_notifications_per_day: number;
}

export interface MueStatement {
  id: string;
  period_from: string;
  period_to: string;
  status: 'GENERATING' | 'READY' | 'FAILED' | 'EXPIRED';
  generated_at: string | null;
  expires_at: string | null;
}

export interface MueDownloadUrl {
  url: string;
  expires_at: string;
}

// ── Service ───────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class MueApiService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    const root = (apiConfig.mueBaseUrl ?? '/api/mue').replace(/\/$/, '');
    this.base = `${root}/api/v1`;
  }

  // ── Preferencias de usuario ──────────────────────────────────────────

  /** GET /api/v1/notifications/preferences/me — lista preferencias del usuario autenticado. */
  getMyPreferences(userId: string): Observable<MuePreference[]> {
    return this.http.get<MuePreference[]>(
      `${this.base}/notifications/preferences/me`,
      { params: { user_id: userId } },
    );
  }

  /** PUT /api/v1/notifications/preferences/me/{event_type} — crea/actualiza preferencia. */
  upsertPreference(
    userId: string,
    tenantId: string,
    eventType: MueEventType,
    body: MuePreferenceUpsert,
  ): Observable<MuePreference> {
    return this.http.put<MuePreference>(
      `${this.base}/notifications/preferences/me/${eventType}`,
      body,
      { params: { user_id: userId, tenant_id: tenantId } },
    );
  }

  /** DELETE /api/v1/notifications/preferences/me/{event_type} — elimina preferencia. */
  deletePreference(userId: string, eventType: MueEventType): Observable<void> {
    return this.http.delete<void>(
      `${this.base}/notifications/preferences/me/${eventType}`,
      { params: { user_id: userId } },
    );
  }

  // ── Config de tenant (staff/admin) ───────────────────────────────────

  /** GET /api/v1/notifications/preferences/admin/tenants/{tenantId} */
  getTenantConfig(tenantId: string): Observable<MueTenantConfig> {
    return this.http.get<MueTenantConfig>(
      `${this.base}/notifications/preferences/admin/tenants/${tenantId}`,
    );
  }

  /** PUT /api/v1/notifications/preferences/admin/tenants/{tenantId} */
  upsertTenantConfig(tenantId: string, body: MueTenantConfigUpsert): Observable<MueTenantConfig> {
    return this.http.put<MueTenantConfig>(
      `${this.base}/notifications/preferences/admin/tenants/${tenantId}`,
      body,
    );
  }

  // ── Extractos ────────────────────────────────────────────────────────

  /** GET /api/v1/statements/{userId} — lista extractos del usuario. */
  listStatements(userId: string, params?: { limit?: number; offset?: number }): Observable<MueStatement[]> {
    const qp: Record<string, string> = {};
    if (params?.limit != null) qp['limit'] = String(params.limit);
    if (params?.offset != null) qp['offset'] = String(params.offset);
    return this.http.get<MueStatement[]>(
      `${this.base}/statements/${userId}`,
      { params: qp },
    );
  }

  /** GET /api/v1/statements/{statementId}/url — URL de descarga pre-firmada. */
  getDownloadUrl(statementId: string, userId: string): Observable<MueDownloadUrl> {
    return this.http.get<MueDownloadUrl>(
      `${this.base}/statements/${statementId}/url`,
      { params: { user_id: userId } },
    );
  }
}
