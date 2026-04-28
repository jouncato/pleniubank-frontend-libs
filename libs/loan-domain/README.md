# @pleniu/loan-domain

BIAN Lending bounded context types shared across Pleniu frontends.

## Usage

```typescript
import {
  LendingArrangement,
  LendingStatus,
  canTransition,
  money,
  formatMoney,
} from '@pleniu/loan-domain';
```

## Exported Types

| Symbol | Kind | Source |
|--------|------|--------|
| `LendingArrangement` | Interface | Aggregate root |
| `ArrangementExtension` | Interface | Product-specific extension |
| `PartyRole` | Interface | Party role assignment |
| `AmortizationSchedule` | Interface | Installment schedule line |
| `Collateral` | Interface | Collateral backing |
| `ContractFee` | Interface | Fee configuration |
| `LendingStatus` | Enum | DRAFT, ACTIVE, SUSPENDED, CLOSED, DEFAULTED, WRITTEN_OFF |
| `LendingProductType` | Enum | PAYROLL_ADVANCE, PAYROLL_DEDUCTION, GENERIC, PERSONAL, MORTGAGE, INVOICE_FINANCING |
| `ProductType` | Alias | = LendingProductType (backward-compat) |
| `RateType` | Enum | FIXED, VARIABLE, COMPOUND |
| `DayCountConvention` | Enum | 30/360, ACT/360, ACT/365 |
| `RepaymentFrequency` | Enum | MONTHLY, BIWEEKLY, WEEKLY, BULLET |
| `PartyRoleType` | Enum | BORROWER, COBORROWER, GUARANTOR, EMPLOYER, PAYER |
| `PartyType` | Enum | NATURAL_PERSON, LEGAL_ENTITY |
| `AmortizationType` | Enum | FRENCH, GERMAN, AMERICAN, BALLOON, INTEREST_ONLY, CUSTOM |
| `AmortizationLineStatus` | Enum | PENDING, PARTIAL, PAID, OVERDUE, CANCELLED |
| `CollateralType` | Enum | PAYROLL_ASSIGNMENT, INVOICE, VEHICLE, REAL_ESTATE, GUARANTEE_LETTER, DEPOSIT, OTHER |
| `CollateralPerfectionStatus` | Enum | PENDING, PERFECTED, RELEASED, INVALID |
| `FeeType` | Enum | ORIGINATION, ADMIN, LATE, PREPAYMENT, DISBURSEMENT, STAMP, TAX |
| `ChargeFrequency` | Enum | ONE_TIME, MONTHLY, PER_EVENT |
| `FeeCalculationBasis` | Enum | FIXED, PERCENTAGE_PRINCIPAL, PERCENTAGE_OUTSTANDING, PERCENTAGE_PAYMENT |
| `Money` | Interface | { amount: string; currency: string } |
| `money()` | Factory | Validated Money constructor |
| `formatMoney()` | Util | Intl.NumberFormat wrapper |
| `isValidJurisdiction()` | Util | ISO 3166 jurisdiction validator |
| `canTransition()` | Util | LendingStatus state machine |
| `LENDING_STATUS_LABELS` | Const | Spanish labels for LendingStatus |

## Architecture

- Pure TypeScript — no Angular dependencies at runtime
- `amount` as `string` to avoid float precision loss (per SECURITY_CONTRACT)
- Follows ADR-001 (library boundary) and ADR-002 (barrel exports)
- Backend parity with `pleniubank-core/src/loan/domain/` (LB-ST-010)
