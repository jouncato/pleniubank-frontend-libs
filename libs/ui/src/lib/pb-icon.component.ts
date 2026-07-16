import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { PB_ICON_REGISTRY, type PbIconName, type PbIconSize } from './financial-icon.registry';

const ICON_SIZE_CLASS: Record<PbIconSize, string> = {
  xs: 'pb-icon--xs',
  sm: 'pb-icon--sm',
  md: 'pb-icon--md',
  lg: 'pb-icon--lg',
  xl: 'pb-icon--xl',
  '2xl': 'pb-icon--2xl',
};

@Component({
  selector: 'pb-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      class="pb-icon"
      [class]="sizeClass()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="var(--pb-icon-stroke-width, 1.8)"
      stroke-linecap="round"
      stroke-linejoin="round"
      [attr.aria-hidden]="decorative() ? 'true' : null"
      [attr.aria-label]="decorative() ? null : label()"
      [attr.role]="decorative() ? null : 'img'"
      focusable="false"
    >
      @for (node of definition().nodes; track $index) {
        @switch (node.kind) {
          @case ('path') {
            <path [attr.d]="node.attrs.d" />
          }
          @case ('rect') {
            <rect [attr.x]="node.attrs.x" [attr.y]="node.attrs.y" [attr.width]="node.attrs.width" [attr.height]="node.attrs.height" [attr.rx]="node.attrs.rx" />
          }
          @case ('circle') {
            <circle [attr.cx]="node.attrs.cx" [attr.cy]="node.attrs.cy" [attr.r]="node.attrs.r" />
          }
          @case ('line') {
            <line [attr.x1]="node.attrs.x1" [attr.y1]="node.attrs.y1" [attr.x2]="node.attrs.x2" [attr.y2]="node.attrs.y2" />
          }
          @case ('polyline') {
            <polyline [attr.points]="node.attrs.points" />
          }
        }
      }
    </svg>
  `,
  styles: `
    :host { display: inline-flex; flex: 0 0 auto; line-height: 0; }
    .pb-icon { display: block; width: var(--pb-icon-size-md, 20px); height: var(--pb-icon-size-md, 20px); }
    .pb-icon--xs { width: var(--pb-icon-size-xs, 12px); height: var(--pb-icon-size-xs, 12px); }
    .pb-icon--sm { width: var(--pb-icon-size-sm, 16px); height: var(--pb-icon-size-sm, 16px); }
    .pb-icon--md { width: var(--pb-icon-size-md, 20px); height: var(--pb-icon-size-md, 20px); }
    .pb-icon--lg { width: var(--pb-icon-size-lg, 24px); height: var(--pb-icon-size-lg, 24px); }
    .pb-icon--xl { width: var(--pb-icon-size-xl, 32px); height: var(--pb-icon-size-xl, 32px); }
    .pb-icon--2xl { width: var(--pb-icon-size-2xl, 40px); height: var(--pb-icon-size-2xl, 40px); }
  `,
})
export class PbIconComponent {
  readonly name = input.required<PbIconName>();
  readonly size = input<PbIconSize>('md');
  readonly decorative = input(true);
  readonly label = input<string | null>(null);

  protected readonly definition = computed(() => PB_ICON_REGISTRY[this.name()]);
  protected readonly sizeClass = computed(() => ICON_SIZE_CLASS[this.size()]);
}
