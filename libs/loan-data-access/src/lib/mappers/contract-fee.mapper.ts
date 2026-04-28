import type { ContractFee } from '@pleniu/loan-domain';
import { ChargeFrequency, FeeCalculationBasis, FeeType } from '@pleniu/loan-domain';
import type { ContractFeeResponse } from '../dtos/contract-fee.dto';

export function contractFeeToDomain(dto: ContractFeeResponse): ContractFee {
  return {
    id: dto.id,
    version: dto.version,
    lendingArrangementId: dto.lending_arrangement_id,
    arrangementId: dto.lending_arrangement_id,
    feeType: dto.fee_type as FeeType,
    calculationBasis: dto.calculation_basis as FeeCalculationBasis,
    amount: dto.amount,
    percentage: dto.percentage,
    currency: dto.currency,
    chargeFrequency: dto.charge_frequency as ChargeFrequency,
    effectiveFrom: dto.effective_from,
    effectiveTo: dto.effective_to,
    regulatoryRef: dto.regulatory_ref,
    metadata: dto.metadata,
    createdAt: dto.created_at,
    createdBy: dto.created_by,
    updatedAt: dto.updated_at,
    updatedBy: dto.updated_by,
  };
}
