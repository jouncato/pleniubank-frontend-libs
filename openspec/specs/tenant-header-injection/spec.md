# tenant-header-injection

## Purpose

Inyección consolidada del header `X-Tenant-Country` en las peticiones HTTP salientes
de los portales (customer-portal, backoffice-portal) con soporte multi-país, como
parte de la iniciativa de multitenancy (ADR-016 / LB-ST-219). Vive en
`libs/shared-http` (`tenant-context.interceptor.ts`, `tenant-context.service.ts`).

## Requirements

### Requirement: Soporte multi-país de tenants

La librería SHALL reconocer `CO` y `MX` como tenants soportados y validar cualquier
país frente a esa lista, manteniendo `CO` como default.

#### Scenario: País soportado aceptado

- **WHEN** se selecciona el tenant `MX`
- **THEN** `isSupportedTenant('MX')` es verdadero y el contexto puede fijarse en `MX`

#### Scenario: País no soportado rechazado

- **WHEN** se intenta fijar un tenant no incluido en `SUPPORTED_TENANTS`
- **THEN** la librería lo rechaza y conserva el default

### Requirement: Inyección del header X-Tenant-Country

El interceptor SHALL inyectar `X-Tenant-Country` en las peticiones salientes,
resolviendo el país en el orden `TenantContextService → claim JWT country_code →
default`, respetando el flag `TENANT_HEADER_ENABLED` y las URLs excluidas.

#### Scenario: Header inyectado con el país activo

- **WHEN** el flag está activo y el contexto es `MX`
- **THEN** la petición saliente incluye `X-Tenant-Country: MX`

#### Scenario: URL excluida sin header

- **WHEN** la petición va a una URL configurada como excluida
- **THEN** no se inyecta el header de tenant

#### Scenario: Flag desactivado preserva comportamiento

- **WHEN** `TENANT_HEADER_ENABLED` es falso
- **THEN** no se inyecta el header y el comportamiento es el previo
