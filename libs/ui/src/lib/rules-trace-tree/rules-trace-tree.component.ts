import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import type { TraceStep, TraceStepOutcome } from '@pleniu/rules-types';

import { PbIconComponent } from '../pb-icon.component';

/**
 * Árbol de trazabilidad de una evaluación del motor de reglas (HU-RE-047).
 *
 * Standalone, reusable por backoffice y customer portal.
 *
 * Inputs:
 * - `traceSteps` (required): árbol de pasos.
 * - `locale`: hint de idioma (los títulos/descripciones se asumen ya i18n-ready).
 * - `showTimings`: muestra duración por step.
 * - `redactInternals`: oculta campos internos (threshold, actual_value, score)
 *   y solo expone título/descripción — modo "customer-safe".
 *
 * Output:
 * - `stepClicked`: emite el `TraceStep` clickeado.
 */
@Component({
  selector: 'pleniu-rules-trace-tree',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="trace" role="tree" [attr.aria-label]="'Árbol de evaluación (' + locale() + ')'">
      @for (step of traceSteps(); track step.id) {
        <ng-container
          *ngTemplateOutlet="nodeTpl; context: { $implicit: step, depth: 0 }"
        ></ng-container>
      }
    </ul>

    <ng-template #nodeTpl let-step let-depth="depth">
      @let expanded = isExpanded(step.id);
      @let hasChildren = (step.children?.length ?? 0) > 0;
      <li
        class="node"
        [class.node--pass]="step.outcome === 'pass'"
        [class.node--fail]="step.outcome === 'fail'"
        [class.node--skipped]="step.outcome === 'skipped'"
        [class.node--error]="step.outcome === 'error'"
        role="treeitem"
        [attr.aria-expanded]="hasChildren ? expanded : null"
        [attr.aria-level]="depth + 1"
      >
        <button
          type="button"
          class="row"
          [style.paddingLeft.px]="depth * 16"
          (click)="onClick(step)"
          (keydown.enter)="onClick(step)"
          (keydown.space)="onClick(step); $event.preventDefault()"
        >
          @if (hasChildren) {
            <span
              class="caret"
              [class.caret--open]="expanded"
              (click)="toggle(step.id); $event.stopPropagation()"
              (keydown.enter)="toggle(step.id); $event.stopPropagation()"
              role="button"
              tabindex="0"
              [attr.aria-label]="expanded ? 'Colapsar' : 'Expandir'"
            ><pb-icon name="chevron-right" size="xs" /></span>
          } @else {
            <span class="caret caret--leaf"><pb-icon name="minus" size="xs" /></span>
          }
          <span class="icon"><pb-icon [name]="outcomeIcon(step.outcome)" size="sm" [decorative]="false" [label]="outcomeLabel(step.outcome)" /></span>
          <span class="title">{{ step.title }}</span>
          @if (showTimings() && step.duration_ms != null) {
            <span class="timing">{{ step.duration_ms }} ms</span>
          }
        </button>
        @if (step.description) {
          <p class="desc" [style.paddingLeft.px]="depth * 16 + 40">{{ step.description }}</p>
        }
        @if (!redactInternals()) {
          @if (step.actual_value !== undefined || step.threshold_value !== undefined || step.score !== undefined) {
            <dl class="internals" [style.paddingLeft.px]="depth * 16 + 40">
              @if (step.actual_value !== undefined) {
                <dt>actual</dt><dd>{{ formatValue(step.actual_value) }}</dd>
              }
              @if (step.threshold_value !== undefined) {
                <dt>threshold</dt><dd>{{ formatValue(step.threshold_value) }}</dd>
              }
              @if (step.score !== undefined) {
                <dt>score</dt><dd>{{ step.score }}</dd>
              }
            </dl>
          }
        }
        @if (hasChildren && expanded) {
          <ul class="children" role="group">
            @for (child of step.children; track child.id) {
              <ng-container
                *ngTemplateOutlet="nodeTpl; context: { $implicit: child, depth: depth + 1 }"
              ></ng-container>
            }
          </ul>
        }
      </li>
    </ng-template>
  `,
  styles: `
    :host { display: block; font-family: inherit; }
    .trace {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .children { list-style: none; margin: 0; padding: 0; }
    .node { padding: 0; }
    .row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.35rem 0.5rem;
      border: none;
      background: transparent;
      text-align: left;
      cursor: pointer;
      border-radius: 4px;
      color: var(--pleniu-color-text, #111827);
      font: inherit;
    }
    .row:hover { background: var(--pleniu-color-surface-100, #f3f4f6); }
    .row:focus-visible {
      outline: 2px solid var(--pleniu-color-primary-500, #2563eb);
      outline-offset: 1px;
    }
    .caret {
      display: inline-flex;
      justify-content: center;
      align-items: center;
      width: 1rem;
      height: 1rem;
      transition: transform 120ms ease-in-out;
      color: var(--pleniu-color-text-subtle, #6b7280);
      user-select: none;
    }
    .caret--open { transform: rotate(90deg); }
    .caret--leaf { color: var(--pleniu-color-text-muted, #9ca3af); font-weight: 700; }
    .icon { font-weight: 700; min-width: 1rem; text-align: center; }
    .node--pass .icon { color: var(--pleniu-color-success-600, #16a34a); }
    .node--fail .icon { color: var(--pleniu-color-error-600, #dc2626); }
    .node--skipped .icon { color: var(--pleniu-color-text-muted, #9ca3af); }
    .node--error .icon { color: var(--pleniu-color-warning-600, #d97706); }
    .title { flex: 1; }
    .timing {
      font-size: 0.75rem;
      color: var(--pleniu-color-text-subtle, #6b7280);
      font-variant-numeric: tabular-nums;
    }
    .desc {
      margin: 0 0 0.25rem 0;
      padding-top: 0.25rem;
      font-size: 0.875rem;
      color: var(--pleniu-color-text-subtle, #4b5563);
    }
    .internals {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 0.1rem 0.75rem;
      margin: 0.25rem 0 0.5rem 0;
      font-size: 0.75rem;
    }
    .internals dt {
      color: var(--pleniu-color-text-muted, #9ca3af);
      font-weight: 600;
    }
    .internals dd {
      margin: 0;
      color: var(--pleniu-color-text, #111827);
      font-family: 'SFMono-Regular', Menlo, monospace;
    }
  `,
  imports: [NgTemplateOutlet, PbIconComponent],
})
export class RulesTraceTreeComponent {
  readonly traceSteps = input.required<readonly TraceStep[]>();
  readonly locale = input<string>('es-CO');
  readonly showTimings = input<boolean>(true);
  readonly redactInternals = input<boolean>(false);

  readonly stepClicked = output<TraceStep>();

  private readonly _expanded = signal<ReadonlySet<string>>(new Set());
  readonly expanded = computed(() => this._expanded());

  isExpanded(id: string): boolean {
    return this._expanded().has(id);
  }

  toggle(id: string): void {
    this._expanded.update((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  onClick(step: TraceStep): void {
    this.stepClicked.emit(step);
  }

  outcomeIcon(o: TraceStepOutcome): 'check' | 'error' | 'minus' | 'warning' {
    switch (o) {
      case 'pass': return 'check';
      case 'fail': return 'error';
      case 'skipped': return 'minus';
      case 'error': return 'warning';
    }
  }

  outcomeLabel(o: TraceStepOutcome): string {
    switch (o) {
      case 'pass': return 'Cumple';
      case 'fail': return 'No cumple';
      case 'skipped': return 'Omitido';
      case 'error': return 'Error';
      default: return '';
    }
  }

  formatValue(v: unknown): string {
    if (v == null) return '—';
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      return String(v);
    }
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
}
