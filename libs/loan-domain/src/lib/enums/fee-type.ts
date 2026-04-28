export enum FeeType {
  Origination = 'ORIGINATION',
  Admin = 'ADMIN',
  Late = 'LATE',
  Prepayment = 'PREPAYMENT',
  Disbursement = 'DISBURSEMENT',
  Stamp = 'STAMP',
  Tax = 'TAX',
}

export enum ChargeFrequency {
  OneTime = 'ONE_TIME',
  Monthly = 'MONTHLY',
  PerEvent = 'PER_EVENT',
}
