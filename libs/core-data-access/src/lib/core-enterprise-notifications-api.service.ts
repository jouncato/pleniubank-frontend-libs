import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';

import { corePublicV1Base } from './core-api-base';

export interface EnterpriseNotificationDto {
  id: string;
  enterprise_id: string;
  sub_enterprise_id: string | null;
  title: string;
  body: string;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
}

export interface EnterpriseNotificationsListDto {
  items: EnterpriseNotificationDto[];
  unread_count: number;
}

@Injectable({ providedIn: 'root' })
export class CoreEnterpriseNotificationsApiService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    this.base = `${corePublicV1Base(apiConfig)}/enterprise-notifications`;
  }

  list(opts?: { unread?: boolean; limit?: number }): Observable<ApiEnvelope<EnterpriseNotificationsListDto>> {
    let params = new HttpParams();
    if (opts?.unread) params = params.set('unread', 'true');
    if (opts?.limit != null) params = params.set('limit', String(opts.limit));
    return this.http.get<ApiEnvelope<EnterpriseNotificationsListDto>>(this.base, { params });
  }

  markRead(id: string): Observable<ApiEnvelope<EnterpriseNotificationDto>> {
    return this.http.patch<ApiEnvelope<EnterpriseNotificationDto>>(
      `${this.base}/${id}/read`, {}
    );
  }

  markAllRead(): Observable<ApiEnvelope<{ marked_read: boolean }>> {
    return this.http.patch<ApiEnvelope<{ marked_read: boolean }>>(
      `${this.base}/read-all`, {}
    );
  }
}
