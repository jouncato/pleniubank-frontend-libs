# SDK PleniuBank — visión general (`pleniubank-frontend-libs`)

Monorepo de librerías Angular publicadas bajo el scope **`@pleniu/*`**. Los portales (`pleniubank-public-portal`, `pleniubank-customer-portal`, `pleniubank-backoffice-portal`) consumen estos paquetes vía npm (GitHub Packages u otro registry interno).

## Paquetes

| Paquete | Responsabilidad |
|---------|-----------------|
| `@pleniu/design-tokens` | Tokens de diseño |
| `@pleniu/ui` | Componentes UI compartidos |
| `@pleniu/shared-http` | Utilidades HTTP comunes |
| `@pleniu/shared-auth` | Sesión, guards, interceptores JWT/refresh/CSRF |
| `@pleniu/identity-domain` | Modelos de dominio Identity |
| `@pleniu/identity-data-access` | Clientes/servicios hacia API Identity |
| `@pleniu/identity-feature-auth` | UI IAM (login, registro, OTP, shell) |
| `@pleniu/identity-feature-enterprise` | UI enterprise (KYB, invites, etc.) |
| `@pleniu/core-domain` | Modelos de dominio Core |
| `@pleniu/core-data-access` | Clientes hacia API Core |

## Scripts útiles

```bash
npm install
npm run build:all      # construye todas las libs en orden
npm run test:all       # tests unitarios de cada proyecto
npm run verify         # build + test:all
```

## Versionado

Cada `libs/*/package.json` define la versión del artefacto publicado. Los portales deben fijar rangos compatibles con peerDependencies (`@angular/*` ^21.x).

## Documentación por portal

- Public: `pleniubank-public-portal/docs/README.md`
- Customer: `pleniubank-customer-portal/docs/README.md`
- Backoffice: `pleniubank-backoffice-portal/docs/README.md`

## Contrato de seguridad

Ver [SECURITY_CONTRACT.md](./SECURITY_CONTRACT.md).

## Changelog

Resumen orientativo en [CHANGELOG.md](./CHANGELOG.md).
