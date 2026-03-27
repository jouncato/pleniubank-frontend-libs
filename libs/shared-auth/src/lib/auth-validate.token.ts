import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { SessionClaims } from './session-store.service';

export type AuthValidateHandler = () => Observable<SessionClaims>;

export const AUTH_VALIDATE_HANDLER = new InjectionToken<AuthValidateHandler>(
  'AUTH_VALIDATE_HANDLER',
);
