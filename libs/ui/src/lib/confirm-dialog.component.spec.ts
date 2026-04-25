import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmDialogComponent } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  let component: ConfirmDialogComponent;
  let fixture: ComponentFixture<ConfirmDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
    component.title = 'Terminar contrato';
    component.body = 'Vas a terminar este contrato.';
  });

  it('renders an accessible alert dialog when open', () => {
    component.open = true;
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const dialog = host.querySelector('[role="alertdialog"]');

    expect(dialog).toBeTruthy();
    expect(dialog?.getAttribute('aria-labelledby')).toBe(component.titleId);
    expect(dialog?.getAttribute('aria-describedby')).toBe(component.descriptionId);
  });

  it('focuses cancel by default to avoid accidental confirmation', () => {
    component.open = true;
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const cancel = host.querySelector<HTMLButtonElement>('.pb-confirm-dialog__cancel');

    expect(document.activeElement).toBe(cancel);
  });

  it('emits confirm and cancel actions', () => {
    component.open = true;
    const confirm = vi.fn();
    const cancel = vi.fn();
    component.confirm.subscribe(confirm);
    component.cancel.subscribe(cancel);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    host.querySelector<HTMLButtonElement>('.pb-confirm-dialog__confirm')?.click();
    host.querySelector<HTMLButtonElement>('.pb-confirm-dialog__cancel')?.click();

    expect(confirm).toHaveBeenCalledTimes(1);
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it('emits cancel on Escape', () => {
    component.open = true;
    const cancel = vi.fn();
    component.cancel.subscribe(cancel);
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(cancel).toHaveBeenCalledTimes(1);
  });
});
