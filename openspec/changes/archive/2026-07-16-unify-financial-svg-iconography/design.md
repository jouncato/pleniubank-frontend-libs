# 1. Resumen Ejecutivo

## Context

La auditoría identifica cuatro implementaciones incompatibles en los frontends Angular: emojis y caracteres Unicode en el área B2C, SVG inline repartidos por templates, un mapa local de `path` SVG en el catálogo de backoffice y SVGs incrustados en componentes compartidos. No hay una librería genérica declarada en los `package.json`; la migración evita introducir una. Los portales customer y backoffice consumen `@pleniu/ui` y `@pleniu/design-tokens` mediante enlaces locales, por lo que estas bibliotecas son el punto de integración obligatorio.

La migración crea una iconografía financiera unificada, propiedad de Pleniu, que comunica seguridad, control, liquidez y operación corporativa con consistencia visual y accesible.

# 2. Lineamientos de Diseño Bancario

## Goals / Non-Goals

**Goals:**

- Entregar un catálogo de iconos financieros y corporativos con semántica bancaria explícita.
- Centralizar la representación en un componente Angular standalone exportado por `@pleniu/ui`.
- Preservar color dinámico con `currentColor`, soporte de tema/marca mediante tokens y compatibilidad con Customer Portal y Backoffice Portal.
- Eliminar progresivamente emojis decorativos, SVG inline no autorizados, mapas locales de rutas y cualquier icon font o librería genérica futura.
- Definir contratos verificables de SVG, accesibilidad y regresión visual.

**Non-Goals:**

- No rediseñar logotipos, ilustraciones de estados vacíos complejos ni identidad de marca.
- No incorporar Font Awesome, Material Icons, Heroicons, Lucide ni otra dependencia de iconos.
- No convertir iconos de terceros existentes: cada path del catálogo será propiedad del producto y revisado bajo el estándar definido.
- No cambiar la semántica funcional, rutas, permisos ni flujos transaccionales de los portales.

## Retícula, geometría y color

- Cada glifo SHALL usar `viewBox="0 0 24 24"`, coordenadas enteras o medias unidades cuando la simetría lo requiera y una caja óptica centrada.
- El estilo base SHALL ser outline: `fill="none"`, `stroke="currentColor"`, `stroke-width="1.8"`, `stroke-linecap="round"` y `stroke-linejoin="round"`.
- Un icono MAY usar relleno únicamente cuando sea imprescindible para legibilidad a 16 px; el relleno SHALL ser `currentColor` y no colores codificados.
- Los tamaños semánticos serán `xs=12`, `sm=16`, `md=20`, `lg=24`, `xl=32`, `2xl=40`, definidos como tokens `--pb-icon-size-*`; el grosor base será `--pb-icon-stroke-width: 1.8`.
- El color SHALL provenir del contenedor y tokens semánticos (`--pb-info`, `--pb-success`, `--pb-warning`, `--pb-danger`, `--pb-text-muted`), nunca de atributos hexadecimales dentro del SVG.
- Azul indica acción/información financiera; verde confirma liquidez, abono o estado correcto; ámbar comunica revisión o riesgo; rojo representa bloqueo, fraude, reverso o error. Ningún icono expresa estado solo mediante color.

# 3. Catálogo de Iconos Clave para Banca

Cada entrada se incorporará como path limpio en `@pleniu/ui`; los snippets siguientes son el contrato visual de referencia y no se copian como SVG inline en consumidores.

## `transfer`

```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4 7h13" />
  <path d="m14 3 4 4-4 4" />
  <path d="M20 17H7" />
  <path d="m10 13-4 4 4 4" />
</svg>
```

## `credit-card`

```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <rect x="3" y="5" width="18" height="14" rx="2.5" />
  <path d="M3 10h18" />
  <path d="M7 15h3" />
</svg>
```

## `loan`

```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4 18h16" />
  <path d="M6 18v-5.5a2.5 2.5 0 0 1 2.5-2.5h7A2.5 2.5 0 0 1 18 12.5V18" />
  <path d="M9 14h6" />
  <path d="M12 5v3" />
  <path d="m10.5 6.5 1.5-1.5 1.5 1.5" />
</svg>
```

## `investment-chart`

```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4 20V4" />
  <path d="M4 20h16" />
  <path d="m7 15 4-4 3 2 5-6" />
  <path d="M16 7h3v3" />
</svg>
```

## `security-lock`

```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <rect x="4" y="10" width="16" height="10" rx="2" />
  <path d="M8 10V7a4 4 0 1 1 8 0v3" />
  <path d="M12 14v2" />
</svg>
```

## `balance`

```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="8" />
  <path d="M14.5 9.5c-.5-1-1.5-1.5-2.5-1.5-1.4 0-2.5.9-2.5 2s1.1 2 2.5 2 2.5.9 2.5 2-1.1 2-2.5 2c-1 0-2-.5-2.5-1.5" />
  <path d="M12 6.5v11" />
</svg>
```

## `premium-profile`

```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="8" r="3.5" />
  <path d="M5 20a7 7 0 0 1 14 0" />
  <path d="m18.5 4 .65 1.35L20.5 6l-1.35.65L18.5 8l-.65-1.35L16.5 6l1.35-.65L18.5 4Z" />
</svg>
```

El catálogo inicial también SHALL contener: `account`, `statement`, `interest-rate`, `atm`, `biometric`, `beneficiary`, `deposit`, `withdrawal`, `payment`, `reconciliation`, `fraud-alert`, `shield-check`, `bank`, `payroll`, `wallet`, `receipt`, `search`, `filter`, `chevron-left`, `chevron-right`, `close`, `check`, `warning`, `info`, `refresh` y `more`.

# 4. Arquitectura de Componentes Frontend

## Decisions

### Biblioteca de origen: `@pleniu/ui`

El catálogo y `PbIconComponent` residirán en `libs/ui`, no en cada portal ni en `design-tokens`. `@pleniu/ui` ya es la biblioteca de componentes visuales compartidos y está enlazada por ambos consumidores. `design-tokens` conservará exclusivamente los tokens CSS/TS de tamaño, stroke y semántica de color.

**Alternativas descartadas:**

- Un paquete NPM genérico: contradice la propiedad intelectual y el lenguaje financiero específico.
- Archivos SVG cargados vía HTTP: añade peticiones, complica CSP y dificulta tipado/tree-shaking.
- `MatIconRegistry`: acopla el sistema a Angular Material, que no es una dependencia del workspace.

### Contrato Angular

`PbIconComponent` será standalone y recibirá `name`, `size`, `decorative` y `label`. Renderizará únicamente paths del registro `as const`, sin inyectar XML arbitrario ni aceptar HTML/SVG remoto. Si `decorative=true`, generará `aria-hidden="true"` y `focusable="false"`. Si es informativo/interactivo, exigirá un nombre accesible y generará `role="img"` con etiqueta accesible. Los botones y enlaces conservarán su etiqueta de acción; el icono interno será decorativo.

El tipo `PbIconName` se derivará del registro, eliminando los strings sin tipado de los catálogos de backoffice. Los consumers usarán `<pb-icon name="transfer" size="md" />` en lugar de SVG inline o emoji.

### Registro seguro y XML limpio

Los paths se representarán como datos TypeScript declarativos con atributos permitidos (`path`, `circle`, `rect`, `line`, `polyline`). Cada icono tendrá identificador, nodos y metadatos de uso. El registro no almacenará `style`, `script`, `id`, `class`, `fill` hexadecimal, `<title>`, `<desc>` ni metadata XML. Se validará en test que cada nodo esté en la lista permitida y que ningún atributo viole el contrato.

### Migración y gobierno

1. Introducir tokens, registro y componente en `@pleniu/ui` sin eliminar consumidores existentes.
2. Migrar componentes compartidos (`pb-empty-state`, timeline, trace tree) y publicar la API.
3. Migrar Customer Portal, priorizando navegación móvil, dashboard, transacciones, seguridad y el nuevo flujo de transferencias.
4. Migrar Backoffice, priorizando catálogo, tesorería, transaction hub, estados de carga/error y acciones críticas.
5. Prohibir nuevas ocurrencias de emojis decorativos, `ICON_PATHS` locales, icon fonts y SVG inline salvo el componente autorizado y logos/ilustraciones aprobadas.
6. Eliminar contratos antiguos una vez que las pruebas y búsqueda de repositorio confirmen cero consumidores.

# 5. Estándares de Accesibilidad

- Los iconos decorativos MUST declarar `aria-hidden="true"` y `focusable="false"`; no se expondrán a lectores de pantalla.
- Los iconos que sustituyen texto MUST recibir `label` no vacío y exponer `role="img"` con etiqueta accesible.
- En una acción transaccional crítica, el botón/enlace MUST poseer texto visible o `aria-label` descriptivo de la operación completa, por ejemplo `"Confirmar transferencia de 250.000 pesos"`; el icono no será el único nombre accesible.
- Color, forma o movimiento de un icono MUST NOT ser el único portador de estado; se acompañará de texto, badge o `aria-live` cuando el estado cambie.
- Los iconos interactivos dentro de controles deberán cumplir objetivo táctil mínimo de 44 × 44 CSS px, foco visible y contraste WCAG AA aplicable.

## Risks / Trade-offs

- **Migración extensa de templates** → dividir por portal/dominio, mantener compatibilidad temporal y validar con búsqueda automatizada.
- **Paths visualmente inconsistentes** → revisión de retícula y tests de atributos antes de registrar cada icono.
- **Regresión en lectores de pantalla** → pruebas unitarias del contrato ARIA y pruebas de navegación por teclado en flujos críticos.
- **Aumento de bundle** → registro tipado, imports de componente compartido y revisión de tamaño de build; no usar sprites ni runtime HTTP.
- **Uso accidental de iconos para representar estados críticos** → requerir texto/badge adicional en componentes de riesgo, fraude, saldo y confirmación.

## Open Questions

- Confirmar si el catálogo se publicará primero como parte de `@pleniu/ui` existente o como `@pleniu/financial-icons` cuando se requiera distribución externa.
- Definir con Brand la licencia, ownership y proceso de aprobación de nuevos paths.
- Acordar la política de excepciones para SVG inline que sean logos, gráficos de datos o ilustraciones no equivalentes a iconos de UI.
