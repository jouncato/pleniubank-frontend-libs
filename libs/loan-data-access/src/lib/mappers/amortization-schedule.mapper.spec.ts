import { describe, expect, it } from 'vitest';
import { AmortizationLineStatus, AmortizationType } from '@pleniu/loan-domain';
import { amortizationToDomain } from './amortization-schedule.mapper';
import type { AmortizationScheduleResponse } from '../dtos/amortization-schedule.dto';

const mockDto: AmortizationScheduleResponse = {
  id: 'SCHED-001',
  version: 1,
  is_active: true,
  valid_from: '2025-01-01',
  valid_to: '2025-12-31',
  lending_arrangement_id: 'ARR-001',
  generated_for_version: 2,
  amortization_type: AmortizationType.French,
  num_cuota: 6,
  fecha_vencimiento: '2025-02-01',
  capital: '100000.00',
  interes: '1500.00',
  late_fee: '0.00',
  saldo_insoluto: '900000.00',
  status: AmortizationLineStatus.Pending,
  paid_capital: '0.00',
  paid_interest: '0.00',
  paid_late_fee: '0.00',
  paid_total: '0.00',
  created_at: '2025-01-01T00:00:00Z',
  created_by: 'system',
};

describe('amortizationToDomain()', () => {
  it('maps id, version, isActive', () => {
    const result = amortizationToDomain(mockDto);
    expect(result.id).toBe('SCHED-001');
    expect(result.version).toBe(1);
    expect(result.isActive).toBe(true);
  });

  it('maps validFrom and validTo', () => {
    const result = amortizationToDomain(mockDto);
    expect(result.validFrom).toBe('2025-01-01');
    expect(result.validTo).toBe('2025-12-31');
  });

  it('maps lendingArrangementId and generatedForVersion', () => {
    const result = amortizationToDomain(mockDto);
    expect(result.lendingArrangementId).toBe('ARR-001');
    expect(result.generatedForVersion).toBe(2);
  });

  it('maps amortizationType enum', () => {
    const result = amortizationToDomain(mockDto);
    expect(result.amortizationType).toBe(AmortizationType.French);
  });

  it('maps schedule line fields', () => {
    const result = amortizationToDomain(mockDto);
    expect(result.numCuota).toBe(6);
    expect(result.fechaVencimiento).toBe('2025-02-01');
    expect(result.capital).toBe('100000.00');
    expect(result.interes).toBe('1500.00');
    expect(result.lateFee).toBe('0.00');
    expect(result.saldoInsoluto).toBe('900000.00');
  });

  it('maps status enum', () => {
    const result = amortizationToDomain(mockDto);
    expect(result.status).toBe(AmortizationLineStatus.Pending);
  });

  it('maps payment fields', () => {
    const result = amortizationToDomain(mockDto);
    expect(result.paidCapital).toBe('0.00');
    expect(result.paidInterest).toBe('0.00');
    expect(result.paidLateFee).toBe('0.00');
    expect(result.paidTotal).toBe('0.00');
  });

  it('maps createdAt and createdBy', () => {
    const result = amortizationToDomain(mockDto);
    expect(result.createdAt).toBe('2025-01-01T00:00:00Z');
    expect(result.createdBy).toBe('system');
  });

  it('maps optional fields as undefined when absent', () => {
    const dto: AmortizationScheduleResponse = {
      ...mockDto,
      valid_to: undefined,
      lending_arrangement_id: undefined,
      fecha_pago: undefined,
      payment_applied_at: undefined,
      payment_reference: undefined,
      correlation_id: undefined,
      updated_at: undefined,
      updated_by: undefined,
    };
    const result = amortizationToDomain(dto);
    expect(result.validTo).toBeUndefined();
    expect(result.lendingArrangementId).toBeUndefined();
    expect(result.fechaPago).toBeUndefined();
    expect(result.paymentAppliedAt).toBeUndefined();
    expect(result.paymentReference).toBeUndefined();
    expect(result.correlationId).toBeUndefined();
    expect(result.updatedAt).toBeUndefined();
    expect(result.updatedBy).toBeUndefined();
  });

  it('maps optional fields when present', () => {
    const dto: AmortizationScheduleResponse = {
      ...mockDto,
      fecha_pago: '2025-02-05',
      payment_applied_at: '2025-02-05T10:00:00Z',
      payment_reference: 'PAY-REF-001',
      correlation_id: 'CORR-001',
      updated_at: '2025-02-06T00:00:00Z',
      updated_by: 'operator',
    };
    const result = amortizationToDomain(dto);
    expect(result.fechaPago).toBe('2025-02-05');
    expect(result.paymentAppliedAt).toBe('2025-02-05T10:00:00Z');
    expect(result.paymentReference).toBe('PAY-REF-001');
    expect(result.correlationId).toBe('CORR-001');
    expect(result.updatedAt).toBe('2025-02-06T00:00:00Z');
    expect(result.updatedBy).toBe('operator');
  });

  it('maps Paid status correctly', () => {
    const dto: AmortizationScheduleResponse = {
      ...mockDto,
      status: AmortizationLineStatus.Paid,
      paid_capital: '100000.00',
      paid_interest: '1500.00',
      paid_total: '101500.00',
    };
    const result = amortizationToDomain(dto);
    expect(result.status).toBe(AmortizationLineStatus.Paid);
    expect(result.paidCapital).toBe('100000.00');
    expect(result.paidTotal).toBe('101500.00');
  });
});
