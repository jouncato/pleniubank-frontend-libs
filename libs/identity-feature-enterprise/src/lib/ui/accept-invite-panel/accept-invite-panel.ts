import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PbPasswordVisibilityToggleComponent } from '@pleniu/ui';
import { AcceptInviteVm } from '../../vm/accept-invite';

const PASSWORD_COMPLEXITY_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

@Component({
  selector: 'lib-accept-invite-panel',
  imports: [CommonModule, ReactiveFormsModule, PbPasswordVisibilityToggleComponent],
  templateUrl: './accept-invite-panel.html',
  styleUrl: './accept-invite-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcceptInvitePanel implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  protected readonly vm = inject(AcceptInviteVm);
  readonly showPassword = signal(false);

  readonly form = this.fb.nonNullable.group({
    token: ['', [Validators.required, Validators.minLength(20)]],
    password: ['', [Validators.required, Validators.minLength(12), Validators.pattern(PASSWORD_COMPLEXITY_PATTERN)]],
  });

  get validationSummary(): string[] {
    const fields: Array<[keyof typeof this.form.controls, string]> = [
      ['token', 'Enlace de invitación'],
      ['password', 'Contraseña'],
    ];
    return fields.filter(([field]) => this.form.controls[field].invalid).map(([, label]) => label);
  }

  passwordErrorMessage(): string {
    if (this.form.controls.password.hasError('required')) return 'La contraseña es obligatoria.';
    return 'Debe tener mínimo 12 caracteres, una mayúscula, una minúscula, un número y un símbolo.';
  }

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
