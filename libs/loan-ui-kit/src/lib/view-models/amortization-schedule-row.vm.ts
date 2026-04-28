import type { AmortizationSchedule } from '@pleniu/loan-domain';

export interface AmortizationScheduleRow {
  readonly installmentNumber: number;
  readonly dueDate: string;
  readonly capital: string;
  readonly interest: string;
  readonly total: string;
  readonly outstandingBalance: string;
  readonly status: string;
  readonly paidCapital: string;
  readonly paidInterest: string;
  readonly paidTotal: string;
  readonly fechaPago?: string;
  readonly paymentReference?: string;
}

export function toAmortizationRow(s: AmortizationSchedule): AmortizationScheduleRow {
  return {
    installmentNumber: s.numCuota,
    dueDate: s.fechaVencimiento,
    capital: s.capital,
    interest: s.interes,
    total: (Number(s.capital) + Number(s.interes)).toFixed(2),
    outstandingBalance: s.saldoInsoluto,
    status: s.status,
    paidCapital: s.paidCapital,
    paidInterest: s.paidInterest,
    paidTotal: s.paidTotal,
    fechaPago: s.fechaPago,
    paymentReference: s.paymentReference,
  };
}
