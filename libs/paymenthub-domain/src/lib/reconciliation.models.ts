export type PaymentHubReconciliationRecordStatus =
  | 'MATCHED'
  | 'MISMATCHED'
  | 'MISSING_IN_RAIL'
  | 'MISSING_IN_HUB';

export interface PaymentHubReconciliationRecord {
  paymentId?: string;
  railReference?: string;
  status?: PaymentHubReconciliationRecordStatus;
  settledAt?: string;
  amountSettled?: string;
  fees?: string;
  discrepancyDetails?: string;
}

export interface PaymentHubReconciliationReport {
  date?: string;
  totalPayments?: number;
  matched?: number;
  mismatched?: number;
  missingInRail?: number;
  missingInHub?: number;
  records?: PaymentHubReconciliationRecord[];
  generatedAt?: string;
}
