# design-tokens-foundation — Tokens de diseño como fuente única

Propósito: la lib `design-tokens` tiene 16 líneas y los tokens reales viven dispersos como variables CSS ad-hoc en portal y libs; el mockup b2c-mobile-first define un sistema visual que aún no está codificado.

## ADDED Requirements

### Requirement: Catálogo de tokens
`design-tokens` SHALL definir el catálogo completo del producto: colores (primario, acento, semánticos de estado, superficies), tipografía (familia, escala, pesos), espaciado, radios, elevaciones y breakpoints, alineado con el mockup b2c-mobile-first, exportado como (a) variables CSS `--pb-*` en una hoja importable y (b) constantes TypeScript tipadas.

#### Scenario: Doble exportación
- **WHEN** un consumidor importa la lib
- **THEN** puede usar `var(--pb-color-primary)` en CSS y `TOKENS.color.primary` en TS con el mismo valor

### Requirement: Tema claro como base y preparación para variantes
Los tokens SHALL organizarse en capas (base → semánticos) de modo que una variante futura (oscuro, marca por país) solo redefina la capa semántica, sin cambios en los consumidores.

#### Scenario: Redefinición semántica
- **WHEN** se define una variante que cambia `--pb-color-surface`
- **THEN** los componentes que consumen el token semántico reflejan la variante sin ediciones

### Requirement: Documentación de uso
La lib SHALL incluir README con inventario de tokens, equivalencias con los valores del mockup (`--color-primary #01305d`, acento lima, Inter) y guía de migración desde las variables ad-hoc existentes (`--pb-*`/`--color-*` dispersas).

#### Scenario: Guía de migración
- **WHEN** un desarrollador migra un componente
- **THEN** el README indica el token que sustituye a cada variable ad-hoc conocida
