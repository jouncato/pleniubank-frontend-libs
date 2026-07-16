export type PbIconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

type SvgAttrs = Readonly<{
  d?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rx?: number;
  cx?: number;
  cy?: number;
  r?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  points?: string;
}>;

export type PbIconNode = Readonly<{
  kind: 'path' | 'rect' | 'circle' | 'line' | 'polyline';
  attrs: SvgAttrs;
}>;

export type PbIconDefinition = Readonly<{
  nodes: readonly PbIconNode[];
  category: 'financial' | 'security' | 'interface';
}>;

const path = (d: string): PbIconNode => ({ kind: 'path', attrs: { d } });
const rect = (x: number, y: number, width: number, height: number, rx: number): PbIconNode => ({
  kind: 'rect',
  attrs: { x, y, width, height, rx },
});
const circle = (cx: number, cy: number, r: number): PbIconNode => ({ kind: 'circle', attrs: { cx, cy, r } });
const line = (x1: number, y1: number, x2: number, y2: number): PbIconNode => ({
  kind: 'line',
  attrs: { x1, y1, x2, y2 },
});
const polyline = (points: string): PbIconNode => ({ kind: 'polyline', attrs: { points } });

export const PB_ICON_REGISTRY = {
  transfer: { category: 'financial', nodes: [path('M4 7h13'), polyline('14 3 18 7 14 11'), path('M20 17H7'), polyline('10 13 6 17 10 21')] },
  'credit-card': { category: 'financial', nodes: [rect(3, 5, 18, 14, 2.5), path('M3 10h18'), path('M7 15h3')] },
  loan: { category: 'financial', nodes: [path('M4 18h16'), path('M6 18v-5.5A2.5 2.5 0 0 1 8.5 10h7a2.5 2.5 0 0 1 2.5 2.5V18'), path('M9 14h6'), path('M12 5v3'), polyline('10.5 6.5 12 5 13.5 6.5')] },
  'investment-chart': { category: 'financial', nodes: [path('M4 20V4'), path('M4 20h16'), polyline('7 15 11 11 14 13 19 7'), polyline('16 7 19 7 19 10')] },
  'security-lock': { category: 'security', nodes: [rect(4, 10, 16, 10, 2), path('M8 10V7a4 4 0 1 1 8 0v3'), path('M12 14v2')] },
  balance: { category: 'financial', nodes: [circle(12, 12, 8), path('M14.5 9.5C14 8.5 13 8 12 8c-1.4 0-2.5.9-2.5 2s1.1 2 2.5 2 2.5.9 2.5 2-1.1 2-2.5 2c-1 0-2-.5-2.5-1.5'), path('M12 6.5v11')] },
  'premium-profile': { category: 'financial', nodes: [circle(12, 8, 3.5), path('M5 20a7 7 0 0 1 14 0'), path('m18.5 4 .65 1.35L20.5 6l-1.35.65L18.5 8l-.65-1.35L16.5 6l1.35-.65L18.5 4Z')] },
  account: { category: 'financial', nodes: [path('M3 7l9-4 9 4'), path('M5 9v9'), path('M9 9v9'), path('M15 9v9'), path('M19 9v9'), path('M3 21h18'), path('M3 18h18')] },
  statement: { category: 'financial', nodes: [path('M7 3h7l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z'), path('M14 3v5h5'), path('M8 12h8'), path('M8 16h8')] },
  'interest-rate': { category: 'financial', nodes: [circle(8, 8, 2), circle(16, 16, 2), path('m7 17 10-10')] },
  atm: { category: 'financial', nodes: [rect(4, 3, 16, 18, 2), rect(7, 6, 10, 5, 1), path('M8 15h8'), path('M10 18h4')] },
  biometric: { category: 'security', nodes: [path('M12 3a6 6 0 0 0-6 6v2'), path('M18 11V9a6 6 0 0 0-12 0'), path('M6 15v-1a6 6 0 0 1 12 0v1'), path('M8 18v-3a4 4 0 0 1 8 0v3'), path('M12 21v-5')] },
  beneficiary: { category: 'financial', nodes: [circle(9, 8, 3), path('M3 20a6 6 0 0 1 12 0'), path('M17 11h4'), path('M19 9v4')] },
  deposit: { category: 'financial', nodes: [rect(4, 12, 16, 8, 2), path('M12 3v11'), polyline('8 7 12 3 16 7')] },
  withdrawal: { category: 'financial', nodes: [rect(4, 12, 16, 8, 2), path('M12 14V3'), polyline('8 7 12 3 16 7')] },
  payment: { category: 'financial', nodes: [rect(3, 5, 18, 14, 2.5), path('M3 10h18'), path('M7 15h4'), circle(17, 15, 1)] },
  reconciliation: { category: 'financial', nodes: [path('M4 7h12'), polyline('13 3 17 7 13 11'), path('M20 17H8'), polyline('11 13 7 17 11 21'), path('m9 17 2 2 4-5')] },
  payroll: { category: 'financial', nodes: [circle(12, 12, 8), path('M14.5 9.5C14 8.5 13 8 12 8c-1.4 0-2.5.9-2.5 2s1.1 2 2.5 2 2.5.9 2.5 2-1.1 2-2.5 2c-1 0-2-.5-2.5-1.5'), path('M12 6.5v11')] },
  wallet: { category: 'financial', nodes: [path('M4 7a2 2 0 0 1 2-2h11v4H6a2 2 0 0 0 0 4h14v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z'), path('M16 13h5'), circle(16, 15, 1)] },
  receipt: { category: 'financial', nodes: [path('M6 3h12v18l-3-2-3 2-3-2-3 2V3Z'), path('M9 8h6'), path('M9 12h6')] },
  bank: { category: 'financial', nodes: [path('m3 10 9-6 9 6'), path('M4 20h16'), path('M6 10v7'), path('M10 10v7'), path('M14 10v7'), path('M18 10v7')] },
  'fraud-alert': { category: 'security', nodes: [path('M12 3 4 7v5c0 5 3.4 8.2 8 9 4.6-.8 8-4 8-9V7l-8-4Z'), path('M12 8v4'), path('M12 16h.01')] },
  'shield-check': { category: 'security', nodes: [path('M12 3 4 7v5c0 5 3.4 8.2 8 9 4.6-.8 8-4 8-9V7l-8-4Z'), polyline('9 12 11 14 15 10')] },
  alert: { category: 'security', nodes: [path('M12 3 3 20h18L12 3Z'), path('M12 9v4'), path('M12 17h.01')] },
  lock: { category: 'security', nodes: [rect(4, 10, 16, 10, 2), path('M8 10V7a4 4 0 1 1 8 0v3')] },
  audit: { category: 'security', nodes: [path('M7 3h8l3 3v15H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z'), path('M15 3v4h4'), path('M9 12h6'), path('M9 16h4')] },
  key: { category: 'security', nodes: [circle(8, 15, 3), path('m10 13 8-8'), path('M15 5h4v4'), path('M13 11l2 2')] },
  approval: { category: 'security', nodes: [circle(12, 12, 9), polyline('8 12 11 15 16 9')] },
  bell: { category: 'security', nodes: [path('M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9'), path('M10 21h4')] },
  search: { category: 'interface', nodes: [circle(10.5, 10.5, 6.5), path('m16 16 5 5')] },
  filter: { category: 'interface', nodes: [path('M4 5h16'), path('M7 12h10'), path('M10 19h4')] },
  close: { category: 'interface', nodes: [path('m6 6 12 12'), path('m18 6-12 12')] },
  more: { category: 'interface', nodes: [circle(5, 12, 1), circle(12, 12, 1), circle(19, 12, 1)] },
  check: { category: 'interface', nodes: [polyline('5 12 10 17 19 7')] },
  info: { category: 'interface', nodes: [circle(12, 12, 9), path('M12 11v5'), path('M12 8h.01')] },
  warning: { category: 'interface', nodes: [path('M12 3 3 20h18L12 3Z'), path('M12 9v4'), path('M12 17h.01')] },
  error: { category: 'interface', nodes: [circle(12, 12, 9), path('m9 9 6 6'), path('m15 9-6 6')] },
  refresh: { category: 'interface', nodes: [path('M20 11a8 8 0 1 0 1 4'), polyline('20 4 20 11 13 11')] },
  'chevron-left': { category: 'interface', nodes: [polyline('15 18 9 12 15 6')] },
  'chevron-right': { category: 'interface', nodes: [polyline('9 18 15 12 9 6')] },
  'chevron-down': { category: 'interface', nodes: [polyline('6 9 12 15 18 9')] },
  home: { category: 'interface', nodes: [path('m3 11 9-7 9 7'), path('M5 10v10h14V10'), path('M10 20v-6h4v6')] },
  clock: { category: 'interface', nodes: [circle(12, 12, 9), path('M12 7v5l3 2')] },
  undo: { category: 'interface', nodes: [path('M9 7 5 11l4 4'), path('M5 11h8a6 6 0 1 1 0 12')] },
  minus: { category: 'interface', nodes: [path('M6 12h12')] },
} as const satisfies Record<string, PbIconDefinition>;

export type PbIconName = keyof typeof PB_ICON_REGISTRY;
