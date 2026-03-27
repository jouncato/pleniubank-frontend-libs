import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PbLogoComponent } from 'ui';

@Component({
  selector: 'lib-auth-shell',
  imports: [RouterOutlet, PbLogoComponent],
  templateUrl: './auth-shell.html',
  styleUrl: './auth-shell.scss',
})
export class AuthShell {
}
