import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { SessionStore } from './session-store.service';
import { isEnterpriseManagementRole } from './enterprise-tenant-role';

/**
 * Guards the enterprise console (accounts, loans, contracts, customers/"Beneficiarios",
 * business-structure, approvals, etc.). Requires both an enterprise tenant AND an
 * enterprise management role -- `enterprise_id`/`sub_enterprise_id` claims alone are
 * not sufficient, since plain `customer` employees linked via employee-invitation for
 * self-service payroll-advance also carry those claims and must not reach this console.
 */
export const enterpriseScopeGuard: CanActivateFn = () => {
  const sessionStore = inject(SessionStore);
  const router = inject(Router);
  const claims = sessionStore.claims();

  if (claims?.enterprise_id && isEnterpriseManagementRole(claims?.role)) {
    return true;
  }

  void router.navigate(['/auth/forbidden']);
  return false;
};

/** Rutas que requieren rol de gestión empresarial (Principal o Admin) para crear/modificar recursos de la empresa. */
export const enterprisePrincipalScopeGuard: CanActivateFn = () => {
  const sessionStore = inject(SessionStore);
  const router = inject(Router);
  const claims = sessionStore.claims();
  const managementRoles = ['enterprise_principal', 'enterprise_admin'];
  if (claims?.enterprise_id && managementRoles.includes(claims?.role ?? '')) {
    return true;
  }
  void router.navigate(['/auth/forbidden']);
  return false;
};

/** Rutas B2C con productos Core filtrados por `customer_id` (Customer activo). */
export const personalScopeGuard: CanActivateFn = () => {
  const sessionStore = inject(SessionStore);
  const router = inject(Router);
  const cid = sessionStore.claims()?.customer_id?.trim();
  if (!cid) {
    void router.navigate(['/app/dashboard']);
    return false;
  }
  return true;
};
