/**
 * Jerarquía B2B en Identity (`POST /auth/validate` → `role`):
 * - `enterprise_principal`: máxima autoridad del tenant.
 * - `enterprise_admin`: administración operativa; no debe mutar la cuenta del Principal (backend + UI).
 * - `enterprise_operator`: acceso operativo de solo consulta al tenant.
 *
 * Mirrors `ENTERPRISE_ROLES` in pleniubank-core's `src/api/v1/authz/roles.py`.
 */

export function isEnterprisePrincipalRole(role: string | undefined | null): boolean {
  return role === 'enterprise_principal';
}

export function isEnterpriseAdministratorRole(role: string | undefined | null): boolean {
  return role === 'enterprise_admin';
}

/**
 * True for roles allowed to view the enterprise console: the tenant's own
 * management roles (principal, admin, operator) plus Pleniu platform staff
 * (`admin`, `employee`) -- the latter mirrors the existing `admin`/`employee`
 * checks already used inside {@link EnterpriseDashboardComponent} to reveal
 * ops-only cards (audit, internal accounts, postings/payments) when platform
 * staff hold enterprise context (e.g. the not-yet-shipped switch-context flow).
 *
 * `enterprise_id`/`sub_enterprise_id` claims are also present on plain `customer`
 * users linked to a company via employee-invitation (self-service payroll-advance
 * eligibility) -- checking claim presence alone is not enough to gate enterprise
 * console access, since that would let an ordinary employee reach the full
 * enterprise dashboard and admin-only routes (accounts, contracts, approvals,
 * customer list, etc.) meant only for the company's own management roles.
 */
export function isEnterpriseManagementRole(role: string | undefined | null): boolean {
  return (
    role === 'enterprise_principal' ||
    role === 'enterprise_admin' ||
    role === 'enterprise_operator' ||
    role === 'admin' ||
    role === 'employee'
  );
}
