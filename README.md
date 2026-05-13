# PleniuBank Frontend Libraries

Monorepo de librerías Angular compartidas para los portales de PleniuBank.

> **Nota**: Este proyecto es una librería Angular, no una aplicación. No requiere Docker ni contenerización. Las librerías se publican a GitHub Packages y se consumen desde los portales.

> **README estándar PleniuBank v1.0** (variante librería) — referencia: [`docs-proyecto-plenibank/templates/README.template.md`](../docs-proyecto-plenibank/templates/README.template.md).
> Secciones aplicables: 1) Stack/paquetes · 2) Variables (`NODE_AUTH_TOKEN` para `pnpm publish` y consumo desde portales) · 3) Quickstart local (`pnpm install --frozen-lockfile && pnpm run build:all && pnpm run test:all`) · 5) Build/Publish (GitHub Packages vía workflow `publish.yml` en tag `libs-v*`). N/A: §4 Docker, §6 VM edge, §7 K8s, §8 Migraciones, §9 Troubleshooting de runtime de servicio.
> Versionado: tag semver `libs-v<MAJOR.MINOR.PATCH>`; los portales referencian con `^<version>` en `package.json`.

## Paquetes

| Paquete | Descripción |
|---------|-------------|
| `@pleniu/design-tokens` | CSS custom properties, tipografía, paleta |
| `@pleniu/ui` | Componentes de marca (Logo, SkipLink, BreakpointObserver) |
| `@pleniu/shared-http` | ApiEnvelope, interceptores, error mapper |
| `@pleniu/shared-auth` | SessionStore, guards, interceptores Bearer/refresh |
| `@pleniu/identity-domain` | DTOs de Identity (Register, Login, Validate, Enterprise) |
| `@pleniu/identity-data-access` | API services de Identity |
| `@pleniu/identity-feature-auth` | Componentes de auth (Login, Register, OTP, Security) |
| `@pleniu/identity-feature-enterprise` | Componentes enterprise (KYB, Invite, SwitchContext) |
| `@pleniu/core-domain` | Modelos de Account, Loan, Product, Posting, Contract |
| `@pleniu/core-data-access` | API services de Core Banking |
| `@pleniu/loan-domain` | Tipos BIAN de Lending (enums, VOs, types) |
| `@pleniu/loan-data-access` | API services BIAN de Lending Arrangements |
| `@pleniu/loan-ui-kit` | Componentes Angular reutilizables de Lending (badges, tabla cuotas, timeline) |

## Documentación del SDK

- [docs/SDK_OVERVIEW.md](./docs/SDK_OVERVIEW.md) — mapa de paquetes y scripts
- [docs/SECURITY_CONTRACT.md](./docs/SECURITY_CONTRACT.md) — tokens, guards, PII
- [docs/CHANGELOG.md](./docs/CHANGELOG.md) — notas de versión (manual)
- [docs/migration/libranza-to-lending-arrangement.md](./docs/migration/libranza-to-lending-arrangement.md) — **⚠️ Migration guide**: de servicios legacy (CoreLoansApiService, payrollProviderGuard) a `@pleniu/loan-data-access`

## Prerrequisitos

### Entornos: Linux, Windows y WSL

Los comandos `pnpm` son los mismos en **Linux**, **macOS**, **WSL** y **Windows** (PowerShell o `cmd`). La diferencia habitual sigue siendo el **`.npmrc` con el token** de GitHub Packages: en Linux/macOS suele vivir en `~/.npmrc`; en Windows también puedes usar `%USERPROFILE%\.npmrc` o el `.npmrc` del proyecto. En PowerShell, para definir un token solo en la sesión: `$env:NPM_TOKEN = "..."` (si tus scripts lo consumen).

- Node.js 20+ (recomendado 22)
- corepack habilitado
- pnpm 10+
- Acceso a GitHub Packages para scope `@pleniu` (configurado en `.npmrc`)

Si es la primera vez, configurar token de GitHub Packages:

```bash
# En ~/.npmrc (global) o en el .npmrc del proyecto
//npm.pkg.github.com/:_authToken=<GITHUB_TOKEN>
```

## Desarrollo

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm run build:all          # Compila todas las librerias en orden topologico
pnpm run test:all           # Ejecuta tests de todas las librerias
pnpm run verify             # build:all + test:all
```

### Compilar una libreria especifica (con sus dependencias)

```bash
pnpm run build:identity-feature-auth    # Compila cadena de deps para auth feature
```

## Orden de build

Las librerías se compilan en orden topológico de dependencias:

1. `design-tokens`, `ui`, `shared-http`, `core-domain` (sin deps internas)
2. `shared-auth` (depende de shared-http)
3. `identity-domain` (depende de shared-http, shared-auth)
4. `identity-data-access` (depende de shared-http, identity-domain)
5. `identity-feature-auth`, `identity-feature-enterprise` (dependen de varias)
6. `core-data-access` (depende de shared-http, core-domain)

## Publicacion

Se publica automaticamente a GitHub Packages al crear un tag `libs-v*`:

```bash
corepack enable
git tag libs-v1.0.0
git push origin libs-v1.0.0
```

## Librerias adicionales

| Paquete | Descripcion |
|---------|-------------|
| `@pleniu/shared-observability` | Sentry integration, error tracking |
| `@pleniu/paymenthub-domain` | DTOs de PaymentHub |
| `@pleniu/paymenthub-data-access` | API services de PaymentHub |

## Uso en portales

Los portales (`public-portal`, `customer-portal`, `backoffice-portal`) consumen estas librerias via `file:` references en desarrollo local. El `tsconfig.json` de cada portal define path aliases `@pleniu/*` que apuntan a los `dist/` compilados de este monorepo.

Para desarrollo local de portales, compilar primero las librerias:

```bash
cd pleniubank-frontend-libs
pnpm install --frozen-lockfile
pnpm run build:all
```

---

## Despliegue de contenedor: build local, Artifact Registry, permisos en GCP y docker-compose (solo pull)

Este repositorio es un **monorepo de librerías Angular** (`@pleniu/*`): **no genera una imagen Docker de producción** propia. Las imágenes que se publican en Google Artifact Registry son las de los **portales** y **microservicios** que consumen estas libs en tiempo de build.

### 1. Crear imágenes en local

No aplica un único `docker build` aquí. Para obtener una imagen publicable:

1. Compila las libs si el portal las consume por `file:` local: `pnpm install --frozen-lockfile && pnpm run build:all` en este repo.
2. Construye la imagen del **portal** correspondiente desde su repositorio (`pleniubank-customer-portal`, `pleniubank-backoffice-portal`, `pleniubank-public-portal`) siguiendo su README (PAT + `--secret id=github_token`).

### 2. Subir a Google Artifact Registry

El `docker push` se hace desde el repo del **portal** o del **backend** hacia `us-central1-docker.pkg.dev/pleniu-system-dev/plenu-core-repo/<nombre-servicio>:<tag>`. Ver README de ese servicio.

### 3. Permitir que otros servidores en Google Cloud descarguen la imagen

Las imágenes que incluyen el resultado del build de `@pleniu/*` son las de los portales. A la cuenta de servicio del servidor que haga `docker compose pull`, otorga **`roles/artifactregistry.reader`** sobre el proyecto/registry donde está `plenu-core-repo` (misma tabla que en los README de Core o portales).

### 4. Despliegue remoto: solo pull + `up` (sin build)

En el servidor solo se usan imágenes ya publicadas; el `docker-compose.yml` referencia `image: …/pleniubank-customer-portal:latest` (u otro servicio), **sin** `build:`.

```bash
docker compose pull
docker compose up -d
docker compose up -d --pull always --no-build
```

Plantillas: [`../pleniubank-infra-platform/gcp-deploy-docker/`](../pleniubank-infra-platform/gcp-deploy-docker/README.md).
