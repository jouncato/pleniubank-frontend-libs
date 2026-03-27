import { Component } from '@angular/core';

/**
 * Skip link WCAG (épica X-05): primer Tab muestra enlace a `#main-content`.
 */
@Component({
  selector: 'lib-skip-link',
  standalone: true,
  template: `
    <a class="pleniu-skip-link" href="#main-content">Ir al contenido principal</a>
  `,
  styles: [
    `
      .pleniu-skip-link {
        position: absolute;
        left: -9999px;
        z-index: 2000;
        padding: var(--pleniu-spacing-sm, 0.5rem) var(--pleniu-spacing-md, 1rem);
        background: var(--pleniu-color-surface, #fff);
        color: var(--pleniu-color-primary, #1565c0);
        border: 1px solid var(--pleniu-color-border, #ddd);
        border-radius: var(--pleniu-radius-sm, 4px);
      }
      .pleniu-skip-link:focus {
        left: var(--pleniu-spacing-md, 1rem);
        top: var(--pleniu-spacing-md, 1rem);
        outline: 2px solid var(--pleniu-color-primary, #1565c0);
      }
    `,
  ],
})
export class SkipLinkComponent {}
