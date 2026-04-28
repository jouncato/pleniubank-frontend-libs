import { LendingStatus } from '../enums/lending-status';
import { ProductType } from '../enums/product-type';
import { RateType } from '../enums/rate-type';
import { DayCountConvention } from '../enums/day-count-convention';
import { RepaymentFrequency } from '../enums/repayment-frequency';
import { Money } from '../value-objects/money';

export interface LendingArrangement {
  readonly arrangementId: string;
  readonly version: number;
  readonly previousVersionId?: string;

  readonly productId: string;
  readonly productType: ProductType;
  readonly customerId: string;
  readonly companyCode?: string;

  readonly jurisdiction: string;
  readonly currency: string;
  readonly principal: Money;
  readonly nominalRate?: number;
  readonly rateType: RateType;
  readonly dayCountConvention: DayCountConvention;
  readonly repaymentFrequency: RepaymentFrequency;
  readonly termMonths?: number;
  readonly effectiveDate: string;
  readonly maturityDate?: string;
  readonly channel?: 'WEB' | 'MOBILE' | 'BRANCH' | 'API';

  readonly status: LendingStatus;
  readonly statusReason?: string;

  readonly createdAt: string;
  readonly createdBy: string;
  readonly updatedAt?: string;
  readonly updatedBy?: string;
  readonly correlationId?: string;
}
