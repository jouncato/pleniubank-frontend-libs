## 1. Soporte multi-país (LB-ST-219 libs)

- [x] 1.1 Ampliar `SUPPORTED_TENANTS` a `['CO','MX']` en `libs/shared-http/src/lib/tenant-country.types.ts` — único cambio de código real de este change; el resto ya estaba implementado (ver 2.1/2.2/2.3).
- [x] 1.2 Mantener `DEFAULT_TENANT='CO'` y `isSupportedTenant()` — verificado sin cambios: `DEFAULT_TENANT` sigue `'CO'`, `isSupportedTenant()` sigue siendo genérico sobre `SUPPORTED_TENANTS` (no requiere refactor al añadir países).

## 2. Interceptor

- [x] 2.1 Consolidar resolución `service → claim JWT country_code → default` en `tenant-context.interceptor.ts` — ya implementado (gap inexistente): `resolveTenant()` ya sigue exactamente ese orden con `isSupportedTenant()` gateando el claim JWT.
- [x] 2.2 Exponer config `TENANT_HEADER_ENABLED` y token de URLs excluidas para los portales — ya implementado: `tenant-interceptor.config.ts` (`TENANT_HEADER_ENABLED`, default `false`, opt-in por portal) y `tenant-interceptor-exclude-urls.token.ts` (`TENANT_INTERCEPTOR_EXCLUDE_URLS`, default `['/auth/', '/health']`) ya son `InjectionToken`s overridables vía `providers: [...]`.
- [x] 2.3 Verificar `Jurisdiction` VO (`loan-domain`) sin cambios de contrato — confirmado: `isValidJurisdiction()` es un validador de patrón ISO3166-2 genérico, sin acoplamiento a `SUPPORTED_TENANTS`; sin cambios necesarios.

## 3. Tests

- [x] 3.1 Unit: `isSupportedTenant` CO/MX; rechazo de no soportado — nuevo `tenant-country.types.spec.ts` (9 tests): CO/MX aceptados, PE/null/undefined/''/minúsculas rechazados.
- [x] 3.2 Interceptor: header presente/correcto por país; URL excluida sin header; flag off preserva comportamiento — `tenant-context.interceptor.spec.ts` extendido: el test pre-existente que esperaba que un JWT con `country_code=MX` cayera a `CO` (porque MX no era soportado) se corrigió para esperar `MX` (ahora sí soportado); se añadió un test nuevo con `country_code=PE` (no soportado) para cubrir el caso de fallback que el test anterior cubría antes; se añadió un test de selección explícita de `MX` vía `TenantContextService.setCountry()`. Mismo ajuste en `tenant-context.service.spec.ts` (`setCountry('MX')` ahora fija `MX` en vez de caer a `CO`). Suite completa: 43/43 tests en `shared-http`, 65/65 en `loan-domain`.
