import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { KybSubmitVm } from '../../vm/kyb-submit';

@Component({
  selector: 'lib-kyb-documents-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './kyb-documents-form.html',
  styleUrl: './kyb-documents-form.scss',
})
export class KybDocumentsForm {
  private readonly fb = inject(FormBuilder);
  protected readonly vm = inject(KybSubmitVm);

  readonly form = this.fb.nonNullable.group({
    referencesJson: ['{}', [Validators.required]],
    waiveAll: [true],
  });

  submit(): void {
    const raw = this.form.controls.referencesJson.value.trim();
    let references: Record<string, unknown> = {};
    try {
      const p = JSON.parse(raw) as unknown;
      if (typeof p === 'object' && p !== null && !Array.isArray(p)) {
        references = p as Record<string, unknown>;
      } else {
        return;
      }
    } catch {
      this.form.controls.referencesJson.setErrors({ json: true });
      return;
    }
    this.vm.submit({
      references,
      waive_all_mvp: this.form.controls.waiveAll.value,
    });
  }
}
