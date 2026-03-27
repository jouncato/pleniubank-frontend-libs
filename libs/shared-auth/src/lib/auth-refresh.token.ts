import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

export interface RefreshResponse {
  access_token: string;
  refresh_token?: string;
}

export type AuthRefreshHandler = () => Observable<RefreshResponse>;

export const AUTH_REFRESH_HANDLER = new InjectionToken<AuthRefreshHandler>('AUTH_REFRESH_HANDLER');
