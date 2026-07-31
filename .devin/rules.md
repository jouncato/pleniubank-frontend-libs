# Windsurf — pleniubank-frontend-libs

## Fuente de verdad

- [README.md](README.md)
- [package.json](package.json)
- [angular.json](angular.json)
- [pnpm-workspace.yaml](pnpm-workspace.yaml)
- `libs/<nombre>/src/public-api.ts` y `libs/<nombre>/package.json` por librería

## Identidad

- **Proyecto**: PleniuBank Frontend Libraries (monorepo de librerías Angular compartidas).
- **Rol**: frontend Angular / design system senior.
- **Código**: TypeScript/SCSS; documentación en español.

## Stack

- Angular **21.1+**
- pnpm **10.33.4**
- TypeScript **~5.9**
- NgRx Signals **21.1+**
- Sentry Angular/Browser **10.47+**
- ng-packagr **21.2+**
- Vitest **4.0+**

## Herramientas

- `pnpm install`
- `pnpm run build:all`
- `pnpm run test:all`
- `pnpm run build:all:prod`

## Topología de Puertos (Global Guardrail — INMUTABLE)

> Este proyecto NO es un servicio desplegable; NO tiene puerto propio.
> Depende de los puertos de los portales y backends que consume.
> Los puertos del ecosistema son inmutables. Fuente de verdad:
> `pleniubank-infra-platform/scripts/services.manifest.json`
> Skill completo: `pleniubank-infra-platform/.devin/skills/infra-port-topology-guardrail/skill.md`

- Customer Portal: 4200
- Backoffice Portal: 4205
- Core: 8000
- Identity Service: 8005
- Rules Engine: 8010
- PaymentHub: 8015
- Scoring: 8020
- AI Service: 8025
- CMS: 8030
- PostgreSQL: 5432
- Redis: 6379
- Kafka: 9092
- Prometheus: 9090 (exclusivo)
- Grafana: 3000

## Guardrails anti-alucinación

- No inventar librerías, exports, nombres de paquetes `@pleniu/*`, versiones o peer dependencies no declaradas.
- Verificar `angular.json`, `ng-package.json` de cada librería y `public-api.ts` antes de asumir exports.
- No cambiar puertos de servicios externos en este repo; la topología es inmutable.
- Si algo no está en el código, README o `package.json`, pedir aclaración al usuario.
- No asumir dependencias globales: cada librería define sus propias `peerDependencies` en `package.json`.
- No introducir frameworks no declarados.

## Sincronización

Actualizar este archivo cuando cambien `README.md`, `package.json`, `angular.json`, `pnpm-workspace.yaml` o la topología de servicios.

## Anti-alucinación / Contexto verificado

> **NO inventar.** Antes de asumir endpoints, puertos, variables de entorno, rutas, nombres de archivo, versiones de librerías o frameworks, verificar en:
> - El código fuente real de este repo.
> - `README.md`, `pyproject.toml`, `package.json`, `angular.json`, `docker-compose.yml`, `.env.example`.
> - `pleniubank-infra-platform/scripts/services.manifest.json` (topología de puertos).
> - ADRs y documentación de producto de este repo.
>
> Si no está verificado, pedir aclaración. No propagar suposiciones a otros repos.

## Jerarquía de negocio — regla invariante (ADR-016)

> **Fuente canónica**: `pleniubank-core/docs/adr/ADR-016-hierarchical-model-account-autonomy-vs-payroll-advance-restriction.md`

### Modelo jerárquico

```
Plataforma PleniuBank
  └── Empresa (registrada, con cuenta)
       └── Subempresa / Unidad de Negocio (opcional para cuenta, obligatoria para avance de nómina)
            └── Cliente Persona (empleado)
                 └── Avance de Nómina ✅ (solo si la cadena completa existe)
```

### Reglas invariantes

1. **Autonomía de cuenta**: Un cliente persona puede abrir una cuenta de manera independiente, sin estar vinculado a una estructura corporativa. Una empresa puede registrarse y crear su cuenta sin configurar subempresas ni unidades de negocio adicionales.

2. **Restricción de avance de nómina**: Un cliente persona **NUNCA** puede acceder a un avance de nómina si:
   - No pertenece a una **Unidad de Negocio** activa dentro de una empresa registrada en PleniuBank.
   - Ninguna **empresa registrada en la plataforma PleniuBank** le administra, controla o gestiona su nómina.

3. **Validación obligatoria**: Todo código nuevo o modificado que involucre avance de nómina debe verificar la cadena jerárquica completa: Empresa → Unidad de Negocio → Cliente Persona. Sin esta cadena, el acceso al producto está prohibido.

4. **Separación de conceptos**: Apertura de cuenta ≠ acceso a productos de crédito. La cuenta es un derecho autónomo; el avance de nómina requiere relación empleador-empleado verificable.

5. **No-conflicto con la flexibilidad jerárquica**: La restricción de avance de nómina no entra en conflicto con la flexibilidad del orden jerárquico. La jerarquía es **opcional para onboarding** y **obligatoria solo para crédito de nómina**. El sistema debe permitir:
   - **Onboarding individual**: Una persona solicita una cuenta sin depender de una estructura empresarial.
   - **Onboarding corporativo simplificado**: Una empresa se registra como cliente (o subempresa) sin requerir creación previa de subempresas o unidades de negocio.
