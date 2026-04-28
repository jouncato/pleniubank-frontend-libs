import type { Collateral } from '@pleniu/loan-domain';
import { CollateralPerfectionStatus, CollateralType } from '@pleniu/loan-domain';
import type { CollateralResponse } from '../dtos/collateral.dto';

export function collateralToDomain(dto: CollateralResponse): Collateral {
  return {
    id: dto.id,
    version: dto.version,
    lendingArrangementId: dto.lending_arrangement_id,
    arrangementId: dto.lending_arrangement_id,
    collateralType: dto.collateral_type as CollateralType,
    description: dto.description,
    valueAmount: dto.value_amount,
    valueCurrency: dto.value_currency,
    valuationDate: dto.valuation_date,
    perfectionStatus: dto.perfection_status as CollateralPerfectionStatus,
    perfectionRef: dto.perfection_ref,
    metadata: dto.metadata,
    releasedAt: dto.released_at,
    createdAt: dto.created_at,
    createdBy: dto.created_by,
    updatedAt: dto.updated_at,
    updatedBy: dto.updated_by,
  };
}
