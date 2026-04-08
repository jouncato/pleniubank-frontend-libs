import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'lib-forbidden-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './forbidden-view.html',
  styleUrl: './forbidden-view.scss',
})
export class ForbiddenView {

}
