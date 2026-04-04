import { InjectionToken } from '@angular/core';

/**
 * URL absoluta al inicio de sesión en el portal de cliente.
 * El portal público no expone login local: configurar p. ej. `${customerPortalOrigin}/onboarding/party/access/login`.
 * Si es `null`, los flujos compartidos (p. ej. selector de tipo de Party) usan `routerLink` interno.
 */
export const CUSTOMER_PORTAL_SIGN_IN_URL = new InjectionToken<string | null>(
  'CUSTOMER_PORTAL_SIGN_IN_URL',
  { factory: () => null },
);
