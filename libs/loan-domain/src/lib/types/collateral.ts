import { CollateralPerfectionStatus, CollateralType } from '../enums/collateral-type';

export interface Collateral {
  readonly id: string;
  readonly version: number;
  readonly lendingArrangementId: string;
  readonly arrangementId: string;
  readonly collateralType: CollateralType;
  readonly description?: string;
  readonly valueAmount?: string;
  readonly valueCurrency?: string;
  readonly valuationDate?: string;
  readonly perfectionStatus: CollateralPerfectionStatus;
  readonly perfectionRef?: string;
  readonly metadata: Record<string, unknown>;
  readonly releasedAt?: string;
  readonly createdAt: string;
  readonly createdBy: string;
  readonly updatedAt?: string;
  readonly updatedBy?: string;
}
