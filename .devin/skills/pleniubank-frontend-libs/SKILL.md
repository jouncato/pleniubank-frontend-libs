---
name: pleniubank-frontend-libs
description: Mapa de ORIENTACIÓN de pleniubank-frontend-libs — monorepo de librerías Angular compartidas (@pleniu/*) consumidas por los portales, publicado a GitHub Packages, sin Docker ni servidor propio. TRIGGER al editar cualquier paquete `@pleniu/*` o al investigar de dónde viene una dependencia usada por backoffice-portal o customer-portal. NO USAR para código específico de un portal consumidor (usar la skill de ese portal) — este repo es solo la librería compartida.
---

# PleniuBank Frontend Libraries

## Qué es este repo

- Monorepo de librerías **Angular** compartidas — no es una aplicación, no requiere Docker ni contenerización.
- Se publican a **GitHub Packages** y se consumen desde los portales vía `package.json` (normalmente como dependencias `file:../pleniubank-frontend-libs/libs/...` en desarrollo, o versión publicada en CI).

## Paquetes (verificados en README)

`@pleniu/design-tokens`, `@pleniu/ui`, `@pleniu/shared-http`, `@pleniu/shared-auth`, `@pleniu/identity-domain`, `@pleniu/identity-data-access`, `@pleniu/identity-feature-auth`, `@pleniu/identity-feature-enterprise`, `@pleniu/core-domain`, `@pleniu/core-data-access`, `@pleniu/loan-domain`, `@pleniu/loan-data-access`, `@pleniu/loan-ui-kit`.

## Prerrequisitos y comandos

- Node.js 20+ (recomendado 22), corepack habilitado, **pnpm 10+**.
- Acceso a GitHub Packages para el scope `@pleniu` (token en `.npmrc`, variable `NODE_AUTH_TOKEN` para publish).

```bash
pnpm install --frozen-lockfile
pnpm run build:all
pnpm run test:all
```

Publicación: workflow `publish.yml` en tag `libs-v*` (versionado semver `libs-v<MAJOR.MINOR.PATCH>`; los portales referencian con `^<version>` en `package.json`).

## Documentación del SDK

- [docs/SDK_OVERVIEW.md](../docs/SDK_OVERVIEW.md) — mapa de paquetes y scripts.
- [docs/SECURITY_CONTRACT.md](../docs/SECURITY_CONTRACT.md) — tokens, guards, PII.
- [docs/migration/libranza-to-lending-arrangement.md](../docs/migration/libranza-to-lending-arrangement.md) — guía de migración de servicios legacy.

## Anti-patrones

- Buscar un `docker-compose.yml` o puerto propio aquí — no aplica (librería, no servicio).
- Modificar un paquete `@pleniu/*` sin correr `pnpm run build:all` y `test:all` antes de que un portal lo consuma.
- Asumir versión de un paquete sin verificar el tag `libs-v*` real o el `package.json` del portal consumidor.

## Anti-alucinación / Contexto verificado

> **NO inventar.** Antes de asumir rutas, nombres de archivo, versiones de paquetes o scripts, verificar en:
> - El código fuente real de este repo.
> - `package.json` de la raíz y de cada `libs/<paquete>/`.
> - `docs-proyecto-plenibank/templates/README.template.md` (variante librería, referenciada en el propio README).
>
> Si no está verificado, pedir aclaración. No propagar suposiciones a otros repos.
>
> **Si no está verificado, la respuesta es literalmente "No lo sé — no está verificado en este repositorio"** (no completar con conocimiento general de banca ni con valores de otro repo). Si dos fuentes reales se contradicen entre sí, no elegir en silencio: reportar la contradicción citando ambos archivos.
