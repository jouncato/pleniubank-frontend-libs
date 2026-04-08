# ADRs — pleniubank-frontend-libs

> **Proyecto:** `pleniubank-frontend-libs`
> **Fecha de análisis:** 2026-04-08
> **Stack base:** Angular 21 · TypeScript 5.9 · SCSS
> **Total ADRs:** 6

Monorepo de librerías compartidas entre los tres portales Angular de PleniuBank (`backoffice-portal`, `customer-portal`, `public-portal`). Contiene 13 librerías organizadas en capas de dominio, datos y UI.

---

## Índice

| ID | Título | Dominio | Estado |
|---|---|---|---|
| [ADR-001](ADR-001-library-boundary-policy.md) | Política de Fronteras de Librería: Shared vs Portal-Specific | Arquitectura | Aceptado |
| [ADR-002](ADR-002-barrel-exports-public-api.md) | Barrel Exports vía `public-api.ts` como Contrato de Librería | Encapsulación | Aceptado |
| [ADR-003](ADR-003-local-file-versioning.md) | Versionamiento Local con `file:` Dependencies sin npm Registry | Distribución | Aceptado |
| [ADR-004](ADR-004-design-tokens-scss-variables.md) | Design Tokens como Variables SCSS (no CSS Custom Properties) | UI/Theming | Aceptado |
| [ADR-005](ADR-005-shared-guards-centralization.md) | Centralización de Guards de Autenticación/Autorización en `shared-auth` | Seguridad | Aceptado |
| [ADR-006](ADR-006-websocket-service-shared-infra.md) | `CoreWebSocketEventsService` como Infraestructura de Plataforma en `shared-http` | Infraestructura | Aceptado |

---

## Árbol de dependencias entre ADRs

```
ADR-001 (Boundary policy)
  └── ADR-002 (Barrel exports)
        └── ADR-003 (File versioning)
ADR-001 (Boundary policy)
  └── ADR-005 (Guards centralization)
  └── ADR-006 (WebSocket shared infra)
ADR-004 (SCSS tokens) — independiente
```

---

## Mapa de librerías

| Librería | Capa | Portales consumidores |
|---|---|---|
| `design-tokens` | UI | backoffice, customer, public |
| `ui` | UI | backoffice, customer, public |
| `shared-auth` | Auth / Seguridad | backoffice, customer, public |
| `shared-http` | HTTP / Infra | backoffice, customer, public |
| `shared-observability` | Observabilidad | backoffice, customer, public |
| `identity-domain` | Dominio | backoffice, customer, public |
| `identity-data-access` | Datos | backoffice, customer |
| `identity-feature-auth` | Feature | backoffice, customer, public |
| `identity-feature-enterprise` | Feature | backoffice, customer |
| `core-domain` | Dominio | backoffice, customer |
| `core-data-access` | Datos | backoffice, customer |
| `paymenthub-domain` | Dominio | customer |
| `paymenthub-data-access` | Datos | customer |

---

## Contexto funcional

`pleniubank-frontend-libs` no es una aplicación desplegable. Es el repositorio de código compartido que evita la duplicación entre portales. Cada librería tiene una responsabilidad única y se consume mediante path aliases TypeScript (`shared-auth`, `core-data-access`, etc.) configurados en el `tsconfig.json` de cada portal.
