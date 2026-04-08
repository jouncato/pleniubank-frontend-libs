# ADR-003: Versionamiento Local con `file:` Dependencies sin npm Registry

**Fecha:** 2026-04-08
**Estado:** Aceptado
**Personas:** Equipo Frontend PleniuBank

---

## Contexto

Las librerías de `pleniubank-frontend-libs` deben ser consumidas por los tres portales. Existen varias estrategias para distribuir librerías de una organización:
1. Publicar en un npm registry (público o privado) con versiones semánticas
2. Usar un monorepo con herramientas como Nx o Turborepo que gestionan el workspace
3. Referenciar directamente desde el sistema de archivos con `file:` dependencies de npm
4. Copiar el código manualmente en cada portal

La decisión impacta el flujo de desarrollo, la velocidad de iteración y la complejidad operativa del CI/CD.

## Decisión

Las librerías se referencian mediante **`file:` dependencies** en el `package.json` de cada portal, combinado con **path aliases TypeScript** en `tsconfig.json` para que el compilador resuelva los imports directamente al código fuente.

```json
// package.json del portal
"dependencies": {
  "@pleniu/shared-auth":        "file:../pleniubank-frontend-libs/libs/shared-auth",
  "@pleniu/shared-http":        "file:../pleniubank-frontend-libs/libs/shared-http",
  "@pleniu/identity-domain":    "file:../pleniubank-frontend-libs/libs/identity-domain",
  "@pleniu/core-data-access":   "file:../pleniubank-frontend-libs/libs/core-data-access",
  "@pleniu/design-tokens":      "file:../pleniubank-frontend-libs/libs/design-tokens"
}

// tsconfig.json del portal
"paths": {
  "shared-auth":      ["../pleniubank-frontend-libs/libs/shared-auth/src/public-api.ts"],
  "shared-http":      ["../pleniubank-frontend-libs/libs/shared-http/src/public-api.ts"],
  "core-data-access": ["../pleniubank-frontend-libs/libs/core-data-access/src/public-api.ts"]
}
```

No existe un proceso de publicación ni números de versión semántica por librería. Los tres portales siempre usan `HEAD` de `pleniubank-frontend-libs`.

## Justificación

- **Opción Seleccionada:** `file:` dependencies + path aliases TypeScript
  - ✅ Feedback instantáneo: un cambio en `shared-auth` se refleja sin `npm install` gracias a los path aliases
  - ✅ Sin proceso de publicación — un push a `pleniubank-frontend-libs` es suficiente
  - ✅ Hot reload funciona correctamente: TypeScript resuelve al fuente, no a una copia compilada
  - ✅ Setup simple: solo requiere estructura de directorios compartida en el sistema de archivos del desarrollador
  - ⚠️ Todos los portales siempre usan la misma versión — no hay versiones independientes por portal

- **Opciones Rechazadas:**
  - **npm registry privado (Verdaccio, GitHub Packages):** Requiere pipeline de publicación, semver manual, proceso de release para cada cambio en libs. Overhead inaceptable para el ritmo de desarrollo actual.
  - **Nx Workspace:** Potente pero añade complejidad significativa de tooling (nx.json, project graph, affected commands). El proyecto no justifica ese overhead hoy.
  - **Turborepo:** Similar a Nx — bien para escala grande, sobre-engineered para el tamaño actual.
  - **Copiar código entre portales:** Divergencia garantizada. Un fix de seguridad aplicado en un portal no llega a los otros dos.

## Consecuencias

### Positivas
- El ciclo de desarrollo es: editar `pleniubank-frontend-libs` → guardar → los portales reflejan el cambio sin pasos intermedios
- Un cambio breaking en `shared-auth` se detecta instantáneamente al compilar cualquier portal
- CI/CD no requiere steps adicionales para "publicar" librerías

### Negativas / Riesgos Mitigados
- **Riesgo:** Un cambio breaking en una librería rompe los tres portales simultáneamente
  - **Mitigación:** Los tests de la librería (`ng test shared-auth`) deben pasar antes de mergear. CI valida los tres portales.
- **Riesgo:** Requiere que todos los portales estén co-localizados en el mismo sistema de archivos (misma máquina o mismo repo raíz)
  - **Mitigación:** La estructura de directorios está documentada y el `README.md` describe el setup inicial.

### Si el proyecto escala
Si el equipo crece a 10+ personas o se necesitan versiones independientes por portal, el camino de migración es:
1. Añadir Nx al workspace existente (`nx init`) — migración incremental
2. O configurar un npm registry privado con CI automatizado para publicar libs

## Referencias Técnicas
- `pleniubank-backoffice-portal/package.json` — dependencias `file:`
- `pleniubank-backoffice-portal/tsconfig.json` — path aliases
- `pleniubank-customer-portal/package.json` — misma estructura

## Archivos Afectados

| Ruta | Tipo de Cambio |
|------|---------------|
| `pleniubank-*/package.json` | Dependencias `file:` por cada librería consumida |
| `pleniubank-*/tsconfig.json` | Path aliases TypeScript hacia `public-api.ts` |
| `pleniubank-frontend-libs/libs/*/package.json` | Metadata de cada librería (nombre, peerDeps) |
