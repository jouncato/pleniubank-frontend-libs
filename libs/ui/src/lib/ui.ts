import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'lib-ui',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <p>
      ui works!
    </p>
  `,
  styles: ``,
})
export class Ui {

}
