# ADR-004: Design Tokens como Variables SCSS (no CSS Custom Properties)

**Fecha:** 2026-04-08
**Estado:** Aceptado
**Personas:** Equipo Frontend PleniuBank

---

## Contexto

Los tres portales de PleniuBank comparten la misma identidad visual: paleta de colores, escala tipográfica, valores de espaciado, radios de borde. Estos valores deben estar en una única fuente de verdad para que un cambio de marca se propague a todos los portales.

La decisión técnica es sobre el mecanismo de distribución de estos tokens: variables SCSS (procesadas en build time) o CSS Custom Properties (procesadas en runtime por el browser).

```scss
// Opción A: Variables SCSS (build time)
$pb-color-primary: #0272de;
$pb-space-16: 1rem;

.btn-primary { background-color: $pb-color-primary; }  // Se compila a: background-color: #0272de;

// Opción B: CSS Custom Properties (runtime)
:root { --pb-color-primary: #0272de; }
.btn-primary { background-color: var(--pb-color-primary); }  // Referencia en runtime
```

## Decisión

Se implementan los design tokens como **variables SCSS** (`$pb-color-primary`, `$pb-space-16`, etc.) en la librería `design-tokens`. Los portales importan el archivo SCSS en su configuración global de estilos. Los tokens se resuelven en tiempo de compilación — el CSS resultante contiene los valores directos, no referencias a variables CSS.

## Justificación

- **Opción Seleccionada:** Variables SCSS
  - ✅ Los tres portales son Angular SPA sin necesidad de theming dinámico en runtime (cambio de tema vía JS)
  - ✅ El CSS compilado es más pequeño — no hay `:root { --var: value }` en el output
  - ✅ Compatibilidad total con SCSS mixins y funciones (`darken($pb-color-primary, 10%)`)
  - ✅ Sin overhead de resolución CSS en runtime — valores ya están en el stylesheet compilado
  - ✅ Herramienta familiar para el equipo — toda la base de código existente usa SCSS variables
  - ⚠️ Sin capacidad de dark mode ni theming dinámico vía JavaScript

- **Opciones Rechazadas:**
  - **CSS Custom Properties (`--pb-color-primary`):** Necesarias para theming dinámico (dark mode toggle, multi-brand en runtime). Los tres portales actuales no tienen este requisito — añadiría complejidad innecesaria.
  - **Valores hardcodeados en cada componente:** Duplicación, impossible de actualizar de forma consistente.
  - **Design tokens via JSON + generación automática (Style Dictionary):** Overhead de tooling para un equipo pequeño sin el volumen de tokens que lo justifique.

## Consecuencias

### Positivas
- Un cambio en `$pb-color-primary` en `design-tokens` se propaga a los tres portales en el siguiente build
- Los estilos de componentes pueden usar los tokens en operaciones SCSS: `border: 1px solid lighten($pb-color-primary, 20%)`
- El CSS final no tiene dependencias de runtime — los portales pueden servirse como archivos estáticos puros

### Negativas / Riesgos Mitigados
- **Riesgo:** No hay soporte de dark mode con este enfoque sin un build separado
  - **Mitigación:** PleniuBank no tiene requisito de dark mode en el roadmap actual. Si se añade en el futuro, la migración implica convertir `$pb-color-*` a `--pb-color-*` en `design-tokens` y actualizar los componentes que los consumen.
- **Riesgo:** Cambiar un token requiere rebuild y redeploy de todos los portales
  - **Mitigación:** Los cambios de tokens son infrecuentes (decisiones de diseño estables) — el ciclo de CI/CD es el mecanismo correcto.

### Ruta de migración si se necesita theming dinámico
Si en el futuro se requiere dark mode o theming multi-brand en runtime:
1. Convertir `design-tokens` para exportar tanto variables SCSS como CSS Custom Properties
2. Los componentes migran gradualmente a usar `var(--pb-color-primary)` en lugar de `$pb-color-primary`
3. Angular CDK Theme o una directiva de tema aplica el `:root` override en runtime

## Referencias Técnicas
- `libs/design-tokens/src/` — archivos SCSS con las variables
- `pleniubank-backoffice-portal/src/styles.scss` — import global de los tokens

## Archivos Afectados

| Ruta | Tipo de Cambio |
|------|---------------|
| `libs/design-tokens/src/_colors.scss` | Variables de paleta de colores |
| `libs/design-tokens/src/_spacing.scss` | Escala de espaciado |
| `libs/design-tokens/src/_typography.scss` | Escala tipográfica |
| `libs/design-tokens/src/public-api.scss` | Barrel SCSS que exporta todos los tokens |
| `pleniubank-*/src/styles.scss` | Import de `design-tokens` en cada portal |
