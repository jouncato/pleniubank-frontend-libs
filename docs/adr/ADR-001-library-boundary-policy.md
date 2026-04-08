# ADR-001: Política de Fronteras de Librería: Shared vs Portal-Specific

**Fecha:** 2026-04-08
**Estado:** Aceptado
**Personas:** Equipo Frontend PleniuBank

---

## Contexto

PleniuBank tiene tres portales Angular (`backoffice-portal`, `customer-portal`, `public-portal`) que inevitablemente comparten conceptos de dominio, infraestructura HTTP y lógica de autenticación. Sin una política explícita sobre qué código va en las librerías compartidas y qué permanece en cada portal, el equipo toma decisiones inconsistentes: el mismo guard se implementa tres veces, o un ViewModel de página específica acaba en una librería compartida que no le corresponde.

## Decisión

**Regla principal:** si dos o más portales necesitan la misma lógica, va a `pleniubank-frontend-libs`. Si es específico de un portal, se queda en ese portal.

**Clasificación concreta:**

| Tipo de código | Destino | Justificación |
|---|---|---|
| Guards de autenticación/autorización | `shared-auth` | Todos los portales los usan |
| Interceptors HTTP (auth, CSRF, correlación, error) | `shared-http` | Cross-cutting concern universal |
| DTOs de dominio (Identity, Core, PaymentHub) | `*-domain` libs | Modelo compartido entre portales |
| Servicios de acceso a API | `*-data-access` libs | Mismos endpoints consumidos por múltiples portales |
| Componentes UI reutilizables (Logo, Breadcrumb) | `ui` | Identidad visual uniforme |
| Design tokens (colores, espaciado, tipografía) | `design-tokens` | Una sola fuente de verdad visual |
| ViewModels de páginas | En cada portal | Lógica de presentación específica por contexto |
| Componentes de página (AdminDashboard, OnboardingForm) | En cada portal | Flujos únicos por portal |
| Rutas de la aplicación | En cada portal | Estructura de navegación distinta |

## Justificación

- **Opción Seleccionada:** Regla del "dos o más portales"
  - ✅ Claridad: no hay ambigüedad en la decisión para código nuevo
  - ✅ Un fix de seguridad en `authGuard` se aplica a los tres portales automáticamente
  - ✅ Evita duplicar DTOs, lo que generaría inconsistencias de tipos entre portales
  - ✅ Permite que los portales sean independientes en su navegación y presentación
  - ⚠️ Requiere disciplina: la tendencia natural es añadir código "por si acaso" en libs compartidas

- **Opciones Rechazadas:**
  - **Todo en libs:** Librerías con lógica de presentación específica generan acoplamiento innecesario
  - **Nada en libs (copiar código):** Divergencia garantizada — bugs en un portal que no se corrigen en los otros
  - **Decidir caso a caso sin regla:** Inconsistencia, debate repetitivo en code reviews

## Consecuencias

### Positivas
- Los 9 guards de `shared-auth` son la única fuente de verdad para autenticación y autorización en la plataforma
- Los DTOs de `identity-domain` y `core-domain` garantizan consistencia de tipos entre portales
- Los portales son delgados: su código es específico de su flujo, no infraestructura

### Negativas / Riesgos Mitigados
- **Riesgo:** Librerías crecen sin control con código "genérico" poco usado
  - **Mitigación:** Code review explícito cuando se añade a libs — exigir que el caso de uso en al menos dos portales esté documentado

### Impacto en Futuras Decisiones
- Cualquier nueva feature que aparezca en dos portales debe extraerse a `pleniubank-frontend-libs` antes de que diverja
- Los nuevos portales heredan automáticamente toda la infraestructura compartida sin copiar código

## Referencias Técnicas
- `pleniubank-frontend-libs/libs/` — estructura de 13 librerías
- `pleniubank-backoffice-portal/package.json` — dependencias `file:` declaradas

## Archivos Afectados

| Ruta | Tipo de Cambio |
|------|---------------|
| `libs/shared-auth/src/` | Guards, interceptors de auth, SessionStore |
| `libs/shared-http/src/` | Interceptors HTTP, WebSocket, error reporting |
| `libs/*/src/public-api.ts` | Barrel exports de cada librería |
