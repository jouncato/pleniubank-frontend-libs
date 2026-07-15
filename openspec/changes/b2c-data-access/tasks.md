# Tasks: b2c-data-access

## 1. Design tokens (design-tokens-foundation)

- [x] 1.1 Definir catálogo TS de tokens (`tokens.ts`: colores base+semánticos, tipografía, espaciado, radios, elevación, breakpoints) — descubierto en implementación: `tokens.css`/`tokens.scss` ya eran el catálogo real de producción (épica X-03), no un placeholder; `tokens.ts` se derivó 1:1 de ese archivo existente (ver nota en design.md, decisión 4)
- [x] 1.2 ~~Generación de la hoja CSS desde TS~~ → redefinido: `tokens.css` (ya vigente, importado por customer-portal/backoffice-portal) queda como fuente de verdad; `tokens.ts` es el derivado verificado
- [x] 1.3 README con inventario, equivalencias con el mockup (incluye discrepancia de color primario sin resolver: `#01305d` del mockup vs `#0272de` vigente) y guía de migración desde variables ad-hoc
- [x] 1.4 Test de consistencia TS↔CSS (`tokens.spec.ts`: cada entrada de `DESIGN_TOKENS_CSS_VARS` se verifica contra `tokens.css-snapshot.ts` — el bundler de `ng test` no permite leer `tokens.css` en runtime; el snapshot debe mantenerse a mano si `tokens.css` cambia, ver limitación documentada en el propio archivo y en el README)

## 2. Modelos y errores compartidos

- [x] 2.1 `core-domain`: modelos `Transfer`, `TransferDestination`, `UnifiedMovement` (alinear con transaction-hub existente), `NotificationPreference` (con `locked`), `InAppNotification`
- [x] 2.2 `identity-domain`: `CustomerProfile` (documento enmascarado), `ContactChangeState`, `UserSession`, `ClosureState` (`requested|blocked|completed` + reason)
- [x] 2.3 `shared-http`: códigos tipados nuevos (`TRANSFER_LIMIT_EXCEEDED`, `BREB_KEY_NOT_RESOLVABLE`, `INSUFFICIENT_FUNDS`, `ACCOUNT_CLOSED`, `STATEMENT_RANGE_EXCEEDED`, `IDEMPOTENCY_KEY_REUSED`, `NOT_ELIGIBLE`, `OTP_LOCKED`) en el error mapper

## 3. Servicios core (b2c-core-api-services)

- [x] 3.1 `CoreTransfersApiService`: create (X-Idempotency-Key), list (cursor/filtros), get, resolveDestination; specs con HttpTestingController
- [x] 3.2 `CoreStatementsApiService`: métodos customer `getCustomerStatement`/`exportCustomerStatement` → `{ blob, filename }` con parse de Content-Disposition + fallback (`content-disposition.util.ts`); specs
- [x] 3.3 `CoreNotificationsApiService`: `listNotifications`/`markAsRead`/`markAllRead` ya existían; se añadieron `getPreferences`/`updatePreferences`; specs
- [x] 3.4 Verificar que los servicios nuevos pasan por los interceptores (spec de integración `b2c-services-interceptors.integration.spec.ts`: `X-Tenant-Country` + `X-Correlation-ID`)

## 4. Servicios identity (b2c-identity-api-services)

- [x] 4.1 `IdentityProfileApiService`: getMe, updateName, startPhoneChange/verifyPhoneChange, startEmailChange/verifyEmailChangeOtp (estado pendiente tipado); specs
- [x] 4.2 `IdentitySessionsApiService`: list (marca current), revoke, revokeOthers; specs
- [x] 4.3 Métodos de cierre en `IdentityProfileApiService`: requestClosure, getClosure, cancelClosure con máquina de estados tipada; specs
- [x] 4.4 Spec de anti-enumeración: el mapper no enriquece errores genéricos (cubierto en `error-message.mapper.spec.ts`, tarea 2.3)

## 5. Cierre

- [ ] 5.1 Validar modelos contra los OpenAPI de core/identity cuando los contratos entren en QA — **bloqueado**: `b2c-persona-closure` (core) y `b2c-profile-self-service` (identity) aún no están implementados; los modelos de esta lib se construyeron a partir de sus specs OpenSpec, no de un contrato verificado en ejecución
- [ ] 5.2 Publicar versión de la lib y actualizar el portal (cambio paralelo `b2c-persona-ui-closure`) — pendiente de que el portal consuma explícitamente `CoreTransfersApiService`/`CoreStatementsApiService`/`CoreNotificationsApiService`/`IdentityProfileApiService`/`IdentitySessionsApiService`; no se ha hecho bump de versión todavía
