/**
 * Jerarquía B2B en Identity (`POST /auth/validate` → `role`):
 * - `enterprise_principal`: máxima autoridad del tenant.
 * - `enterprise_admin`: administración operativa; no debe mutar la cuenta del Principal (backend + UI).
 */

export function isEnterprisePrincipalRole(role: string | undefined | null): boolean {
  return role === 'enterprise_principal';
}

export function isEnterpriseAdministratorRole(role: string | undefined | null): boolean {
  return role === 'enterprise_admin';
}
