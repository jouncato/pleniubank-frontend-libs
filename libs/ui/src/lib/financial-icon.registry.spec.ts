import { PB_ICON_REGISTRY, type PbIconNode } from './financial-icon.registry';

describe('PB_ICON_REGISTRY', () => {
  it('contains the required financial icon set', () => {
    expect(PB_ICON_REGISTRY).toMatchObject({
      transfer: expect.any(Object),
      'credit-card': expect.any(Object),
      loan: expect.any(Object),
      'investment-chart': expect.any(Object),
      'security-lock': expect.any(Object),
      balance: expect.any(Object),
      'premium-profile': expect.any(Object),
    });
  });

  it('uses only approved SVG node types and declarative geometry attributes', () => {
    const allowedNodeKinds = new Set<PbIconNode['kind']>(['path', 'rect', 'circle', 'line', 'polyline']);
    const allowedAttributes = new Set([
      'd',
      'x',
      'y',
      'width',
      'height',
      'rx',
      'cx',
      'cy',
      'r',
      'x1',
      'y1',
      'x2',
      'y2',
      'points',
    ]);

    for (const definition of Object.values(PB_ICON_REGISTRY)) {
      expect(definition.nodes.length).toBeGreaterThan(0);
      for (const node of definition.nodes) {
        expect(allowedNodeKinds.has(node.kind)).toBe(true);
        for (const attribute of Object.keys(node.attrs)) {
          expect(allowedAttributes.has(attribute)).toBe(true);
        }
      }
    }
  });

  it('contains no raw SVG, metadata, style, color, or executable content', () => {
    const serialized = JSON.stringify(PB_ICON_REGISTRY).toLowerCase();
    for (const forbidden of ['<svg', '<script', '<metadata', 'style=', '#', 'fill=', 'stroke=']) {
      expect(serialized).not.toContain(forbidden);
    }
  });
});
