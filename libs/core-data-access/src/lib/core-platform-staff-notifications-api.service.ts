import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';

import { coreAdminV1Base } from './core-api-base';

export interface PlatformStaffNotificationDto {
  id: string;
  event_id: string;
  event_type: string;
  aggregate_id: string;
  title: string;
  body: string;
  action_url: string;
  is_read: boolean;
  created_at: string;
}

export interface PlatformStaffNotificationsListDto {
  items: PlatformStaffNotificationDto[];
  unread_count: number;
}

@Injectable({ providedIn: 'root' })
export class CorePlatformStaffNotificationsApiService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    this.base = `${coreAdminV1Base(apiConfig)}/platform-notifications`;
  }

  list(options?: {
    unreadOnly?: boolean;
    limit?: number;
  }): Observable<ApiEnvelope<PlatformStaffNotificationsListDto>> {
    let params = new HttpParams();
    if (options?.unreadOnly) params = params.set('unread_only', 'true');
    if (options?.limit != null) params = params.set('limit', String(options.limit));
    return this.http.get<ApiEnvelope<PlatformStaffNotificationsListDto>>(this.base, { params });
  }

  markRead(id: string): Observable<ApiEnvelope<{ marked_read: boolean }>> {
    return this.http.patch<ApiEnvelope<{ marked_read: boolean }>>(`${this.base}/${id}/read`, {});
  }

  markAllRead(): Observable<ApiEnvelope<{ marked_read_all: boolean }>> {
    return this.http.patch<ApiEnvelope<{ marked_read_all: boolean }>>(`${this.base}/read-all`, {});
  }
}
