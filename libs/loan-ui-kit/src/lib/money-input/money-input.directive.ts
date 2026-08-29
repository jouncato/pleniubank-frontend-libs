import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  SimpleChanges,
  forwardRef,
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import {
  formatMoneyInput,
  isCanonicalMoneyAmountValid,
  isMoneyInputValid,
  normalizeMoneyInput,
} from '@pleniu/loan-domain';

@Directive({
  selector: 'input[moneyInput]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MoneyInputDirective),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => MoneyInputDirective),
      multi: true,
    },
  ],
})
export class MoneyInputDirective implements ControlValueAccessor, Validator, OnChanges {
  @Input() moneyCurrency = 'COP';
  @Input() moneyLocale = 'es-CO';
  @Input() allowNegative = false;
  @Input() moneyInputEnabled = true;

  private modelValue = '';
  private disabled = false;
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;
  private onValidatorChange: () => void = () => undefined;

  constructor(private readonly elementRef: ElementRef<HTMLInputElement>) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['moneyCurrency'] || changes['moneyLocale'] || changes['moneyInputEnabled']) {
      if (this.moneyInputEnabled) {
        this.modelValue = normalizeMoneyInput(this.modelValue, this.moneyCurrency, this.moneyLocale);
      }
      this.render();
      this.onValidatorChange();
    }
  }

  writeValue(value: string | number | null | undefined): void {
    this.modelValue = this.moneyInputEnabled
      ? normalizeMoneyInput(value, this.moneyCurrency, this.moneyLocale)
      : String(value ?? '');
    this.render();
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.elementRef.nativeElement.disabled = isDisabled;
  }

  validate(control: AbstractControl): ValidationErrors | null {
    if (!this.moneyInputEnabled) return null;
    const value = String(control.value ?? '');
    if (!isCanonicalMoneyAmountValid(value, this.moneyCurrency, this.moneyLocale)) {
      return { moneyPrecision: true };
    }
    if (!this.allowNegative && value.startsWith('-')) {
      return { negativeMoney: true };
    }
    return null;
  }

  @HostListener('input', ['$event'])
  handleInput(event: Event): void {
    if (this.disabled) return;
    const input = event.target as HTMLInputElement;
    if (!this.moneyInputEnabled) {
      this.modelValue = input.value;
      this.onChange(input.value);
      return;
    }
    const caret = input.selectionStart ?? input.value.length;
    const digitsBeforeCaret = (input.value.slice(0, caret).match(/\d/g) ?? []).length;
    const rawIsValid = isMoneyInputValid(input.value, this.moneyCurrency, this.moneyLocale);
    const normalized = normalizeMoneyInput(input.value, this.moneyCurrency, this.moneyLocale);
    this.modelValue = normalized;
    this.onChange(normalized);

    if (!rawIsValid || !isCanonicalMoneyAmountValid(normalized, this.moneyCurrency, this.moneyLocale)) {
      return;
    }
    this.render();
    this.restoreCaret(digitsBeforeCaret);
  }

  @HostListener('blur')
  handleBlur(): void {
    if (this.disabled) return;
    if (this.moneyInputEnabled) {
      this.modelValue = normalizeMoneyInput(this.modelValue, this.moneyCurrency, this.moneyLocale);
    }
    this.onChange(this.modelValue);
    this.render();
    this.onTouched();
  }

  private render(): void {
    const input = this.elementRef.nativeElement;
    if (!this.moneyInputEnabled) {
      input.value = this.modelValue;
      return;
    }
    if (
      !this.modelValue
      || !isCanonicalMoneyAmountValid(this.modelValue, this.moneyCurrency, this.moneyLocale)
    ) {
      input.value = this.modelValue;
      return;
    }
    input.value = formatMoneyInput(this.modelValue, this.moneyCurrency, this.moneyLocale);
  }

  private restoreCaret(digitsBeforeCaret: number): void {
    const input = this.elementRef.nativeElement;
    let digitCount = 0;
    let position = input.value.length;
    for (let index = 0; index < input.value.length; index += 1) {
      if (/\d/.test(input.value[index])) {
        digitCount += 1;
        if (digitCount === digitsBeforeCaret) {
          position = index + 1;
          break;
        }
      }
    }
    input.setSelectionRange(position, position);
  }
}
