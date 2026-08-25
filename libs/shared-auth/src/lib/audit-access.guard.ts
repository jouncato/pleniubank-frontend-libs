import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { SessionStore } from './session-store.service';
import { UserRole } from './shared-auth';

/**
 * Roles alineados con Core `check_audit_access`: solo `admin` y `auditor`
 * pueden leer audit logs. Fuente única de verdad — reutilizar tanto en
 * guards de ruta como en UI que deba mostrar/ocultar accesos al audit log.
 */
export const AUDIT_ACCESS_ROLES: ReadonlyArray<UserRole> = ['admin', 'auditor'];

export function hasAuditAccess(role: UserRole | null | undefined): boolean {
  return !!role && AUDIT_ACCESS_ROLES.includes(role);
}

/**
 * Alineado con Core `check_audit_access`: roles `admin` y `auditor` pueden leer audit logs.
 */
export const auditAccessGuard: CanActivateFn = () => {
  const store = inject(SessionStore);
  const router = inject(Router);
  if (hasAuditAccess(store.claims()?.role)) {
    return true;
  }
  void router.navigate(['/auth/forbidden']);
  return false;
};
