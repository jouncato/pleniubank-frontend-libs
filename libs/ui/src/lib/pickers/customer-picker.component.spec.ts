import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerPickerComponent } from './customer-picker.component';

describe('CustomerPickerComponent', () => {
  let fixture: ComponentFixture<CustomerPickerComponent>;
  let component: CustomerPickerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerPickerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerPickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('emits query only when the minimum length is reached', () => {
    const querySpy = vi.fn();
    component.queryChange.subscribe(querySpy);

    component.onQueryChange('J');
    component.onQueryChange('Ju');

    expect(querySpy).toHaveBeenCalledTimes(1);
    expect(querySpy).toHaveBeenCalledWith('Ju');
  });

  it('selects an option and emits its id', () => {
    const valueSpy = vi.fn();
    component.valueChange.subscribe(valueSpy);

    component.select({ id: 'customer-1', label: 'Juan Perez', description: 'CC 123' });

    expect(component.value).toBe('customer-1');
    expect(component.query).toBe('Juan Perez');
    expect(valueSpy).toHaveBeenCalledWith('customer-1');
  });

  it('accepts raw UUID input when enabled', () => {
    const valueSpy = vi.fn();
    component.valueChange.subscribe(valueSpy);

    component.onQueryChange('123e4567-e89b-12d3-a456-426614174000');

    expect(valueSpy).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
  });

  it('clears the selected value', () => {
    const valueSpy = vi.fn();
    component.value = 'customer-1';
    component.query = 'Juan Perez';
    component.valueChange.subscribe(valueSpy);

    component.clear();

    expect(component.value).toBeNull();
    expect(component.query).toBe('');
    expect(valueSpy).toHaveBeenCalledWith(null);
  });
});
