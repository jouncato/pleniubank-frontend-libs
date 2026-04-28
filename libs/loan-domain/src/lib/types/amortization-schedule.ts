import { AmortizationLineStatus } from '../enums/amortization-line-status';
import { AmortizationType } from '../enums/amortization-type';

export interface AmortizationSchedule {
  readonly id: string;
  readonly version: number;
  readonly isActive: boolean;
  readonly validFrom: string;
  readonly validTo?: string;

  readonly lendingArrangementId?: string;
  readonly generatedForVersion: number;
  readonly amortizationType: AmortizationType;

  readonly numCuota: number;
  readonly fechaVencimiento: string;
  readonly capital: string;
  readonly interes: string;
  readonly lateFee: string;
  readonly saldoInsoluto: string;

  readonly status: AmortizationLineStatus;

  readonly fechaPago?: string;
  readonly paidCapital: string;
  readonly paidInterest: string;
  readonly paidLateFee: string;
  readonly paidTotal: string;
  readonly paymentAppliedAt?: string;
  readonly paymentReference?: string;
  readonly correlationId?: string;

  readonly createdAt: string;
  readonly createdBy: string;
  readonly updatedAt?: string;
  readonly updatedBy?: string;
}
