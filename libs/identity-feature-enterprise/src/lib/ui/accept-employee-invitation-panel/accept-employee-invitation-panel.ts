import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AcceptEmployeeInvitationVm } from '../../vm/accept-employee-invitation';

@Component({
  selector: 'lib-accept-employee-invitation-panel',
  imports: [CommonModule],
  providers: [AcceptEmployeeInvitationVm],
  templateUrl: './accept-employee-invitation-panel.html',
  styleUrl: './accept-employee-invitation-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcceptEmployeeInvitationPanel implements OnInit {
  private readonly route = inject(ActivatedRoute);
  protected readonly vm = inject(AcceptEmployeeInvitationVm);

  readonly token = this.route.snapshot.paramMap.get('token') ?? '';

  ngOnInit(): void {
    if (!this.token) {
      this.vm.errorMessage.set('No se encontró el enlace de invitación.');
      return;
    }
    this.vm.load(this.token);
  }

  accept(): void {
    if (!this.token) {
      return;
    }
    this.vm.accept(this.token);
  }
}
