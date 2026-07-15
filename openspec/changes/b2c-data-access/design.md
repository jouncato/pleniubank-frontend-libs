# Design: b2c-data-access

## Context

Las libs siguen un patrón estable: servicios `@Injectable` por dominio en `*-data-access` usando `HttpClient` (con interceptores de tenant/correlación/auth registrados por la app), modelos en `*-domain`, y errores normalizados por `shared-http` (api-envelope + error mapper). Este cambio solo añade piezas siguiendo ese patrón; los contratos los definen los cambios paralelos de core e identity.

## Goals / Non-Goals

**Goals:**
- Cobertura tipada 1:1 de los contratos nuevos de core e identity.
- `design-tokens` como fuente única real (hoy placeholder).
- Cero breaking changes en servicios existentes.

**Non-Goals:**
- Componentes UI nuevos (viven en el portal hasta estabilizarse).
- Cambios en `paymenthub-data-access` (el flujo persona deja de depender del hub).
- Migración de consumidores enterprise a los tokens (solo área personal en esta fase).

## Decisions

1. **Un servicio por agregado backend** (`CoreTransfersApiService`, `CoreNotificationsApiService`, `IdentityProfileApiService` + `IdentitySessionsApiService`) en lugar de engordar servicios existentes: mantiene la convención de la lib (33 servicios pequeños) y facilita tree-shaking.
2. **Errores tipados centralizados en `shared-http`**: los códigos nuevos se añaden al mapa de errores común para que portal y futuros consumidores reciban la misma semántica; los servicios no capturan errores por su cuenta.
3. **Export de statements como `{ blob, filename }`** parseando `Content-Disposition` en la lib (no en cada consumidor).
4. **Tokens en dos artefactos, con `tokens.css` como fuente de verdad** (no una definición TS→CSS como se planteó inicialmente): la implementación encontró que `tokens.css`/`tokens.scss` YA EXISTÍAN como el catálogo real de producción (épica X-03), importado directamente por `customer-portal` y `backoffice-portal` — el "placeholder de 16 líneas" de la auditoría original era solo `design-tokens.ts` (un componente Angular boilerplate sin uso), no el catálogo de tokens. Se corrige el enfoque: `tokens.ts` se deriva y mantiene 1:1 con `tokens.css` (mismo valor literal por variable), verificado por `tokens.spec.ts`. Alternativa descartada: generar `tokens.css` desde TS en build — habría requerido reescribir el mecanismo de consumo ya vigente en dos apps productivas sin necesidad.
5. **Compatibilidad de statements**: los métodos staff existentes de `CoreStatementsApiService` no cambian de firma; los customer-scoped son métodos nuevos.

## Risks / Trade-offs

- [Contratos backend aún en QA pueden cambiar] → los modelos se validan contra los OpenAPI de core/identity en el PR de integración; hasta entonces se desarrollan contra mock-services.
- [Duplicación temporal de tokens durante la migración] → la guía de migración del README y la tarea de limpieza en el portal (cambio paralelo) acotan la ventana.
- [Parsear Content-Disposition varía entre navegadores/proxies] → fallback a nombre generado en cliente (`extracto_<account>_<período>.<ext>`).

## Migration Plan

1. Publicar tokens (fase 0 del portal depende de ellos).
2. Añadir servicios/modelos por agregado a medida que cada contrato entra en QA.
3. Sin rollback especial: cambios aditivos versionados con la lib.

## Open Questions

- ¿Los tokens por país (multitenancy-2 / marca por tenant) se resuelven en la capa semántica de tokens o por theming del portal? Se pospone a la fase de subdominios (ADR-017).
