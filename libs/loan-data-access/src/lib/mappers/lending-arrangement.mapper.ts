import type { LendingArrangement } from '@pleniu/loan-domain';
import { DayCountConvention, LendingStatus, ProductType, RateType, RepaymentFrequency, money } from '@pleniu/loan-domain';
import type {
  CreateLendingArrangementRequest,
  LendingArrangementResponse,
} from '../dtos/lending-arrangement.dto';

function asEnum<T extends string>(value: string, _enumObj: Record<string, string>): T {
  return value as T;
}

export function toDomain(dto: LendingArrangementResponse): LendingArrangement {
  return {
    arrangementId: dto.arrangement_id,
    version: dto.version,
    previousVersionId: dto.previous_version_id,
    productId: dto.product_id,
    productType: asEnum<ProductType>(dto.product_type, ProductType as unknown as Record<string, string>),
    customerId: dto.customer_id,
    companyCode: dto.company_code,
    jurisdiction: dto.jurisdiction,
    currency: dto.currency,
    principal: money(dto.principal_amount ?? '0', dto.currency ?? 'COP'),
    nominalRate: dto.nominal_rate != null ? Number(dto.nominal_rate) : undefined,
    rateType: asEnum<RateType>(dto.rate_type, RateType as unknown as Record<string, string>),
    dayCountConvention: asEnum<DayCountConvention>(dto.day_count_convention, DayCountConvention as unknown as Record<string, string>),
    repaymentFrequency: asEnum<RepaymentFrequency>(dto.repayment_frequency, RepaymentFrequency as unknown as Record<string, string>),
    termMonths: dto.term_months,
    effectiveDate: dto.effective_date,
    maturityDate: dto.maturity_date,
    channel: dto.channel as LendingArrangement['channel'],
    status: asEnum<LendingStatus>(dto.status, LendingStatus as unknown as Record<string, string>),
    statusReason: dto.status_reason,
    createdAt: dto.created_at,
    createdBy: dto.created_by ?? '',
    updatedAt: dto.updated_at,
    updatedBy: dto.updated_by,
    correlationId: dto.correlation_id,
  };
}

export function toCreateRequest(
  payload: Partial<LendingArrangement> & {
    borrowerPartyId?: string;
    employerPartyId?: string;
    coborrowerPartyIds?: string[];
    guarantorPartyIds?: string[];
    productType: ProductType;
    extensionData?: Record<string, unknown>;
  },
): CreateLendingArrangementRequest {
  return {
    product_id: payload.productId ?? '',
    product_type: payload.productType,
    customer_id: payload.customerId ?? '',
    borrower_party_id: payload.borrowerPartyId ?? payload.customerId ?? '',
    company_code: payload.companyCode,
    jurisdiction: payload.jurisdiction ?? '',
    currency: payload.currency ?? '',
    principal_amount: payload.principal?.amount ?? '0',
    nominal_rate: payload.nominalRate,
    rate_type: payload.rateType ?? RateType.Fixed,
    day_count_convention: payload.dayCountConvention ?? DayCountConvention.Act360,
    repayment_frequency: payload.repaymentFrequency ?? RepaymentFrequency.Monthly,
    term_months: payload.termMonths,
    effective_date: payload.effectiveDate ?? '',
    maturity_date: payload.maturityDate,
    channel: payload.channel,
    extension_data: payload.extensionData,
    employer_party_id: payload.employerPartyId,
    coborrower_party_ids: payload.coborrowerPartyIds,
    guarantor_party_ids: payload.guarantorPartyIds,
  };
}
