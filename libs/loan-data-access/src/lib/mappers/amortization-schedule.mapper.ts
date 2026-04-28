import type { AmortizationSchedule } from '@pleniu/loan-domain';
import { AmortizationLineStatus, AmortizationType } from '@pleniu/loan-domain';
import type { AmortizationScheduleResponse } from '../dtos/amortization-schedule.dto';

export function amortizationToDomain(dto: AmortizationScheduleResponse): AmortizationSchedule {
  return {
    id: dto.id,
    version: dto.version,
    isActive: dto.is_active,
    validFrom: dto.valid_from,
    validTo: dto.valid_to,
    lendingArrangementId: dto.lending_arrangement_id,
    generatedForVersion: dto.generated_for_version,
    amortizationType: dto.amortization_type as AmortizationType,
    numCuota: dto.num_cuota,
    fechaVencimiento: dto.fecha_vencimiento,
    capital: dto.capital,
    interes: dto.interes,
    lateFee: dto.late_fee,
    saldoInsoluto: dto.saldo_insoluto,
    status: dto.status as AmortizationLineStatus,
    fechaPago: dto.fecha_pago,
    paidCapital: dto.paid_capital,
    paidInterest: dto.paid_interest,
    paidLateFee: dto.paid_late_fee,
    paidTotal: dto.paid_total,
    paymentAppliedAt: dto.payment_applied_at,
    paymentReference: dto.payment_reference,
    correlationId: dto.correlation_id,
    createdAt: dto.created_at,
    createdBy: dto.created_by,
    updatedAt: dto.updated_at,
    updatedBy: dto.updated_by,
  };
}
