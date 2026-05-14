import type { PortalAppKind } from './portal-app.token';
import { authRoutesForPortal } from './auth-flow-routes';

/** Ruta absoluta al formulario de login invitado según el portal que empaqueta la app. */
export function signInPathForPortal(portal: PortalAppKind): string {
  return authRoutesForPortal(portal).login;
}
