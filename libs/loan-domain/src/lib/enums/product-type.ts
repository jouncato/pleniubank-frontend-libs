export enum LendingProductType {
  PayrollAdvance = 'PAYROLL_ADVANCE',
  PayrollDeduction = 'PAYROLL_DEDUCTION',
  Generic = 'GENERIC',
  Personal = 'PERSONAL',
  Mortgage = 'MORTGAGE',
  InvoiceFinancing = 'INVOICE_FINANCING',
}

/** Alias for backward-compatibility with HU spec naming. */
export type ProductType = LendingProductType;
export const ProductType = LendingProductType;
