import { InjectionToken } from '@angular/core';

/** Distingue customer vs backoffice vs public (onboarding en public sin shell de app completa). */
export type PortalAppKind = 'customer' | 'backoffice' | 'public';

export const PORTAL_APP = new InjectionToken<PortalAppKind>('PORTAL_APP', {
  factory: (): PortalAppKind => 'customer',
});
