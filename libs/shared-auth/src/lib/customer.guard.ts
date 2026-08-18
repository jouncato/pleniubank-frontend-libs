import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

import { SessionStore } from './session-store.service';

/**
 * Rutas del portal de cliente (`/app/**`): bloquea CUALQUIER rol de staff de
 * plataforma, sin excepción -- hallazgo de seguridad 2026-08-17 (verificado en
 * vivo en QA): una cuenta admin autenticaba normalmente en `/app/customer/app/
 * dashboard` porque `authGuard` solo valida que exista una sesión, nunca el
 * rol. Espejo exacto de `adminGuard` (que protege `/backoffice` con una
 * allow-list de roles de plataforma) pero para el lado cliente.
 *
 * Allow-list (no block-list) a propósito: cualquier rol de staff nuevo que se
 * cree en el futuro (`UserRole` en `pleniubank-core/src/party/domain/
 * value_objects/user_role.py`) queda bloqueado por defecto sin tocar este
 * guard de nuevo, en vez de exigir acordarse de añadirlo a una lista negra.
 * `user` se incluye porque es el rol previo a completar KYC/alta de cliente
 * (pantalla "Activa tu perfil de cliente") -- no es un rol de staff.
 */
const CUSTOMER_PORTAL_ROLES = new Set([
  'user',
  'customer',
  'enterprise_principal',
  'enterprise_admin',
  'enterprise_operator',
]);

export const customerGuard: CanActivateFn = () => {
  const store = inject(SessionStore);
  const router = inject(Router);

  // authGuard corre siempre antes en estas rutas y ya hidrató claims() vía
  // /auth/validate. Si claims aún no están disponibles (error transitorio),
  // dejar pasar -- el backend sigue validando cada llamada real. Mismo
  // criterio defensivo que adminGuard (compara contra `!== null`, no contra
  // el valor de role, para no tratar un role vacío como "sin claims").
  if (store.claims() !== null && !CUSTOMER_PORTAL_ROLES.has(String(store.claims()?.role ?? '').toLowerCase())) {
    void router.navigate(['/auth/forbidden']);
    return false;
  }
  return true;
};
