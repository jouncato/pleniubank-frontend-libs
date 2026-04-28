# @pleniu/loan-data-access

HTTP client services for the BIAN Lending Arrangement bounded context.

## Services

| Service | Responsibility |
|---|---|
| `LendingArrangementService` | CRUD + lifecycle transitions (activate, suspend, resume, close, amend) |
| `LoanServicingService` | Disbursement + payment application + payment history |
| `AmortizationScheduleService` | Generate and retrieve amortization schedule |
| `LendingCollateralService` | List, add, update, retire collaterals |
| `LendingFeeService` | List, add, update, retire contract fees |

## Configuration

Override the base URL via the `LOAN_API_BASE_URL` injection token (default: `/api/v1`):

```typescript
providers: [
  { provide: LOAN_API_BASE_URL, useValue: 'https://api.pleniu.co/v1' }
]
```

## Dependencies

- `@pleniu/loan-domain` — domain types and enums
- `@angular/common/http` — HttpClient
- `rxjs` — Observable

## Build order

`loan-domain` → `loan-data-access`
