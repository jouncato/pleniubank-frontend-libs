import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InviteUserVm } from '../../vm/invite-user';

@Component({
  selector: 'lib-invite-user-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './invite-user-form.html',
  styleUrl: './invite-user-form.scss',
})
export class InviteUserForm {
  private readonly fb = inject(FormBuilder);
  protected readonly vm = inject(InviteUserVm);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    role_hint: this.fb.nonNullable.control<'admin' | 'operator' | 'viewer'>('operator', Validators.required),
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.vm.submit({ email: v.email, role_hint: v.role_hint });
  }

  cooldownActive(): boolean {
    return this.vm.cooldownUntil() > Date.now();
  }
}
