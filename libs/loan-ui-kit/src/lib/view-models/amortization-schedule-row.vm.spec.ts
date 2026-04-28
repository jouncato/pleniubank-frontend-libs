import { AmortizationLineStatus, AmortizationType } from '@pleniu/loan-domain';
import type { AmortizationSchedule } from '@pleniu/loan-domain';
import { toAmortizationRow } from './amortization-schedule-row.vm';

const mockSchedule: AmortizationSchedule = {
  id: 'S-001',
  version: 1,
  isActive: true,
  validFrom: '2025-01-01',
  generatedForVersion: 1,
  amortizationType: AmortizationType.French,
  numCuota: 3,
  fechaVencimiento: '2025-04-01',
  capital: '300.00',
  interes: '30.00',
  lateFee: '0.00',
  saldoInsoluto: '700.00',
  status: AmortizationLineStatus.Pending,
  paidCapital: '0.00',
  paidInterest: '0.00',
  paidLateFee: '0.00',
  paidTotal: '0.00',
  createdAt: '2025-01-01T00:00:00Z',
  createdBy: 'admin',
};

describe('toAmortizationRow()', () => {
  it('maps numCuota → installmentNumber', () => {
    expect(toAmortizationRow(mockSchedule).installmentNumber).toBe(3);
  });

  it('maps fechaVencimiento → dueDate', () => {
    expect(toAmortizationRow(mockSchedule).dueDate).toBe('2025-04-01');
  });

  it('computes total = capital + interes', () => {
    const row = toAmortizationRow(mockSchedule);
    expect(Number(row.total)).toBeCloseTo(330.0, 2);
  });

  it('maps saldoInsoluto → outstandingBalance', () => {
    expect(toAmortizationRow(mockSchedule).outstandingBalance).toBe('700.00');
  });

  it('maps status', () => {
    expect(toAmortizationRow(mockSchedule).status).toBe(AmortizationLineStatus.Pending);
  });
});
