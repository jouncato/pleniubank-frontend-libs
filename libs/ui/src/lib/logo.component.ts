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
      <img [src]="resolvedSrc" [alt]="alt" [decoding]="'async'" [loading]="loading" />
    </a>
    <span *ngIf="!clickable" class="pb-logo" [ngClass]="size">
      <img [src]="resolvedSrc" [alt]="alt" [decoding]="'async'" [loading]="loading" />
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
    }
    .pb-logo.sm img { max-height: 24px; }
    .pb-logo.md img { max-height: 28px; }
    .pb-logo.lg img { max-height: 32px; }
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
}
