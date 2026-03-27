# PleniuBank Frontend Libraries

Monorepo de librerías Angular compartidas para los portales de PleniuBank.

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

## Desarrollo

```bash
npm install
npm run build:all
npm run test:all
```

## Orden de build

Las librerías se compilan en orden topológico de dependencias:

1. `design-tokens`, `ui`, `shared-http`, `core-domain` (sin deps internas)
2. `shared-auth` (depende de shared-http)
3. `identity-domain` (depende de shared-http, shared-auth)
4. `identity-data-access` (depende de shared-http, identity-domain)
5. `identity-feature-auth`, `identity-feature-enterprise` (dependen de varias)
6. `core-data-access` (depende de shared-http, core-domain)

## Publicación

Se publica automáticamente a GitHub Packages al crear un tag `libs-v*`:

```bash
git tag libs-v1.0.0
git push origin libs-v1.0.0
```
