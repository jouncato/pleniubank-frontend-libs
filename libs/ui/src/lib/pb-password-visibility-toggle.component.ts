import { ChangeDetectionStrategy, Component, model } from '@angular/core';

import { PbIconComponent } from './pb-icon.component';

/**
 * Botón de "mostrar/ocultar contraseña" reutilizable. El contenedor
 * inmediato del `<input>` debe tener `position: relative` para que el
 * botón se posicione sobre el borde derecho del campo.
 *
 * Uso:
 * ```html
 * <div style="position: relative;">
 *   <input [type]="showPw() ? 'text' : 'password'" ... />
 *   <pb-password-visibility-toggle [(visible)]="showPw" />
 * </div>
 * ```
 */
@Component({
  selector: 'pb-password-visibility-toggle',
  standalone: true,
  imports: [PbIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="pb-pw-toggle"
      [attr.aria-pressed]="visible()"
      [attr.aria-label]="visible() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
      (click)="visible.set(!visible())"
    >
      <pb-icon [name]="visible() ? 'eye-off' : 'eye'" size="sm" [decorative]="true" />
    </button>
  `,
  styles: `
    :host {
      position: absolute;
      top: 50%;
      right: 4px;
      transform: translateY(-50%);
    }
    .pb-pw-toggle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: none;
      border: none;
      border-radius: 6px;
      padding: 0;
      margin: 0;
      cursor: pointer;
      color: var(--pb-color-text-muted, #6b7280);
    }
    .pb-pw-toggle:hover {
      color: var(--pb-color-text, #111827);
      background: var(--pb-color-surface-hover, rgba(0, 0, 0, 0.05));
    }
    .pb-pw-toggle:focus-visible {
      outline: 2px solid var(--pb-color-primary, #2563eb);
      outline-offset: 2px;
    }
  `,
})
export class PbPasswordVisibilityToggleComponent {
  readonly visible = model(false);
}
