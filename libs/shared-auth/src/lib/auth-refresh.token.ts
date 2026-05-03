import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

export interface RefreshResponse {
  access_token: string;
  refresh_token?: string;
  /** JWT firmado con ADMIN_JWT_SECRET_KEY; presente cuando el usuario tiene rol admin/staff. */
  admin_access_token?: string | null;
}

export type AuthRefreshHandler = () => Observable<RefreshResponse>;

export const AUTH_REFRESH_HANDLER = new InjectionToken<AuthRefreshHandler>('AUTH_REFRESH_HANDLER');
