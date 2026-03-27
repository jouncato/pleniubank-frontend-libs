import { Component } from '@angular/core';
import { SecuritySettingsVm } from '../../vm/security-settings';

@Component({
  selector: 'lib-security-settings',
  imports: [],
  templateUrl: './security-settings.html',
  styleUrl: './security-settings.scss',
})
export class SecuritySettings {
  constructor(protected readonly vm: SecuritySettingsVm) {}
}
