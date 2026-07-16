/**
 * Snapshot literal del bloque `:root` base de `tokens.css` (Brand → Breakpoints,
 * antes de los alias `--pleniu-*` y las variantes de tema oscuro).
 *
 * Por qué existe: el bundler de `ng test` (esbuild vía @angular/build) procesa
 * los imports `.css` como hojas de estilo, no como texto crudo — no hay forma
 * soportada de leer `tokens.css` como string dentro de un spec sin acceso a
 * `node:fs` (bloqueado por el mismo bundler al compilar para navegador). Este
 * snapshot es la única vía práctica para verificar `tokens.ts` sin depender de
 * un paso de build adicional.
 *
 * Límite conocido: si alguien edita `tokens.css` sin actualizar este snapshot
 * (o `tokens.ts`), el test seguirá pasando con datos desactualizados — no es
 * una lectura en vivo del archivo real. Mantener los tres en sync a mano
 * mientras no exista un generador de build (ver README, sección "Guía de
 * migración" y design.md de `b2c-data-access`, riesgo "Duplicación temporal").
 */
export const TOKENS_CSS_ROOT_SNAPSHOT = `
  --pb-color-primary: #0272de;
  --pb-color-primary-dark: #0056b3;
  --pb-color-blue-600: #0b63b6;
  --pb-color-primary-light: #00aeff;
  --pb-color-accent-lime: #cad215;
  --pb-color-accent-cyan: #03d3ff;
  --pb-color-accent-orange: #fc6936;
  --pb-color-accent-amber: #ff9600;
  --pb-color-accent-red: #f91c50;
  --pb-color-accent-green: #02d17b;
  --pb-color-accent-teal: #05b9a8;

  --pb-gray-900: #111827;
  --pb-gray-800: #1f2937;
  --pb-gray-700: #374151;
  --pb-gray-600: #4b5563;
  --pb-gray-500: #6b7280;
  --pb-gray-400: #9ca3af;
  --pb-gray-300: #d1d5db;
  --pb-gray-200: #e5e7eb;
  --pb-gray-100: #f3f4f6;
  --pb-gray-50: #f9fafb;
  --pb-white: #ffffff;

  --pb-status-ok: #02d17b;
  --pb-status-warn: #ff9600;
  --pb-status-error: #f91c50;
  --pb-status-info: #00aeff;
  --pb-status-neutral: #9ca3af;

  --pb-font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
  --pb-font-size-body: 16px;
  --pb-font-size-sm: 13px;
  --pb-font-size-xs: 11px;
  --pb-font-size-h1: 22px;
  --pb-font-size-h2: 18px;
  --pb-font-weight-regular: 400;
  --pb-font-weight-medium: 500;
  --pb-font-weight-semibold: 600;
  --pb-font-weight-bold: 700;
  --pb-font-weight-extrabold: 800;
  --pb-line-height: 1.6;

  --pb-space-4: 4px;
  --pb-space-8: 8px;
  --pb-space-12: 12px;
  --pb-space-16: 16px;
  --pb-space-20: 20px;
  --pb-space-24: 24px;
  --pb-radius: 12px;
  --pb-radius-sm: 8px;
  --pb-shadow: 0 2px 12px rgba(2, 114, 222, 0.08);
  --pb-shadow-md: 0 4px 24px rgba(2, 114, 222, 0.12);
  --pb-sidebar-width: 240px;
  --pb-topbar-height: 60px;
  --pb-icon-size-xs: 12px;
  --pb-icon-size-sm: 16px;
  --pb-icon-size-md: 20px;
  --pb-icon-size-lg: 24px;
  --pb-icon-size-xl: 32px;
  --pb-icon-size-2xl: 40px;
  --pb-icon-stroke-width: 1.8;

  --pb-surface: var(--pb-white);
  --pb-surface-alt: var(--pb-gray-100);
  --pb-text: var(--pb-gray-900);
  --pb-text-input: var(--pb-gray-900);
  --pb-text-muted: var(--pb-gray-700);
  --pb-text-label: var(--pb-gray-700);
  --pb-border: var(--pb-gray-200);
  --pb-border-strong: var(--pb-gray-300);
  --pb-border-input: var(--pb-gray-400);
  --pb-link: var(--pb-color-primary);

  --pb-content-title: #2c2c2c;
  --pb-content-subtitle: #3c3c3c;
  --pb-content-body: #494949;
  --pb-border-table: #303030;
  --pb-border-form: #7e7e7e;
  --pb-danger: var(--pb-status-error);
  --pb-success: var(--pb-status-ok);
  --pb-warning: var(--pb-status-warn);
  --pb-info: var(--pb-status-info);
  --pb-icon-color-neutral: var(--pb-text-muted);
  --pb-icon-color-info: var(--pb-info);
  --pb-icon-color-success: var(--pb-success);
  --pb-icon-color-warning: var(--pb-warning);
  --pb-icon-color-danger: var(--pb-danger);

  --pb-break-md: 1024px;
  --pb-break-sm: 768px;
  --pb-break-xs: 480px;
`;
