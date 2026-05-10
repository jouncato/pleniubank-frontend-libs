import { describe, expect, it } from 'vitest';
import { CollateralPerfectionStatus, CollateralType } from '@pleniu/loan-domain';
import { collateralToDomain } from './collateral.mapper';
import type { CollateralResponse } from '../dtos/collateral.dto';

const mockDto: CollateralResponse = {
  id: 'COL-001',
  version: 1,
  lending_arrangement_id: 'ARR-001',
  collateral_type: CollateralType.RealEstate,
  description: 'Urban property in Bogotá',
  value_amount: '250000000.00',
  value_currency: 'COP',
  valuation_date: '2025-01-15',
  perfection_status: CollateralPerfectionStatus.Perfected,
  perfection_ref: 'REG-1234',
  metadata: { registry: 'notaría 5' },
  released_at: undefined,
  created_at: '2025-01-01T00:00:00Z',
  created_by: 'system',
};

describe('collateralToDomain()', () => {
  it('maps id, version', () => {
    const result = collateralToDomain(mockDto);
    expect(result.id).toBe('COL-001');
    expect(result.version).toBe(1);
  });

  it('maps lendingArrangementId and arrangementId from same field', () => {
    const result = collateralToDomain(mockDto);
    expect(result.lendingArrangementId).toBe('ARR-001');
    expect(result.arrangementId).toBe('ARR-001');
  });

  it('maps collateralType enum', () => {
    const result = collateralToDomain(mockDto);
    expect(result.collateralType).toBe(CollateralType.RealEstate);
  });

  it('maps description and value fields', () => {
    const result = collateralToDomain(mockDto);
    expect(result.description).toBe('Urban property in Bogotá');
    expect(result.valueAmount).toBe('250000000.00');
    expect(result.valueCurrency).toBe('COP');
    expect(result.valuationDate).toBe('2025-01-15');
  });

  it('maps perfectionStatus enum and perfectionRef', () => {
    const result = collateralToDomain(mockDto);
    expect(result.perfectionStatus).toBe(CollateralPerfectionStatus.Perfected);
    expect(result.perfectionRef).toBe('REG-1234');
  });

  it('maps metadata as-is', () => {
    const result = collateralToDomain(mockDto);
    expect(result.metadata).toEqual({ registry: 'notaría 5' });
  });

  it('maps createdAt and createdBy', () => {
    const result = collateralToDomain(mockDto);
    expect(result.createdAt).toBe('2025-01-01T00:00:00Z');
    expect(result.createdBy).toBe('system');
  });

  it('maps optional fields as undefined when absent', () => {
    const dto: CollateralResponse = {
      ...mockDto,
      description: undefined,
      value_amount: undefined,
      value_currency: undefined,
      valuation_date: undefined,
      perfection_ref: undefined,
      released_at: undefined,
      updated_at: undefined,
      updated_by: undefined,
    };
    const result = collateralToDomain(dto);
    expect(result.description).toBeUndefined();
    expect(result.valueAmount).toBeUndefined();
    expect(result.valueCurrency).toBeUndefined();
    expect(result.valuationDate).toBeUndefined();
    expect(result.perfectionRef).toBeUndefined();
    expect(result.releasedAt).toBeUndefined();
    expect(result.updatedAt).toBeUndefined();
    expect(result.updatedBy).toBeUndefined();
  });

  it('maps optional fields when present', () => {
    const dto: CollateralResponse = {
      ...mockDto,
      released_at: '2025-06-01T00:00:00Z',
      updated_at: '2025-02-01T00:00:00Z',
      updated_by: 'manager',
    };
    const result = collateralToDomain(dto);
    expect(result.releasedAt).toBe('2025-06-01T00:00:00Z');
    expect(result.updatedAt).toBe('2025-02-01T00:00:00Z');
    expect(result.updatedBy).toBe('manager');
  });

  it('maps Pending perfection status', () => {
    const dto: CollateralResponse = {
      ...mockDto,
      perfection_status: CollateralPerfectionStatus.Pending,
    };
    const result = collateralToDomain(dto);
    expect(result.perfectionStatus).toBe(CollateralPerfectionStatus.Pending);
  });

  it('maps Vehicle collateral type', () => {
    const dto: CollateralResponse = {
      ...mockDto,
      collateral_type: CollateralType.Vehicle,
    };
    const result = collateralToDomain(dto);
    expect(result.collateralType).toBe(CollateralType.Vehicle);
  });
});
