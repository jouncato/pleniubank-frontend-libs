import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FeatureFlagService } from '@pleniu/shared-auth';
import { SwitchContextVm } from '../../vm/switch-context';

@Component({
  selector: 'lib-switch-context-placeholder',
  imports: [CommonModule],
  templateUrl: './switch-context-placeholder.html',
  styleUrl: './switch-context-placeholder.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SwitchContextPlaceholder {
  protected readonly flags = inject(FeatureFlagService);
  protected readonly switchVm = inject(SwitchContextVm);
}
