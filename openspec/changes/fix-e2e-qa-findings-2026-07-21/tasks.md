## 1. Fix de precedencia de mensajes

- [x] 1.1 Reordenar `verifyEnterpriseEmailUserMessage()` en `libs/identity-feature-enterprise/src/lib/vm/verify-enterprise-email.ts` para que `known[key]` se evalúe antes que `status === 422`
- [x] 1.2 Revisar `resendEnterpriseOtpUserMessage()` en el mismo archivo por si tiene el mismo patrón de precedencia invertida (no detectado en la sesión de QA, pero misma forma de función) — **verificado: no tiene el bug**, ya hace el lookup en `known[key]` antes de cualquier fallback y no tiene catch-all de 422

## 2. Tests

- [x] 2.1 Agregar/actualizar test unitario de `verifyEnterpriseEmailUserMessage`: `(422, "Verification code expired")` → mensaje específico de código expirado
- [x] 2.2 Agregar/actualizar test unitario: `(422, "detalle no mapeado")` → mensaje genérico de datos inválidos
- [x] 2.3 Agregar/actualizar test unitario: `(404, cualquier detalle)` → mensaje de proceso expirado

## 3. Cierre

- [x] 3.1 Ejecutar suite de tests de `identity-feature-enterprise` y de los portales que la consumen antes de commit — `identity-feature-enterprise`: 10/10 tests; `customer-portal` (único consumidor real, vía `app.routes.ts`): 486/486 tests. `backoffice-portal` no consume esta librería.
- [x] 3.2 Commit de los cambios con referencia a este change (`fix-e2e-qa-findings-2026-07-21`)
