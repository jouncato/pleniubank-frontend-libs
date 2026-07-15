# DesignTokens

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.0.

### Linux, Windows y WSL

Los comandos `ng` y `npm` son los mismos en **Linux**, **macOS**, **WSL** y **Windows** (PowerShell). Para rutas, token de GitHub Packages y scripts del monorepo, sigue el [README raíz](../../README.md).

## CSS tokens (épica X-03)

- Archivo fuente: [`src/lib/tokens.css`](./src/lib/tokens.css) — variables `--pb-*` (colores, tipografía, espaciado, radios, sombras, breakpoints) + alias legacy `--pleniu-*`.
- Constantes TypeScript: [`src/lib/tokens.ts`](./src/lib/tokens.ts) — mismo catálogo, para lógica TS donde `var(--pb-*)` no basta (canvas, cálculo de contraste, export a PDF). `tokens.css` es la fuente de verdad; `tokens.spec.ts` compara cada valor contra un snapshot literal (`tokens.css-snapshot.ts`) mantenido a mano junto al CSS real — el bundler de `ng test` no permite leer archivos en runtime, así que si editas `tokens.css` debes actualizar también el snapshot y `tokens.ts` (los tres deben avanzar juntos).
- Carga en apps: `@import '@pleniu/design-tokens/src/lib/tokens.css';` desde `styles.scss` de **customer-portal** y **backoffice-portal** (ruta relativa al paquete `design-tokens`; también `form-field-labels.css` para PrimeNG).
- Fuentes corporativas: `Inter` vía Google Fonts (`@import url(...)` en `styles.scss` del consumidor) + stack `system-ui` de respaldo.

### Inventario de tokens

| Categoría | Variables CSS | Constante TS |
|---|---|---|
| Marca (base) | `--pb-color-primary`, `-primary-dark`, `-primary-light`, `-blue-600`, `-accent-{lime,cyan,orange,amber,red,green,teal}` | `TOKENS.color.*` |
| Neutros (base) | `--pb-gray-{50..900}`, `--pb-white` | `TOKENS.gray.*`, `TOKENS.color.white` |
| Estado (base) | `--pb-status-{ok,warn,error,info,neutral}` | `TOKENS.status.*` |
| Tipografía (base) | `--pb-font-family`, `-font-size-{body,sm,xs,h1,h2}`, `-font-weight-*`, `-line-height` | `TOKENS.typography.*` |
| Espaciado/radios/elevación (base) | `--pb-space-{4..24}`, `-radius`, `-radius-sm`, `-shadow`, `-shadow-md`, `-sidebar-width`, `-topbar-height` | `TOKENS.spacing.*`, `TOKENS.radius.*`, `TOKENS.shadow.*` |
| Breakpoints (base) | `--pb-break-{xs,sm,md}` | `TOKENS.breakpoint.*` |
| Semántico (alias sobre base) | `--pb-surface`, `-surface-alt`, `-text`, `-text-muted`, `-border`, `-danger`, `-success`, `-warning`, `-info` | `TOKENS.semantic.*` |
| Jerarquía de contenido (portales internos) | `--pb-content-{title,subtitle,body}`, `-border-table`, `-border-form` | *(solo CSS; sin equivalente TS aún)* |
| Tema oscuro (preparación) | `.theme-dark` / `prefers-color-scheme: dark` redefinen la capa semántica (`surface`, `text`, `border`, …) | *(solo CSS; ver `tokens.css` líneas finales)* |

`DESIGN_TOKENS_CSS_VARS` (mapa plano, clave = nombre de variable sin `--`) es la fuente cruda que alimenta `TOKENS`; úsalo si necesitas iterar el catálogo completo (p. ej. para una página de documentación de tokens).

### Equivalencias con el mockup `b2c-mobile-first`

El mockup `docs-proyecto-plenibank/b2c-mobile-first` (Figma, "Fase 2 — Cliente B2C") referencia una paleta propia:

| Mockup | Token actual | Nota |
|---|---|---|
| `--color-primary: #01305d` (navy) | `--pb-color-primary: #0272de` (azul) | **Discrepancia sin resolver.** El token de producción ya está en uso en customer-portal y backoffice-portal (épica X-03); adoptar el navy del mockup es un cambio de marca, no solo de shell móvil. Requiere decisión de diseño antes de aplicarse — no se sobreescribe unilateralmente aquí. |
| Acento lima | `--pb-color-accent-lime: #cad215` | Coincide conceptualmente; sin cambios. |
| Tipografía Inter | `--pb-font-family` (Inter primero) | Ya alineado. |

Mientras no se resuelva la discrepancia de color primario, el shell móvil B2C (`pleniubank-customer-portal`, cambio `b2c-persona-ui-closure`) debe consumir `--pb-color-primary` (token vigente), no el valor literal del mockup.

### Guía de migración desde variables ad-hoc

Si tu componente define variables locales que deberían venir de este catálogo, reemplázalas así:

| Variable ad-hoc encontrada en el portal | Sustituir por |
|---|---|
| Colores hex hardcodeados en `.scss` de features (`#0272de`, `#111827`, etc.) | `var(--pb-color-primary)`, `var(--pb-gray-900)`, … según corresponda |
| `--color-*` locales definidos en un componente | El token semántico equivalente en `tokens.css` (`--pb-text`, `--pb-surface`, …); si no existe, proponer su alta aquí antes de crear uno nuevo por componente |
| Espaciados mágicos (`8px`, `16px`, `24px`) | `var(--pb-space-8)`, `var(--pb-space-16)`, `var(--pb-space-24)` |
| Breakpoints hardcodeados (`768px`, `1024px`) en media queries | `var(--pb-break-sm)` / `var(--pb-break-md)` (nota: no usables directamente dentro de `@media (...)` en CSS puro — usar la constante TS `TOKENS.breakpoint.*` con `breakpoint-observer` de `libs/ui`, o el valor SCSS `$pb-break-*` de `tokens.scss` en un preprocesador) |
| Alias legacy `--pleniu-*` | Migrar a su equivalente `--pb-*` (los `--pleniu-*` se mantienen solo por compatibilidad, no añadir usos nuevos) |

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the library, run:

```bash
ng build design-tokens
```

This command will compile your project, and the build artifacts will be placed in the `dist/` directory.

### Publishing the Library

Once the project is built, you can publish your library by following these steps:

1. Navigate to the `dist` directory:

   ```bash
   cd dist/design-tokens
   ```

2. Run the `npm publish` command to publish your library to the npm registry:
   ```bash
   npm publish
   ```

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
