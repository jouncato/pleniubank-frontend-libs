# Proposal: b2c-data-access

## Why

El cierre del producto cliente persona (cambios paralelos `b2c-persona-closure` en core, `b2c-profile-self-service` en identity y `b2c-persona-ui-closure` en el portal) introduce contratos backend nuevos que las libs compartidas no cubren: transferencias, extractos B2C, preferencias/lectura de notificaciones, perfil `/me`, cambio de contacto, sesiones, cierre de cuenta y design tokens reales. Además existen servicios sin modelos actualizados (`core-statements-api`, `core-transaction-hub-api`) que serán consumidos por primera vez.

## What Changes

- `core-data-access`: nuevo `CoreTransfersApiService` (crear/listar/detalle/resolver destino), extensión de `CoreStatementsApiService` (variante customer + export blob), `CoreNotificationsApiService` (inbox, read individual, preferencias GET/PUT).
- `identity-data-access` (+ `identity-domain`): `IdentityProfileApiService` (`GET/PATCH /me`, cambio teléfono/email, sesiones, cierre de cuenta) con modelos tipados de estados (`closure_status`, challenges pendientes).
- `core-domain`/`paymenthub-domain`: modelos de transferencia, movimiento unificado, preferencia de notificación; códigos de error tipados (`TRANSFER_LIMIT_EXCEEDED`, `BREB_KEY_NOT_RESOLVABLE`, `INSUFFICIENT_FUNDS`, `ACCOUNT_CLOSED`, `STATEMENT_RANGE_EXCEEDED`).
- `design-tokens`: dejar de ser placeholder (16 líneas) y contener los tokens del producto (mockup b2c-mobile-first) exportados como variables CSS y constantes TS.
- Interceptores existentes (`tenant-context`, `correlation-id`, auth) SHALL aplicar automáticamente a los servicios nuevos (sin bypass).

## Capabilities

### New Capabilities
- `b2c-core-api-services`: servicios y modelos para transfers, statements B2C y notificaciones (inbox + preferencias).
- `b2c-identity-api-services`: servicios y modelos para perfil, contacto, sesiones y cierre de cuenta.
- `design-tokens-foundation`: tokens de diseño reales como fuente única para portal y libs.

### Modified Capabilities
<!-- Ninguna: tenant-header-injection no cambia; los servicios nuevos deben cumplirlo. -->

## Impact

- Código: `libs/core-data-access`, `libs/core-domain`, `libs/identity-data-access`, `libs/identity-domain`, `libs/design-tokens`, `libs/shared-http` (mapa de errores nuevos).
- Consumidores: `pleniubank-customer-portal` (cambio paralelo); el backoffice no se toca.
- Compatibilidad: cambios aditivos; sin breaking changes en los servicios existentes.
