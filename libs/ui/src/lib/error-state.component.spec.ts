import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ErrorStateComponent } from './error-state.component';

describe('ErrorStateComponent', () => {
  let fixture: ComponentFixture<ErrorStateComponent>;
  let component: ErrorStateComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorStateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorStateComponent);
    component = fixture.componentInstance;
    component.title = 'No pudimos cargar datos';
    component.message = 'Intenta nuevamente.';
  });

  it('renders an alert with correlation id', () => {
    component.correlationId = 'cid-123';
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[role="alert"]')).toBeTruthy();
    expect(host.textContent).toContain('cid-123');
  });

  it('emits retry', () => {
    const retry = vi.fn();
    component.retry.subscribe(retry);
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement).querySelector('button')?.click();

    expect(retry).toHaveBeenCalledTimes(1);
  });
});
