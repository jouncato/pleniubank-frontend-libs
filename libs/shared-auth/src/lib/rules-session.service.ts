import { Injectable, inject } from '@angular/core';
import { decodeJwtPayload } from '@pleniu/shared-http';
import { SessionStore } from './session-store.service';

/**
 * Roles del motor de reglas (rules-engine).
 *
 * Jerarquía implícita (superset):
 *   admin ⊇ approver ⊇ author ⊇ viewer
 *
 * Es decir, un `rules:approver` también satisface `hasRulesRole('rules:author')`
 * y `hasRulesRole('rules:viewer')`.
 */
export type RulesRole = 'rules:admin' | 'rules:approver' | 'rules:author' | 'rules:viewer';

/**
 * Mapa de nivel de rol: mayor número = mayor privilegio.
 * Un rol satisface un requerido si su nivel ≥ al requerido.
 */
const RULES_ROLE_LEVEL: Record<RulesRole, number> = {
  'rules:viewer': 1,
  'rules:author': 2,
  'rules:approver': 3,
  'rules:admin': 4,
};

/**
 * Servicio auxiliar para consultar roles del motor de reglas codificados
 * en el `admin_access_token` JWT (claim `roles: string[]`).
 *
 * No modifica `SessionStore`; lo consume. Centraliza aquí la lógica para
 * evitar duplicarla entre portales (backoffice y customer) — ver HU-RE-048.
 */
@Injectable({ providedIn: 'root' })
export class RulesSessionService {
  private readonly session = inject(SessionStore);

  /**
   * Indica si el token admin actual tiene al menos el rol requerido
   * (considerando la jerarquía).
   */
  hasRulesRole(required: RulesRole): boolean {
    const roles = this.getRolesFromAdminToken();
    if (roles.length === 0) {
      return false;
    }
    const requiredLevel = RULES_ROLE_LEVEL[required];
    return roles.some((r) => {
      const lvl = RULES_ROLE_LEVEL[r as RulesRole];
      return typeof lvl === 'number' && lvl >= requiredLevel;
    });
  }

  /**
   * Devuelve el listado de roles del JWT admin actual. Vacío si no hay token,
   * token malformado, o si el payload no contiene un array `roles`.
   * Nunca lanza excepciones (defensivo).
   */
  getRolesFromAdminToken(): string[] {
    const token = this.session.adminToken();
    if (!token) {
      return [];
    }
    const payload = decodeJwtPayload(token);
    if (!payload) {
      return [];
    }
    const rolesClaim = (payload as { roles?: unknown }).roles;
    if (!Array.isArray(rolesClaim)) {
      return [];
    }
    return rolesClaim.filter((v): v is string => typeof v === 'string');
  }
}
