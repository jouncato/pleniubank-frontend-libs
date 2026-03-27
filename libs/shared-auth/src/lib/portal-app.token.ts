import { InjectionToken } from '@angular/core';

/** Distingue customer-portal vs backoffice-portal para flujos de login (admin solo backoffice). */
export type PortalAppKind = 'customer' | 'backoffice';

export const PORTAL_APP = new InjectionToken<PortalAppKind>('PORTAL_APP', {
  factory: (): PortalAppKind => 'customer',
});
