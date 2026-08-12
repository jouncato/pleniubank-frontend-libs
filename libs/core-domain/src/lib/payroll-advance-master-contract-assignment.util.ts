/**
 * Auditoría de calidad 2026-08-12 (P1.3/P1.4): utils puros compartidos por
 * `pleniubank-backoffice-portal` (master-contract-assignments,
 * master-contract-create, sub-enterprise-picker) y
 * `pleniubank-customer-portal` (contract-templates/master-contract-assignments)
 * -- antes reimplementados de forma independiente en cada componente.
 */

/**
 * Invariante ya exigida por Core (fail-closed): el monto por empleado nunca
 * puede superar el cupo aprobado de la unidad. `null`/`undefined` en
 * cualquiera de los dos lados significa "todavía sin definir" -- no hay
 * incoherencia que reportar en ese caso (P1.3, antes triplicado como
 * `amountsAreCoherent`/`isNewAssignmentCoherent`/`isEditCoherent` en
 * `master-contract-assignments.component.ts` e `isAssignmentCoherent` en
 * `master-contract-create.component.ts`).
 */
export function isPayrollAdvanceAmountCoherent(
  limit: number | null | undefined,
  employeeAmount: number | null | undefined,
): boolean {
  if (limit == null || employeeAmount == null) return true;
  return employeeAmount <= limit;
}

/**
 * Extrae el conjunto de `sub_enterprise_id` con una asignación ACTIVA a
 * partir de una lista de asignaciones ya cargada (P1.4). Uso típico: excluir
 * esas unidades de un picker para no permitir una segunda asignación que el
 * backend rechazaría con 409.
 */
export function extractActiveSubEnterpriseIds(
  assignments: readonly { sub_enterprise_id: string; status: string }[],
): Set<string> {
  return new Set(
    assignments.filter((a) => a.status === 'ACTIVE').map((a) => a.sub_enterprise_id),
  );
}
