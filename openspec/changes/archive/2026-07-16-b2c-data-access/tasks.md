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

- [x] 3.1 `CoreTransfersApiService`: create (X-Idempotency-Key), list (array plano + meta.cursor), get; specs con HttpTestingController — **corregido tras verificar el contrato real ya implementado en core**: no existe endpoint `resolveDestination`/`resolve-destination` (la llave Bre-B solo se resuelve dentro de `create()`); se eliminó ese método y se ajustaron los campos de `Transfer` (`source_customer_id`/`destination_customer_id` en vez de `initiated_by`/`direction`)
- [x] 3.2 `CoreStatementsApiService`: métodos customer `getCustomerStatement`/`exportCustomerStatement` → `{ blob, filename }` con parse de Content-Disposition + fallback (`content-disposition.util.ts`); specs
- [x] 3.3 `CoreNotificationsApiService`: `listNotifications`/`markAsRead`/`markAllRead` ya existían; se añadieron `getPreferences`/`updatePreferences`; specs
- [x] 3.4 Verificar que los servicios nuevos pasan por los interceptores (spec de integración `b2c-services-interceptors.integration.spec.ts`: `X-Tenant-Country` + `X-Correlation-ID`)

## 4. Servicios identity (b2c-identity-api-services)

- [x] 4.1 `IdentityProfileApiService`: getMe, updateName, startPhoneChange/verifyPhoneChange, startEmailChange/verifyEmailChangeOtp/**confirmEmailChange** (paso 3 real, no "fuera del portal" como se asumió); specs — **corregido** tras verificar `src/domain/models.py`/`auth_router.py` reales en identity: cuerpo plano (sin envelope), campos exactos (`customer_id`, `ua_summary`, etc.)
- [x] 4.2 `IdentitySessionsApiService`: list (`{sessions:[...]}`, marca current), revoke (204), revokeOthers (`{revoked_count}`); specs
- [x] 4.3 Métodos de cierre en `IdentityProfileApiService`: **requestClosureChallenge** (paso previo no contemplado originalmente, envía el OTP) + requestClosure, getClosure, cancelClosure con máquina de estados tipada (`requested|blocked|completed|cancelled|challenge_sent`); specs
- [x] 4.4 Spec de anti-enumeración: el mapper no enriquece errores genéricos (cubierto en `error-message.mapper.spec.ts`, tarea 2.3)

## 5. Cierre

- [x] 5.1 Validar modelos contra el código real de core/identity (`b2c-persona-closure` e `b2c-profile-self-service` ya archivados/completos) — validación campo por campo contra los schemas Pydantic y routers reales:
  - `identity-domain`/`identity-data-access`: `CustomerProfile`, `ContactChangeState`, `ClosureState`, `UserSession` y los 10 métodos de `IdentityProfileApiService`/`IdentitySessionsApiService` coinciden exactamente (ruta, verbo, shape, incluido el cuerpo plano sin envelope) con `auth_router.py`/`domain/models.py` en identity-service.
  - `core-domain`: `Transfer`/`TransferDestinationRequest`/`CreateTransferRequest`/`TransferListFilters` coinciden exactamente con `transfer_schemas.py`/`transfers_router.py`. `CoreStatementsApiService` (customer + staff) coincide con `statements_router.py` (el docstring del router en core dice "future sprint" pero está desactualizado: el endpoint customer-scoped ya está montado públicamente y funcional — confirmado en `main.py` `_public_routers`).
  - **Bug real encontrado y corregido**: `NotificationPreferencesResponse`/`NotificationPreference` en `notification-preference.models.ts` no coincidían con `customers_router.py` — el backend devuelve `data.items` (no `data.preferences`) y el campo es `mandatory` (no `locked`). Esto hacía que `notification-preferences.vm.ts` (portal) nunca cargara las preferencias reales (`env.data?.preferences` siempre `undefined` → fallback a `[]`). Corregido el modelo, el servicio consumidor en el portal, el template y los specs de ambos repos; suites completas re-verificadas en verde (frontend-libs `test:all` + portal 357/357).
  - Los códigos de error tipados (`TRANSFER_LIMIT_EXCEEDED`, `BREB_KEY_NOT_RESOLVABLE`, `INSUFFICIENT_FUNDS`, `ACCOUNT_CLOSED`, `STATEMENT_RANGE_EXCEEDED`, `IDEMPOTENCY_KEY_REUSED`) se emiten en core con el mismo string. `NOT_ELIGIBLE`/`OTP_LOCKED` no se encontraron emitidos en core ni en identity-service — quedan sin verificar (posiblemente de otro servicio no cubierto por este change); el mapper los reconoce igual sin romper nada si nunca llegan.
- [x] 5.2 Bump de versión (`0.0.1` → `0.1.0`, mismo patrón que `loan-*`) en `core-data-access`, `core-domain`, `identity-data-access`, `identity-domain`, `design-tokens`, `shared-http`. El portal ya consumía `CoreTransfersApiService`/`CoreStatementsApiService`/`CoreNotificationsApiService`/`IdentityProfileApiService`/`IdentitySessionsApiService` (10 archivos) antes de este apply; no fue necesario código nuevo en el portal, solo el bump.
