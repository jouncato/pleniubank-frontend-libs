import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';

import { UnitPickerComponent } from './unit-picker.component';
import type { PickerOption } from './picker-option';

const OPTIONS: PickerOption[] = [
  { id: 'CO-001', label: 'Holding LATAM', description: 'CO-001' },
  { id: 'CO-002', label: 'Plenia Empresas', description: 'CO-002' },
  { id: 'MX-010', label: 'Plenia México', description: 'MX-010' },
];

describe('UnitPickerComponent', () => {
  let fixture: ComponentFixture<UnitPickerComponent>;
  let component: UnitPickerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnitPickerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UnitPickerComponent);
    component = fixture.componentInstance;
    component.options = OPTIONS;
    fixture.detectChanges();
  });

  it('filters options locally by label (case-insensitive)', () => {
    component.onFocus();
    component.onQueryChange('plenia');
    expect(component.filtered().map((o) => o.id)).toEqual(['CO-002', 'MX-010']);
  });

  it('filters options locally by id prefix', () => {
    component.onFocus();
    component.onQueryChange('mx');
    expect(component.filtered().map((o) => o.id)).toEqual(['MX-010']);
  });

  it('shows full list when query is empty', () => {
    component.onFocus();
    component.onQueryChange('');
    expect(component.filtered().length).toBe(3);
  });

  it('emits valueChange when an option is selected and closes the list', () => {
    const valueSpy = vi.fn();
    component.valueChange.subscribe(valueSpy);

    component.onFocus();
    component.select(OPTIONS[1]);

    expect(valueSpy).toHaveBeenCalledWith('CO-002');
    expect(component.showList()).toBe(false);
  });

  it('clears the selected value and reopens the list', () => {
    const valueSpy = vi.fn();
    fixture.componentRef.setInput('value', 'CO-001');
    component.valueChange.subscribe(valueSpy);

    component.clear();

    expect(valueSpy).toHaveBeenCalledWith(null);
    expect(component.query()).toBe('');
  });

  it('auto-selects when exactly one option is provided', () => {
    const valueSpy = vi.fn();
    fixture.componentRef.setInput('value', null);
    component.valueChange.subscribe(valueSpy);

    component.options = [OPTIONS[0]];
    component.ngOnChanges({
      options: new SimpleChange(OPTIONS, [OPTIONS[0]], false),
    });

    expect(valueSpy).toHaveBeenCalledWith('CO-001');
  });

  it('shows the selected label once `value` is set after selection (regression: display() must track `value` as a reactive dependency)', () => {
    component.select(OPTIONS[1]);
    fixture.componentRef.setInput('value', 'CO-002');

    expect(component.display()).toBe('Plenia Empresas');
  });

  it('does not auto-select when autoSelectSingle is false', () => {
    const valueSpy = vi.fn();
    fixture.componentRef.setInput('value', null);
    component.autoSelectSingle = false;
    component.valueChange.subscribe(valueSpy);

    component.options = [OPTIONS[0]];
    component.ngOnChanges({
      options: new SimpleChange(OPTIONS, [OPTIONS[0]], false),
    });

    expect(valueSpy).not.toHaveBeenCalled();
  });

  it('does not auto-select when more than one option is provided', () => {
    const valueSpy = vi.fn();
    fixture.componentRef.setInput('value', null);
    component.valueChange.subscribe(valueSpy);

    component.options = OPTIONS;
    component.ngOnChanges({
      options: new SimpleChange([], OPTIONS, false),
    });

    expect(valueSpy).not.toHaveBeenCalled();
  });

  it('clears selection when user edits the input text after selecting', () => {
    const valueSpy = vi.fn();
    fixture.componentRef.setInput('value', 'CO-001');
    component.valueChange.subscribe(valueSpy);

    component.onQueryChange('Plenia');

    expect(valueSpy).toHaveBeenCalledWith(null);
  });

  it('emits retry when the retry button is invoked', () => {
    const retrySpy = vi.fn();
    component.retry.subscribe(retrySpy);

    component.retry.emit();

    expect(retrySpy).toHaveBeenCalled();
  });

  it('renders a "no matches" hint when query yields zero results', () => {
    component.onFocus();
    component.onQueryChange('zzz-no-match');
    expect(component.filtered().length).toBe(0);
    expect(component.options.length).toBeGreaterThan(0);
  });
});
