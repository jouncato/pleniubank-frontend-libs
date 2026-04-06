import type { PortalAppKind } from './portal-app.token';

/** Ruta absoluta al formulario de login invitado según el portal que empaqueta la app. */
export function signInPathForPortal(portal: PortalAppKind): string {
  return portal === 'backoffice' ? '/backoffice/party/access/login' : '/onboarding/party/access/login';
}
