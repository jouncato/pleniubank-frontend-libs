import type { PortalAppKind } from './portal-app.token';

export interface AuthFlowRoutes {
  readonly login: string;
  readonly forgotPassword: string;
  readonly resetPassword: string;
  readonly recoverySent: string;
}

export const CUSTOMER_AUTH_ROUTES: AuthFlowRoutes = {
  login: '/onboarding/party/access/login',
  forgotPassword: '/onboarding/party/access/forgot-password',
  resetPassword: '/onboarding/party/access/reset-password',
  recoverySent: '/auth/recovery-sent',
};

export const BACKOFFICE_AUTH_ROUTES: AuthFlowRoutes = {
  login: '/backoffice/party/access/login',
  forgotPassword: '/backoffice/party/access/forgot-password',
  resetPassword: '/backoffice/party/access/reset-password',
  recoverySent: '/auth/recovery-sent',
};

export function authRoutesForPortal(portal: PortalAppKind): AuthFlowRoutes {
  return portal === 'backoffice' ? BACKOFFICE_AUTH_ROUTES : CUSTOMER_AUTH_ROUTES;
}

export function recoverySentPathForPortal(portal: PortalAppKind): string {
  return authRoutesForPortal(portal).recoverySent;
}
