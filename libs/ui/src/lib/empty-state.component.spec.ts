import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { EmptyStateComponent } from './empty-state.component';

describe('EmptyStateComponent', () => {
  let component: EmptyStateComponent;
  let fixture: ComponentFixture<EmptyStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyStateComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(EmptyStateComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    component.title = 'Sin datos';
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('emits the CTA event when the action button is used', () => {
    component.title = 'Sin datos';
    component.ctaLabel = 'Reintentar';
    component.ctaRoute = null;
    const spy = vi.fn();
    component.cta.subscribe(spy);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    host.querySelector('button')?.dispatchEvent(new Event('click'));

    expect(spy).toHaveBeenCalledTimes(1);
  });
});
