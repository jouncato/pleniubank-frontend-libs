import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { AmortizationScheduleTableComponent } from './amortization-schedule-table.component';
import type { AmortizationScheduleRow } from '../view-models/amortization-schedule-row.vm';

function makeRows(count: number): AmortizationScheduleRow[] {
  return Array.from({ length: count }, (_, i) => ({
    installmentNumber: i + 1,
    dueDate: `2025-0${(i % 9) + 1}-01`,
    capital: '100.00',
    interest: '10.00',
    total: '110.00',
    outstandingBalance: String(1000 - (i + 1) * 100),
    status: 'PENDING',
    paidCapital: '0.00',
    paidInterest: '0.00',
    paidTotal: '0.00',
  }));
}

@Component({
  standalone: true,
  imports: [AmortizationScheduleTableComponent],
  template: `
    <pleniu-amortization-schedule-table
      [rows]="rows"
      [currency]="currency"
      [pageable]="pageable"
      [pageSize]="pageSize"
    />
  `,
})
class TestHostComponent {
  rows: AmortizationScheduleRow[] = makeRows(12);
  currency = 'COP';
  pageable = true;
  pageSize = 12;
}

describe('AmortizationScheduleTableComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [TestHostComponent] }));

  it('renders 12 tbody rows', () => {
    const f = TestBed.createComponent(TestHostComponent);
    f.detectChanges();
    const rows = f.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(12);
  });

  it('tfoot shows correct totals', () => {
    const f = TestBed.createComponent(TestHostComponent);
    f.detectChanges();
    const tfootCells = f.nativeElement.querySelectorAll('tfoot td');
    expect(tfootCells.length).toBeGreaterThan(0);
  });

  it('pagination hidden when rows <= pageSize', () => {
    const f = TestBed.createComponent(AmortizationScheduleTableComponent);
    f.componentRef.setInput('rows', makeRows(12));
    f.componentRef.setInput('pageSize', 12);
    f.componentRef.setInput('pageable', true);
    f.detectChanges();
    const pagination = f.nativeElement.querySelector('pleniu-loan-pagination');
    expect(pagination).toBeNull();
  });

  it('pagination visible when rows > pageSize', () => {
    const f = TestBed.createComponent(AmortizationScheduleTableComponent);
    f.componentRef.setInput('rows', makeRows(60));
    f.componentRef.setInput('pageSize', 12);
    f.componentRef.setInput('pageable', true);
    f.detectChanges();
    const pagination = f.nativeElement.querySelector('pleniu-loan-pagination');
    expect(pagination).toBeTruthy();
  });

  it('visible rows limited to pageSize when pageable', () => {
    const f = TestBed.createComponent(AmortizationScheduleTableComponent);
    f.componentRef.setInput('rows', makeRows(60));
    f.componentRef.setInput('pageSize', 12);
    f.componentRef.setInput('pageable', true);
    f.detectChanges();
    const rows = f.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(12);
  });

  it('shows all rows when pageable=false', () => {
    const f = TestBed.createComponent(AmortizationScheduleTableComponent);
    f.componentRef.setInput('rows', makeRows(60));
    f.componentRef.setInput('pageSize', 12);
    f.componentRef.setInput('pageable', false);
    f.detectChanges();
    const rows = f.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(60);
  });
});
