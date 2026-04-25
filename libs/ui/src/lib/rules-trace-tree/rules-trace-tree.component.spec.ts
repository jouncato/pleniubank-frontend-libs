import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import type { TraceStep } from '@pleniu/rules-types';

import { RulesTraceTreeComponent } from './rules-trace-tree.component';

const BASIC_TREE: TraceStep[] = [
  {
    id: 's-1',
    rule_code: 'AGE_MIN',
    title: 'Edad mínima',
    outcome: 'pass',
    duration_ms: 5,
    actual_value: 25,
    threshold_value: 18,
  },
  {
    id: 's-2',
    rule_code: 'SCORE_MIN',
    title: 'Score mínimo',
    description: 'No alcanza el score requerido',
    outcome: 'fail',
    duration_ms: 12,
    actual_value: 0.55,
    threshold_value: 0.7,
    score: 0.55,
    children: [
      {
        id: 's-2-1',
        rule_code: 'SCORE_SOURCE',
        title: 'Fuente del score',
        outcome: 'skipped',
      },
    ],
  },
];

@Component({
  standalone: true,
  imports: [RulesTraceTreeComponent],
  template: `
    <pleniu-rules-trace-tree
      [traceSteps]="steps()"
      [redactInternals]="redact()"
      [showTimings]="timings()"
      (stepClicked)="lastClicked.set($event)"
    />
  `,
})
class HostComponent {
  readonly steps = signal<TraceStep[]>(BASIC_TREE);
  readonly redact = signal(false);
  readonly timings = signal(true);
  readonly lastClicked = signal<TraceStep | null>(null);
}

describe('RulesTraceTreeComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renderiza todos los steps de nivel raíz', () => {
    const rows = fixture.debugElement.queryAll(By.css('.row'));
    // 2 root items (hijos colapsados inicialmente)
    expect(rows.length).toBe(2);
  });

  it('aplica clase de outcome correspondiente', () => {
    const nodes = fixture.debugElement.queryAll(By.css('.node'));
    expect(nodes[0].nativeElement.classList.contains('node--pass')).toBe(true);
    expect(nodes[1].nativeElement.classList.contains('node--fail')).toBe(true);
  });

  it('muestra icon según outcome', () => {
    const icons = fixture.debugElement.queryAll(By.css('.icon'));
    expect(icons[0].nativeElement.textContent.trim()).toBe('✓');
    expect(icons[1].nativeElement.textContent.trim()).toBe('✗');
  });

  it('muestra timings cuando showTimings=true', () => {
    const timings = fixture.debugElement.queryAll(By.css('.timing'));
    expect(timings.length).toBeGreaterThan(0);
    expect(timings[0].nativeElement.textContent).toContain('5 ms');
  });

  it('oculta timings cuando showTimings=false', () => {
    host.timings.set(false);
    fixture.detectChanges();
    const timings = fixture.debugElement.queryAll(By.css('.timing'));
    expect(timings.length).toBe(0);
  });

  it('expone actual/threshold/score cuando redactInternals=false', () => {
    const dts = fixture.debugElement.queryAll(By.css('.internals dt'));
    const labels = dts.map((d) => d.nativeElement.textContent.trim());
    expect(labels).toContain('actual');
    expect(labels).toContain('threshold');
    expect(labels).toContain('score');
  });

  it('oculta internals cuando redactInternals=true (customer-safe)', () => {
    host.redact.set(true);
    fixture.detectChanges();
    const dts = fixture.debugElement.queryAll(By.css('.internals'));
    expect(dts.length).toBe(0);
  });

  it('expandir muestra los hijos', () => {
    // Segundo step tiene children, lo expando via caret
    const carets = fixture.debugElement.queryAll(By.css('.caret:not(.caret--leaf)'));
    expect(carets.length).toBeGreaterThan(0);
    carets[0].nativeElement.click();
    fixture.detectChanges();
    const rows = fixture.debugElement.queryAll(By.css('.row'));
    // 2 root + 1 child expandido
    expect(rows.length).toBe(3);
  });

  it('click en la fila emite stepClicked con el step completo', () => {
    const rows = fixture.debugElement.queryAll(By.css('.row'));
    rows[0].nativeElement.click();
    fixture.detectChanges();
    const clicked = host.lastClicked();
    expect(clicked).not.toBeNull();
    expect(clicked!.rule_code).toBe('AGE_MIN');
  });

  it('tree tiene role=tree y aria-level progresivo', () => {
    const tree = fixture.debugElement.query(By.css('[role="tree"]'));
    expect(tree).toBeTruthy();
    const items = fixture.debugElement.queryAll(By.css('[role="treeitem"]'));
    expect(items.length).toBe(2);
    expect(items[0].nativeElement.getAttribute('aria-level')).toBe('1');
  });

  it('muestra descripción cuando el step la tiene', () => {
    const descs = fixture.debugElement.queryAll(By.css('.desc'));
    const texts = descs.map((d) => d.nativeElement.textContent.trim());
    expect(texts).toContain('No alcanza el score requerido');
  });
});
