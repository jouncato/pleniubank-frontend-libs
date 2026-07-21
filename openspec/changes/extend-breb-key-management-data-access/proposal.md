# Proposal: extend-breb-key-management-data-access (frontend-libs)

**Status:** Proposed (2026-07-19). Contraparte data-access del change de core `extend-breb-key-management-co` (llave personalizada CUSTOM + llave principal). Mismo patrón cross-repo que `breb-key-account-linkage` / `-data-access` / `-ui`.

## Why

`CoreBrebKeysSelfServiceApiService` (`@pleniu/core-data-access`) y los modelos de `core-domain` solo conocen los tipos CEDULA/CELULAR/EMAIL y no modelan `is_primary`. El change de core añade el tipo `CUSTOM`, el campo `is_primary` en el DTO y el endpoint de cambio de llave principal; sin esta contraparte, los portales no pueden consumirlos con contratos tipados (propósito declarado de `virtual-account-data-access`).

## What Changes

- `key_type` amplía su unión de tipos con `CUSTOM`.
- El modelo de llave incluye `is_primary: boolean`.
- Nuevo método `setPrimary(id)` contra el endpoint definido por core.
- Los errores nuevos de core (`CUSTOM_KEY_FORMAT_NOT_ALLOWED`) se integran al mapper de errores compartido con mensaje de usuario en español.

## Capabilities

### Modified Capabilities

- `virtual-account-data-access`: el servicio de llaves soporta CUSTOM y llave principal.

## Impact

- Código: `libs/core-data-access/src/lib/core-breb-keys-self-service-api.service.ts` (+spec), modelos de llave en `core-domain`, `shared-http` error mapper.
- Dependencia dura: los contratos reales (OpenAPI regenerado) de `extend-breb-key-management-co`; la validación campo-por-campo contra los schemas Pydantic reales es requisito existente de la capability y se mantiene.
- No rompe: cambios aditivos; los consumidores actuales compilan sin tocar.
