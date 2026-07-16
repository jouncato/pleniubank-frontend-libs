/**
 * Pleniu Colombia S.A. Design Tokens — constantes TypeScript.
 *
 * Fuente de verdad: `tokens.css` (mismo directorio, epic X-03). Este archivo
 * expone los MISMOS valores como constantes tipadas para consumo en lógica
 * TS/componentes donde `var(--pb-*)` no basta (canvas, cálculos de
 * contraste, exportación a PDF, etc.). No inventa valores nuevos: cada
 * entrada de `DESIGN_TOKENS_CSS_VARS` es literal 1:1 con una declaración de
 * `tokens.css`. `tokens.spec.ts` verifica que ambos archivos no diverjan.
 *
 * Organización en capas:
 * - Base: colores crudos, tipografía, espaciado, radios, sombras, breakpoints.
 * - Semántico: alias que referencian tokens base (`surface`, `text`, `border`,
 *   `danger`/`success`/`warning`/`info`) para que una variante futura (tema
 *   oscuro, marca por país) solo redefina esta capa sin tocar consumidores.
 */

/**
 * Mapa plano 1:1 con las custom properties del bloque `:root` base de
 * `tokens.css` (clave sin el prefijo `--`, valor literal de la declaración).
 * Los alias semánticos conservan el texto `var(--pb-otro)` tal cual aparece
 * en el CSS para que la comparación de consistencia sea exacta.
 */
export const DESIGN_TOKENS_CSS_VARS = {
  // Brand (base)
  'pb-color-primary': '#0272de',
  'pb-color-primary-dark': '#0056b3',
  'pb-color-blue-600': '#0b63b6',
  'pb-color-primary-light': '#00aeff',
  'pb-color-accent-lime': '#cad215',
  'pb-color-accent-cyan': '#03d3ff',
  'pb-color-accent-orange': '#fc6936',
  'pb-color-accent-amber': '#ff9600',
  'pb-color-accent-red': '#f91c50',
  'pb-color-accent-green': '#02d17b',
  'pb-color-accent-teal': '#05b9a8',

  // Neutral (base)
  'pb-gray-900': '#111827',
  'pb-gray-800': '#1f2937',
  'pb-gray-700': '#374151',
  'pb-gray-600': '#4b5563',
  'pb-gray-500': '#6b7280',
  'pb-gray-400': '#9ca3af',
  'pb-gray-300': '#d1d5db',
  'pb-gray-200': '#e5e7eb',
  'pb-gray-100': '#f3f4f6',
  'pb-gray-50': '#f9fafb',
  'pb-white': '#ffffff',

  // Status (base)
  'pb-status-ok': '#02d17b',
  'pb-status-warn': '#ff9600',
  'pb-status-error': '#f91c50',
  'pb-status-info': '#00aeff',
  'pb-status-neutral': '#9ca3af',

  // Typography (base)
  'pb-font-family': "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
  'pb-font-size-body': '16px',
  'pb-font-size-sm': '13px',
  'pb-font-size-xs': '11px',
  'pb-font-size-h1': '22px',
  'pb-font-size-h2': '18px',
  'pb-font-weight-regular': '400',
  'pb-font-weight-medium': '500',
  'pb-font-weight-semibold': '600',
  'pb-font-weight-bold': '700',
  'pb-font-weight-extrabold': '800',
  'pb-line-height': '1.6',

  // Spacing, radius, elevation, layout (base)
  'pb-space-4': '4px',
  'pb-space-8': '8px',
  'pb-space-12': '12px',
  'pb-space-16': '16px',
  'pb-space-20': '20px',
  'pb-space-24': '24px',
  'pb-radius': '12px',
  'pb-radius-sm': '8px',
  'pb-shadow': '0 2px 12px rgba(2, 114, 222, 0.08)',
  'pb-shadow-md': '0 4px 24px rgba(2, 114, 222, 0.12)',
  'pb-sidebar-width': '240px',
  'pb-topbar-height': '60px',
  'pb-icon-size-xs': '12px',
  'pb-icon-size-sm': '16px',
  'pb-icon-size-md': '20px',
  'pb-icon-size-lg': '24px',
  'pb-icon-size-xl': '32px',
  'pb-icon-size-2xl': '40px',
  'pb-icon-stroke-width': '1.8',

  // Surfaces & text (semántico — alias sobre base)
  'pb-surface': 'var(--pb-white)',
  'pb-surface-alt': 'var(--pb-gray-100)',
  'pb-text': 'var(--pb-gray-900)',
  'pb-text-input': 'var(--pb-gray-900)',
  'pb-text-muted': 'var(--pb-gray-700)',
  'pb-text-label': 'var(--pb-gray-700)',
  'pb-border': 'var(--pb-gray-200)',
  'pb-border-strong': 'var(--pb-gray-300)',
  'pb-border-input': 'var(--pb-gray-400)',
  'pb-link': 'var(--pb-color-primary)',

  // Content hierarchy (portales internos)
  'pb-content-title': '#2c2c2c',
  'pb-content-subtitle': '#3c3c3c',
  'pb-content-body': '#494949',
  'pb-border-table': '#303030',
  'pb-border-form': '#7e7e7e',
  'pb-danger': 'var(--pb-status-error)',
  'pb-success': 'var(--pb-status-ok)',
  'pb-warning': 'var(--pb-status-warn)',
  'pb-info': 'var(--pb-status-info)',
  'pb-icon-color-neutral': 'var(--pb-text-muted)',
  'pb-icon-color-info': 'var(--pb-info)',
  'pb-icon-color-success': 'var(--pb-success)',
  'pb-icon-color-warning': 'var(--pb-warning)',
  'pb-icon-color-danger': 'var(--pb-danger)',

  // Breakpoints (base)
  'pb-break-md': '1024px',
  'pb-break-sm': '768px',
  'pb-break-xs': '480px',
} as const satisfies Record<string, string>;

export type DesignTokenCssVarName = keyof typeof DESIGN_TOKENS_CSS_VARS;

/** Convierte una clave del mapa plano en su forma `var(--pb-xxx)` para uso inline en TS (p. ej. estilos de canvas). */
export function cssVar(name: DesignTokenCssVarName): string {
  return `var(--${name})`;
}

/**
 * API ergonómica agrupada por categoría, construida sobre `DESIGN_TOKENS_CSS_VARS`.
 * Usar `TOKENS.color.primary` en vez de la clave plana cuando el consumidor no
 * necesita iterar el catálogo completo.
 */
export const TOKENS = {
  color: {
    primary: DESIGN_TOKENS_CSS_VARS['pb-color-primary'],
    primaryDark: DESIGN_TOKENS_CSS_VARS['pb-color-primary-dark'],
    primaryLight: DESIGN_TOKENS_CSS_VARS['pb-color-primary-light'],
    accentLime: DESIGN_TOKENS_CSS_VARS['pb-color-accent-lime'],
    accentCyan: DESIGN_TOKENS_CSS_VARS['pb-color-accent-cyan'],
    accentOrange: DESIGN_TOKENS_CSS_VARS['pb-color-accent-orange'],
    accentAmber: DESIGN_TOKENS_CSS_VARS['pb-color-accent-amber'],
    accentRed: DESIGN_TOKENS_CSS_VARS['pb-color-accent-red'],
    accentGreen: DESIGN_TOKENS_CSS_VARS['pb-color-accent-green'],
    accentTeal: DESIGN_TOKENS_CSS_VARS['pb-color-accent-teal'],
    white: DESIGN_TOKENS_CSS_VARS['pb-white'],
  },
  gray: {
    900: DESIGN_TOKENS_CSS_VARS['pb-gray-900'],
    800: DESIGN_TOKENS_CSS_VARS['pb-gray-800'],
    700: DESIGN_TOKENS_CSS_VARS['pb-gray-700'],
    600: DESIGN_TOKENS_CSS_VARS['pb-gray-600'],
    500: DESIGN_TOKENS_CSS_VARS['pb-gray-500'],
    400: DESIGN_TOKENS_CSS_VARS['pb-gray-400'],
    300: DESIGN_TOKENS_CSS_VARS['pb-gray-300'],
    200: DESIGN_TOKENS_CSS_VARS['pb-gray-200'],
    100: DESIGN_TOKENS_CSS_VARS['pb-gray-100'],
    50: DESIGN_TOKENS_CSS_VARS['pb-gray-50'],
  },
  status: {
    ok: DESIGN_TOKENS_CSS_VARS['pb-status-ok'],
    warn: DESIGN_TOKENS_CSS_VARS['pb-status-warn'],
    error: DESIGN_TOKENS_CSS_VARS['pb-status-error'],
    info: DESIGN_TOKENS_CSS_VARS['pb-status-info'],
    neutral: DESIGN_TOKENS_CSS_VARS['pb-status-neutral'],
  },
  typography: {
    fontFamily: DESIGN_TOKENS_CSS_VARS['pb-font-family'],
    sizeBody: DESIGN_TOKENS_CSS_VARS['pb-font-size-body'],
    sizeSm: DESIGN_TOKENS_CSS_VARS['pb-font-size-sm'],
    sizeXs: DESIGN_TOKENS_CSS_VARS['pb-font-size-xs'],
    sizeH1: DESIGN_TOKENS_CSS_VARS['pb-font-size-h1'],
    sizeH2: DESIGN_TOKENS_CSS_VARS['pb-font-size-h2'],
    weightRegular: DESIGN_TOKENS_CSS_VARS['pb-font-weight-regular'],
    weightMedium: DESIGN_TOKENS_CSS_VARS['pb-font-weight-medium'],
    weightSemibold: DESIGN_TOKENS_CSS_VARS['pb-font-weight-semibold'],
    weightBold: DESIGN_TOKENS_CSS_VARS['pb-font-weight-bold'],
    weightExtrabold: DESIGN_TOKENS_CSS_VARS['pb-font-weight-extrabold'],
    lineHeight: DESIGN_TOKENS_CSS_VARS['pb-line-height'],
  },
  spacing: {
    4: DESIGN_TOKENS_CSS_VARS['pb-space-4'],
    8: DESIGN_TOKENS_CSS_VARS['pb-space-8'],
    12: DESIGN_TOKENS_CSS_VARS['pb-space-12'],
    16: DESIGN_TOKENS_CSS_VARS['pb-space-16'],
    20: DESIGN_TOKENS_CSS_VARS['pb-space-20'],
    24: DESIGN_TOKENS_CSS_VARS['pb-space-24'],
  },
  radius: {
    base: DESIGN_TOKENS_CSS_VARS['pb-radius'],
    sm: DESIGN_TOKENS_CSS_VARS['pb-radius-sm'],
  },
  shadow: {
    base: DESIGN_TOKENS_CSS_VARS['pb-shadow'],
    md: DESIGN_TOKENS_CSS_VARS['pb-shadow-md'],
  },
  icon: {
    size: {
      xs: DESIGN_TOKENS_CSS_VARS['pb-icon-size-xs'],
      sm: DESIGN_TOKENS_CSS_VARS['pb-icon-size-sm'],
      md: DESIGN_TOKENS_CSS_VARS['pb-icon-size-md'],
      lg: DESIGN_TOKENS_CSS_VARS['pb-icon-size-lg'],
      xl: DESIGN_TOKENS_CSS_VARS['pb-icon-size-xl'],
      '2xl': DESIGN_TOKENS_CSS_VARS['pb-icon-size-2xl'],
    },
    strokeWidth: DESIGN_TOKENS_CSS_VARS['pb-icon-stroke-width'],
  },
  breakpoint: {
    sm: DESIGN_TOKENS_CSS_VARS['pb-break-sm'],
    md: DESIGN_TOKENS_CSS_VARS['pb-break-md'],
  },
  /** Capa semántica: cambia de valor por tema/marca sin tocar consumidores. */
  semantic: {
    surface: DESIGN_TOKENS_CSS_VARS['pb-surface'],
    surfaceAlt: DESIGN_TOKENS_CSS_VARS['pb-surface-alt'],
    text: DESIGN_TOKENS_CSS_VARS['pb-text'],
    textMuted: DESIGN_TOKENS_CSS_VARS['pb-text-muted'],
    border: DESIGN_TOKENS_CSS_VARS['pb-border'],
    danger: DESIGN_TOKENS_CSS_VARS['pb-danger'],
    success: DESIGN_TOKENS_CSS_VARS['pb-success'],
    warning: DESIGN_TOKENS_CSS_VARS['pb-warning'],
    info: DESIGN_TOKENS_CSS_VARS['pb-info'],
    iconNeutral: DESIGN_TOKENS_CSS_VARS['pb-icon-color-neutral'],
    iconInfo: DESIGN_TOKENS_CSS_VARS['pb-icon-color-info'],
    iconSuccess: DESIGN_TOKENS_CSS_VARS['pb-icon-color-success'],
    iconWarning: DESIGN_TOKENS_CSS_VARS['pb-icon-color-warning'],
    iconDanger: DESIGN_TOKENS_CSS_VARS['pb-icon-color-danger'],
  },
} as const;
