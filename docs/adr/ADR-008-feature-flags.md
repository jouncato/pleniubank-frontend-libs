# ADR-008: Feature Flags para Customer Portal Epic

## Estado

Aceptado.

## Contexto

Las olas del Customer Portal activan capacidades que dependen de contratos backend con ritmos distintos, especialmente `switch-context`, amortización y catálogos multi-país. Un deploy del frontend no debe asumir que todos los servicios ya exponen el mismo shape ni que todas las rutas están listas en producción.

## Decisión

Mantener `APP_FEATURE_FLAGS` como API frontend estable y resolver flags en dos capas:

- Flags estáticos desde `environment.ts`, usados como allow-list por build/despliegue.
- Flags dinámicos por adaptador de servicio cuando la capacidad depende del backend.

Para Identity, `switchContext` queda habilitado solo si el flag estático está activo y `GET /api/v1/health` devuelve `checks.delegated_subject = on`. Si el health falla, el flag dinámico queda apagado.

Los componentes y rutas deben consultar `FeatureFlagService`, no leer `environment` directamente.

## Consecuencias

- Una capacidad crítica puede apagarse sin revert inmediato cuando el frontend ya fue desplegado.
- Cada servicio puede evolucionar su health mientras exista un adaptador frontend explícito.
- Un fallo de health degrada a OFF para evitar mostrar UI que derive en `501` o flujos incompletos.

## Métricas mínimas

- `cp.auth.switch_context.success`
- `cp.auth.switch_context.error` con `error_code` y `http_status`, sin PII.
- Error rate por ruta y correlación HTTP ya capturada por los interceptores compartidos.
