import { cssVar, DESIGN_TOKENS_CSS_VARS, TOKENS } from './tokens';
import { TOKENS_CSS_ROOT_SNAPSHOT } from './tokens.css-snapshot';

describe('DESIGN_TOKENS_CSS_VARS — consistencia con tokens.css', () => {
  const cssText = TOKENS_CSS_ROOT_SNAPSHOT;

  it('cada token TS existe en tokens.css con el mismo valor literal', () => {
    for (const [name, value] of Object.entries(DESIGN_TOKENS_CSS_VARS)) {
      const declaration = `--${name}: ${value};`;
      expect(cssText).toContain(declaration);
    }
  });

  it('no está vacío (evita un catálogo trivial que pasaría por omisión)', () => {
    expect(Object.keys(DESIGN_TOKENS_CSS_VARS).length).toBeGreaterThan(30);
  });
});

describe('cssVar', () => {
  it('produce la forma var(--pb-xxx)', () => {
    expect(cssVar('pb-color-primary')).toBe('var(--pb-color-primary)');
  });
});

describe('TOKENS — API agrupada', () => {
  it('expone los mismos valores que el mapa plano', () => {
    expect(TOKENS.color.primary).toBe(DESIGN_TOKENS_CSS_VARS['pb-color-primary']);
    expect(TOKENS.typography.fontFamily).toBe(DESIGN_TOKENS_CSS_VARS['pb-font-family']);
    expect(TOKENS.spacing[16]).toBe(DESIGN_TOKENS_CSS_VARS['pb-space-16']);
    expect(TOKENS.breakpoint.sm).toBe(DESIGN_TOKENS_CSS_VARS['pb-break-sm']);
  });

  it('la capa semántica referencia tokens base vía var(...)', () => {
    expect(TOKENS.semantic.surface).toBe('var(--pb-white)');
    expect(TOKENS.semantic.danger).toBe('var(--pb-status-error)');
  });
});
