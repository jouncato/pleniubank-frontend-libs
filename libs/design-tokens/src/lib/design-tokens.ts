import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'lib-design-tokens',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <p>
      design-tokens works!
    </p>
  `,
  styles: ``,
})
export class DesignTokens {

}
