import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { VerifyEnterpriseEmailVm } from '../../vm/verify-enterprise-email';

@Component({
  selector: 'lib-enterprise-verify-email-panel',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './enterprise-verify-email-panel.html',
  styleUrl: './enterprise-verify-email-panel.scss',
})
export class EnterpriseVerifyEmailPanel {
  private readonly fb = inject(FormBuilder);
  protected readonly vm = inject(VerifyEnterpriseEmailVm);

  readonly form = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.pattern(/^[0-9]{4,12}$/)]],
  });

  get roleLabel(): string {
    return this.vm.getRole() === 'principal' ? 'representante legal' : 'administrador';
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.vm.submit(this.form.controls.code.value);
  }
}
