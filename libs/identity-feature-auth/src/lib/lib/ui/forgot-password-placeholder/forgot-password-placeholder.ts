import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'lib-forgot-password-placeholder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './forgot-password-placeholder.html',
  styleUrl: './forgot-password-placeholder.scss',
})
export class ForgotPasswordPlaceholder {
}
