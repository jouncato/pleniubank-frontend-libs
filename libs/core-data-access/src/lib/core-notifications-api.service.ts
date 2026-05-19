import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig, ApiEnvelope } from '@pleniu/shared-http';

import { corePublicV1Base } from './core-api-base';

export interface InAppNotificationDto {
  id: string;
  customer_id: string;
  advance_id: string | null;
  title: string;
  body: string;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationsListDto {
  items: InAppNotificationDto[];
  unread_count: number;
}

export interface DeviceTokenRequest {
  token: string;
  platform: 'android' | 'ios' | 'web';
}

@Injectable({ providedIn: 'root' })
export class CoreNotificationsApiService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) apiConfig: ApiConfig,
  ) {
    this.base = `${corePublicV1Base(apiConfig)}/customers/me`;
  }

  listNotifications(params?: {
    unread_only?: boolean;
    limit?: number;
  }): Observable<ApiEnvelope<NotificationsListDto>> {
    const queryParams: Record<string, string> = {};
    if (params?.unread_only) queryParams['unread_only'] = 'true';
    if (params?.limit != null) queryParams['limit'] = String(params.limit);
    return this.http.get<ApiEnvelope<NotificationsListDto>>(
      `${this.base}/notifications`,
      { params: queryParams },
    );
  }

  markAllRead(): Observable<ApiEnvelope<{ marked_read: boolean }>> {
    return this.http.patch<ApiEnvelope<{ marked_read: boolean }>>(
      `${this.base}/notifications/read-all`,
      {},
    );
  }

  registerDeviceToken(body: DeviceTokenRequest): Observable<ApiEnvelope<{ registered: boolean; platform: string }>> {
    return this.http.post<ApiEnvelope<{ registered: boolean; platform: string }>>(
      `${this.base}/device-tokens`,
      body,
    );
  }
}
