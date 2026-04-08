import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AcceptInviteVm } from '../../vm/accept-invite';

@Component({
  selector: 'lib-accept-invite-panel',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './accept-invite-panel.html',
  styleUrl: './accept-invite-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcceptInvitePanel implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  protected readonly vm = inject(AcceptInviteVm);

  readonly form = this.fb.nonNullable.group({
    token: ['', [Validators.required, Validators.minLength(20)]],
    password: ['', [Validators.required, Validators.minLength(12)]],
  });

  ngOnInit(): void {
    const t = this.route.snapshot.queryParamMap.get('token');
    if (!t) {
      this.vm.missingToken.set(true);
      return;
    }
    this.vm.missingToken.set(false);
    this.form.patchValue({ token: t });
  }

  submit(): void {
    if (this.vm.missingToken()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.vm.submit({ token: v.token, password: v.password });
  }
}
