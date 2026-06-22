import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgIf, NgClass } from '@angular/common';
import { BRAND_ASSETS } from './brand-assets';
import { inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

type LogoVariant = 'color' | 'white' | 'auto';
type LogoSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'pb-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [NgIf, NgClass],
  template: `
    <a *ngIf="clickable" [href]="href" class="pb-logo" [ngClass]="size" aria-label="Pleniu Colombia S.A.">
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
      max-height: 32px;
      width: auto;
    }
    .pb-logo.md img {
      max-height: 42px;
      width: auto;
    }
    .pb-logo.lg img {
      max-height: 56px;
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
  @Input() alt = 'Pleniu Colombia S.A.';
  @Input() loading: 'eager' | 'lazy' = 'eager';

  private document = inject(DOCUMENT);

  get resolvedSrc(): string {
    const baseAsset = this.variant === 'color' ? BRAND_ASSETS.logoColor : 
                     this.variant === 'white' ? BRAND_ASSETS.logoWhite : 
                     this.onDark ? BRAND_ASSETS.logoWhite : BRAND_ASSETS.logoColor;
    
    // Detectar si estamos en contexto de backoffice por el base href
    const baseElement = this.document.querySelector('base');
    const baseHref = baseElement?.getAttribute('href') || '/';
    
    // Si el base href contiene /backoffice/, ajustar la URL del asset
    if (baseHref.includes('/backoffice/')) {
      // Para backoffice, los assets deben estar bajo /backoffice/assets/
      if (baseAsset.startsWith('/assets/')) {
        return baseAsset.replace('/assets/', '/backoffice/assets/');
      }
    }
    
    return baseAsset;
  }

  /** Dimensiones de layout (relación de aspecto ~1.83 del PNG de marca). max-height en CSS acota la vista. */
  get imgWidth(): number {
    switch (this.size) {
      case 'sm':
        return 59;
      case 'lg':
        return 102;
      default:
        return 77;
    }
  }

  get imgHeight(): number {
    switch (this.size) {
      case 'sm':
        return 32;
      case 'lg':
        return 56;
      default:
        return 42;
    }
  }
}
