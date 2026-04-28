export enum CollateralType {
  PayrollAssignment = 'PAYROLL_ASSIGNMENT',
  Invoice = 'INVOICE',
  Vehicle = 'VEHICLE',
  RealEstate = 'REAL_ESTATE',
  GuaranteeLetter = 'GUARANTEE_LETTER',
  Deposit = 'DEPOSIT',
  Other = 'OTHER',
}

export enum CollateralPerfectionStatus {
  Pending = 'PENDING',
  Perfected = 'PERFECTED',
  Released = 'RELEASED',
  Invalid = 'INVALID',
}
