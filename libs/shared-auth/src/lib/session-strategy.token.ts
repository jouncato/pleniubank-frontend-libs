import { InjectionToken } from '@angular/core';

export type SessionStrategy = 'sessionStorage' | 'httpOnlyCookie';

export const SESSION_STRATEGY = new InjectionToken<SessionStrategy>(
  'SESSION_STRATEGY',
  { providedIn: 'root', factory: () => 'sessionStorage' },
);
