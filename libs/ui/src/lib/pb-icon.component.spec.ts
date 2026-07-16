import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PbIconComponent } from './pb-icon.component';

describe('PbIconComponent', () => {
  let fixture: ComponentFixture<PbIconComponent>;
  let component: PbIconComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PbIconComponent] }).compileComponents();
    fixture = TestBed.createComponent(PbIconComponent);
    component = fixture.componentInstance;
  });

  it('renders a decorative icon with the standard SVG contract', () => {
    fixture.componentRef.setInput('name', 'transfer');
    fixture.detectChanges();

    const svg = fixture.nativeElement.querySelector('svg') as SVGElement;
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg.getAttribute('stroke')).toBe('currentColor');
    expect(svg.getAttribute('stroke-width')).toBe('var(--pb-icon-stroke-width, 1.8)');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('focusable')).toBe('false');
  });

  it('exposes a labelled informative icon', () => {
    fixture.componentRef.setInput('name', 'fraud-alert');
    fixture.componentRef.setInput('decorative', false);
    fixture.componentRef.setInput('label', 'Alerta de fraude');
    fixture.detectChanges();

    const svg = fixture.nativeElement.querySelector('svg') as SVGElement;
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe('Alerta de fraude');
    expect(svg.getAttribute('aria-hidden')).toBeNull();
  });

  it('applies the requested token-based size class', () => {
    fixture.componentRef.setInput('name', 'check');
    fixture.componentRef.setInput('size', 'lg');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('svg')?.classList.contains('pb-icon--lg')).toBe(true);
  });
});
