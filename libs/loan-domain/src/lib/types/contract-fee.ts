import { FeeCalculationBasis } from '../enums/fee-calculation-basis';
import { ChargeFrequency, FeeType } from '../enums/fee-type';

export interface ContractFee {
  readonly id: string;
  readonly version: number;
  readonly lendingArrangementId: string;
  readonly arrangementId: string;
  readonly feeType: FeeType;
  readonly calculationBasis: FeeCalculationBasis;
  readonly amount?: string;
  readonly percentage?: string;
  readonly currency: string;
  readonly chargeFrequency: ChargeFrequency;
  readonly effectiveFrom: string;
  readonly effectiveTo?: string;
  readonly regulatoryRef?: string;
  readonly metadata: Record<string, unknown>;
  readonly createdAt: string;
  readonly createdBy: string;
  readonly updatedAt?: string;
  readonly updatedBy?: string;
}
