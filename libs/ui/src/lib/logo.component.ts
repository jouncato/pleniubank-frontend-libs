import { Component, Input } from '@angular/core';
import { NgIf, NgClass } from '@angular/common';
import { BRAND_ASSETS } from './brand-assets';

type LogoVariant = 'color' | 'white' | 'auto';
type LogoSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'pb-logo',
  standalone: true,
  imports: [NgIf, NgClass],
  template: `
    <a *ngIf="clickable" [href]="href" class="pb-logo" [ngClass]="size" aria-label="Pleniu Bank">
      <img
        [src]="resolvedSrc"
        [width]="imgWidth"
        [height]="imgHeight"
        [alt]="alt"
        [attr.loading]="loading"
        decoding="async"
      />
    </a>
    <span *ngIf="!clickable" class="pb-logo" [ngClass]="size">
      <img
        [src]="resolvedSrc"
        [width]="imgWidth"
        [height]="imgHeight"
        [alt]="alt"
        [attr.loading]="loading"
        decoding="async"
      />
    </span>
  `,
  styles: `
    .pb-logo {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .pb-logo img {
      display: block;
      object-fit: contain;
      max-width: 100%;
      height: auto;
    }
    .pb-logo.sm img {
      max-height: 24px;
      width: auto;
    }
    .pb-logo.md img {
      max-height: 28px;
      width: auto;
    }
    .pb-logo.lg img {
      max-height: 32px;
      width: auto;
    }
  `,
})
export class PbLogoComponent {
  @Input() variant: LogoVariant = 'auto';
  @Input() onDark = false;
  @Input() size: LogoSize = 'md';
  @Input() clickable = false;
  @Input() href = '/';
  @Input() alt = 'Pleniu Bank';
  @Input() loading: 'eager' | 'lazy' = 'eager';

  get resolvedSrc(): string {
    if (this.variant === 'color') return BRAND_ASSETS.logoColor;
    if (this.variant === 'white') return BRAND_ASSETS.logoWhite;
    return this.onDark ? BRAND_ASSETS.logoWhite : BRAND_ASSETS.logoColor;
  }

  /** Dimensiones de layout (relación de aspecto ~1.83 del PNG de marca). max-height en CSS acota la vista. */
  get imgWidth(): number {
    switch (this.size) {
      case 'sm':
        return 44;
      case 'lg':
        return 59;
      default:
        return 51;
    }
  }

  get imgHeight(): number {
    switch (this.size) {
      case 'sm':
        return 24;
      case 'lg':
        return 32;
      default:
        return 28;
    }
  }
}
