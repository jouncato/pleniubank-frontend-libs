import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { RulesSessionService, type RulesRole } from './rules-session.service';

/**
 * Guard declarativo para rutas del motor de reglas (HU-RE-048).
 *
 * Uso:
 * ```ts
 * {
 *   path: 'rules/proposals',
 *   canActivate: [rulesRoleGuard],
 *   data: { rulesRole: 'rules:approver' as RulesRole },
 *   ...
 * }
 * ```
 *
 * Si `data.rulesRole` no se especifica, el guard deja pasar.
 * Si el usuario no tiene el rol requerido, redirige a `/auth/forbidden`.
 */
export const rulesRoleGuard: CanActivateFn = (route) => {
  const required = route.data['rulesRole'] as RulesRole | undefined;
  if (!required) {
    return true;
  }
  const svc = inject(RulesSessionService);
  if (svc.hasRulesRole(required)) {
    return true;
  }
  return inject(Router).createUrlTree(['/auth/forbidden']);
};
