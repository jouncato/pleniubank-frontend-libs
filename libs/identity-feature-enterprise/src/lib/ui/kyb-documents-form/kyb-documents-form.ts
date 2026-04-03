import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SessionStore } from 'shared-auth';
import {
  kybLocalAddDoc,
  kybLocalListDocs,
  kybLocalRemoveDoc,
  validateKybLocalFile,
  type KybLocalDocumentRecord,
} from '../../data/kyb-local-documents';
import { KybSubmitVm } from '../../vm/kyb-submit';

@Component({
  selector: 'lib-kyb-documents-form',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './kyb-documents-form.html',
  styleUrl: './kyb-documents-form.scss',
})
export class KybDocumentsForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly session = inject(SessionStore);
  protected readonly vm = inject(KybSubmitVm);

  readonly localDocs = signal<KybLocalDocumentRecord[]>([]);
  readonly localFileError = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    referencesJson: ['{}', [Validators.required]],
    waiveAll: [true],
  });

  ngOnInit(): void {
    void this.refreshLocalDocs();
  }

  async onLocalFilesSelected(ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement;
    const files = input.files;
    input.value = '';
    const eid = this.session.claims()?.enterprise_id?.trim();
    if (!files?.length || !eid) {
      return;
    }
    this.localFileError.set(null);
    for (const file of Array.from(files)) {
      const msg = validateKybLocalFile(file);
      if (msg) {
        this.localFileError.set(msg);
        continue;
      }
      try {
        await kybLocalAddDoc(eid, file);
      } catch (e) {
        this.localFileError.set(e instanceof Error ? e.message : 'No se pudo guardar el archivo.');
      }
    }
    await this.refreshLocalDocs();
  }

  async removeLocalDoc(id: string): Promise<void> {
    const eid = this.session.claims()?.enterprise_id?.trim();
    if (!eid) {
      return;
    }
    await kybLocalRemoveDoc(eid, id);
    await this.refreshLocalDocs();
  }

  private async refreshLocalDocs(): Promise<void> {
    const eid = this.session.claims()?.enterprise_id?.trim();
    if (!eid) {
      this.localDocs.set([]);
      return;
    }
    this.localDocs.set(await kybLocalListDocs(eid));
  }

  submit(): void {
    const raw = this.form.controls.referencesJson.value.trim();
    let references: Record<string, unknown> = {};
    try {
      const p = JSON.parse(raw) as unknown;
      if (typeof p === 'object' && p !== null && !Array.isArray(p)) {
        references = p as Record<string, unknown>;
      } else {
        this.form.controls.referencesJson.setErrors({ json: true });
        this.form.controls.referencesJson.markAsTouched();
        return;
      }
    } catch {
      this.form.controls.referencesJson.setErrors({ json: true });
      this.form.controls.referencesJson.markAsTouched();
      return;
    }
    this.vm.submit({
      references,
      waive_all_mvp: this.form.controls.waiveAll.value,
    });
  }
}
