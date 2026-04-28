import { LendingProductType } from '../enums/product-type';

export interface ArrangementExtension {
  readonly id: string;
  readonly version: number;
  readonly lendingArrangementId: string;
  readonly arrangementId: string;
  readonly productType: LendingProductType;
  readonly extensionSchemaVersion: number;
  readonly extensionData: Record<string, unknown>;
  readonly createdAt: string;
  readonly createdBy: string;
  readonly updatedAt?: string;
  readonly updatedBy?: string;
}
