import { describe, expect, it } from 'vitest';
import { ChargeFrequency, FeeCalculationBasis, FeeType } from '@pleniu/loan-domain';
import { contractFeeToDomain } from './contract-fee.mapper';
import type { ContractFeeResponse } from '../dtos/contract-fee.dto';

const mockDto: ContractFeeResponse = {
  id: 'FEE-001',
  version: 1,
  lending_arrangement_id: 'ARR-001',
  fee_type: FeeType.Origination,
  calculation_basis: FeeCalculationBasis.Fixed,
  amount: '50000.00',
  percentage: undefined,
  currency: 'COP',
  charge_frequency: ChargeFrequency.OneTime,
  effective_from: '2025-01-01',
  effective_to: '2025-12-31',
  regulatory_ref: 'SFC-2024-001',
  metadata: { source: 'core' },
  created_at: '2025-01-01T00:00:00Z',
  created_by: 'system',
};

describe('contractFeeToDomain()', () => {
  it('maps id and version', () => {
    const result = contractFeeToDomain(mockDto);
    expect(result.id).toBe('FEE-001');
    expect(result.version).toBe(1);
  });

  it('maps lendingArrangementId and arrangementId from same field', () => {
    const result = contractFeeToDomain(mockDto);
    expect(result.lendingArrangementId).toBe('ARR-001');
    expect(result.arrangementId).toBe('ARR-001');
  });

  it('maps feeType enum', () => {
    const result = contractFeeToDomain(mockDto);
    expect(result.feeType).toBe(FeeType.Origination);
  });

  it('maps calculationBasis enum', () => {
    const result = contractFeeToDomain(mockDto);
    expect(result.calculationBasis).toBe(FeeCalculationBasis.Fixed);
  });

  it('maps amount, currency, chargeFrequency', () => {
    const result = contractFeeToDomain(mockDto);
    expect(result.amount).toBe('50000.00');
    expect(result.currency).toBe('COP');
    expect(result.chargeFrequency).toBe(ChargeFrequency.OneTime);
  });

  it('maps effectiveFrom and effectiveTo', () => {
    const result = contractFeeToDomain(mockDto);
    expect(result.effectiveFrom).toBe('2025-01-01');
    expect(result.effectiveTo).toBe('2025-12-31');
  });

  it('maps regulatoryRef', () => {
    const result = contractFeeToDomain(mockDto);
    expect(result.regulatoryRef).toBe('SFC-2024-001');
  });

  it('maps metadata as-is', () => {
    const result = contractFeeToDomain(mockDto);
    expect(result.metadata).toEqual({ source: 'core' });
  });

  it('maps createdAt and createdBy', () => {
    const result = contractFeeToDomain(mockDto);
    expect(result.createdAt).toBe('2025-01-01T00:00:00Z');
    expect(result.createdBy).toBe('system');
  });

  it('maps percentage-based fee without amount', () => {
    const dto: ContractFeeResponse = {
      ...mockDto,
      fee_type: FeeType.Admin,
      calculation_basis: FeeCalculationBasis.PercentagePrincipal,
      amount: undefined,
      percentage: '2.5',
      charge_frequency: ChargeFrequency.Monthly,
    };
    const result = contractFeeToDomain(dto);
    expect(result.feeType).toBe(FeeType.Admin);
    expect(result.calculationBasis).toBe(FeeCalculationBasis.PercentagePrincipal);
    expect(result.amount).toBeUndefined();
    expect(result.percentage).toBe('2.5');
    expect(result.chargeFrequency).toBe(ChargeFrequency.Monthly);
  });

  it('maps optional fields as undefined when absent', () => {
    const dto: ContractFeeResponse = {
      ...mockDto,
      amount: undefined,
      percentage: undefined,
      effective_to: undefined,
      regulatory_ref: undefined,
      updated_at: undefined,
      updated_by: undefined,
    };
    const result = contractFeeToDomain(dto);
    expect(result.amount).toBeUndefined();
    expect(result.percentage).toBeUndefined();
    expect(result.effectiveTo).toBeUndefined();
    expect(result.regulatoryRef).toBeUndefined();
    expect(result.updatedAt).toBeUndefined();
    expect(result.updatedBy).toBeUndefined();
  });

  it('maps optional fields when present', () => {
    const dto: ContractFeeResponse = {
      ...mockDto,
      updated_at: '2025-03-01T00:00:00Z',
      updated_by: 'manager',
    };
    const result = contractFeeToDomain(dto);
    expect(result.updatedAt).toBe('2025-03-01T00:00:00Z');
    expect(result.updatedBy).toBe('manager');
  });

  it('maps Late fee with PerEvent frequency', () => {
    const dto: ContractFeeResponse = {
      ...mockDto,
      fee_type: FeeType.Late,
      charge_frequency: ChargeFrequency.PerEvent,
    };
    const result = contractFeeToDomain(dto);
    expect(result.feeType).toBe(FeeType.Late);
    expect(result.chargeFrequency).toBe(ChargeFrequency.PerEvent);
  });
});
