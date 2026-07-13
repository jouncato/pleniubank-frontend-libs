## Why

El mecanismo transversal de tenant en frontend vive en `libs/shared-http`
(`tenant-context.interceptor.ts` que inyecta `X-Tenant-Country`,
`tenant-context.service.ts`), pero está limitado a `SUPPORTED_TENANTS=['CO']` y
gobernado por el flag `TENANT_HEADER_ENABLED`. Para habilitar el multitenant real
(ADR-016/LB-ST-219) hay que ampliar los tenants soportados y consolidar la resolución
de país desde el claim JWT, ya que todos los portales consumen estas libs.

## What Changes

- Ampliar `SUPPORTED_TENANTS` a `['CO','MX']` en `tenant-country.types.ts`.
- Consolidar en el interceptor la resolución `service → claim JWT country_code → default`.
- Exponer configuración para que los portales activen `TENANT_HEADER_ENABLED` y definan URLs excluidas.
- Mantener `DEFAULT_TENANT='CO'` y `Jurisdiction` VO (`loan-domain`) sin cambios de contrato.

## Capabilities

### New Capabilities
- `tenant-header-injection`: inyección consolidada del header `X-Tenant-Country` con soporte multi-país para todos los portales.

### Modified Capabilities
<!-- openspec/specs vacío en este repo. -->

## Impact

- **Código**: `libs/shared-http/src/lib/tenant-country.types.ts`, `tenant-context.service.ts`, `tenant-context.interceptor.ts`, `tenant-interceptor.config.ts`, `tenant-interceptor-exclude-urls.token.ts`.
- **Dependencias**: LB-ST-210 (claim `country_code`).
- **Consumo**: customer-portal (LB-ST-219) y backoffice-portal.
