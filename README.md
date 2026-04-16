# PleniuBank Frontend Libraries

Monorepo de librerías Angular compartidas para los portales de PleniuBank.

> **Nota**: Este proyecto es una librería Angular, no una aplicación. No requiere Docker ni contenerización. Las librerías se publican a GitHub Packages y se consumen desde los portales.

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

## Documentación del SDK

- [docs/SDK_OVERVIEW.md](./docs/SDK_OVERVIEW.md) — mapa de paquetes y scripts
- [docs/SECURITY_CONTRACT.md](./docs/SECURITY_CONTRACT.md) — tokens, guards, PII
- [docs/CHANGELOG.md](./docs/CHANGELOG.md) — notas de versión (manual)

## Prerrequisitos

- Node.js 20+ (recomendado 22)
- npm 11+
- Acceso a GitHub Packages para scope `@pleniu` (configurado en `.npmrc`)

Si es la primera vez, configurar token de GitHub Packages:

```bash
# En ~/.npmrc (global) o en el .npmrc del proyecto
//npm.pkg.github.com/:_authToken=<GITHUB_TOKEN>
```

## Desarrollo

```bash
npm install
npm run build:all          # Compila todas las librerias en orden topologico
npm run test:all           # Ejecuta tests de todas las librerias
npm run verify             # build:all + test:all
```

### Compilar una libreria especifica (con sus dependencias)

```bash
npm run build:identity-feature-auth    # Compila cadena de deps para auth feature
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
npm install
npm run build:all
```
