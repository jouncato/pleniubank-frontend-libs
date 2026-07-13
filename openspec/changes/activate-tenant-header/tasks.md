## 1. Soporte multi-país (LB-ST-219 libs)

- [ ] 1.1 Ampliar `SUPPORTED_TENANTS` a `['CO','MX']` en `libs/shared-http/src/lib/tenant-country.types.ts`
- [ ] 1.2 Mantener `DEFAULT_TENANT='CO'` y `isSupportedTenant()`

## 2. Interceptor

- [ ] 2.1 Consolidar resolución `service → claim JWT country_code → default` en `tenant-context.interceptor.ts`
- [ ] 2.2 Exponer config `TENANT_HEADER_ENABLED` y token de URLs excluidas para los portales
- [ ] 2.3 Verificar `Jurisdiction` VO (`loan-domain`) sin cambios de contrato

## 3. Tests

- [ ] 3.1 Unit: `isSupportedTenant` CO/MX; rechazo de no soportado
- [ ] 3.2 Interceptor: header presente/correcto por país; URL excluida sin header; flag off preserva comportamiento
