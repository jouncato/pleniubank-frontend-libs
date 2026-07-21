## 1. Fix de precedencia de mensajes

- [x] 1.1 Reordenar `verifyEnterpriseEmailUserMessage()` en `libs/identity-feature-enterprise/src/lib/vm/verify-enterprise-email.ts` para que `known[key]` se evalúe antes que `status === 422`
- [ ] 1.2 Revisar `resendEnterpriseOtpUserMessage()` en el mismo archivo por si tiene el mismo patrón de precedencia invertida (no detectado en la sesión de QA, pero misma forma de función)

## 2. Tests

- [ ] 2.1 Agregar/actualizar test unitario de `verifyEnterpriseEmailUserMessage`: `(422, "Verification code expired")` → mensaje específico de código expirado
- [ ] 2.2 Agregar/actualizar test unitario: `(422, "detalle no mapeado")` → mensaje genérico de datos inválidos
- [ ] 2.3 Agregar/actualizar test unitario: `(404, cualquier detalle)` → mensaje de proceso expirado

## 3. Cierre

- [ ] 3.1 Ejecutar suite de tests de `identity-feature-enterprise` y de los portales que la consumen (customer-portal, backoffice-portal) antes de commit
- [ ] 3.2 Commit de los cambios con referencia a este change (`fix-e2e-qa-findings-2026-07-21`)
