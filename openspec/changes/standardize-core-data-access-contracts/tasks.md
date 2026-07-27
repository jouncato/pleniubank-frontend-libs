# standardize-core-data-access-contracts — Implementation tasks

## 1. Contract and ownership

- [x] 1.1 Inventory prioritized Core mutation clients used by backoffice and name each operation, required feature flag, unsafe combination, owner, and expected preventive error code: financial accounting uses `financialAccounting`, treasury liquidity uses `treasuryLiquidity`, and Bre-B reconciliation uses `treasuryReconciliation`; no unverified unsafe combination was invented.
- [x] 1.2 Confirm the public boundary between `core-data-access`, `core-domain`, `shared-http`, and `shared-auth`; reuse `FeatureFlagService`, `ApiHttpError`/`mapHttpError`, and application interceptors without adding a second mapper or auth path.
- [x] 1.3 Define the first-wave operation matrix and reserved-character cases in the implementation: chart-of-accounts/custody/Bre-B IDs cover `/`, `?`, `#`, and spaces; Core remains authoritative for state and business validation.

## 2. Reusable preflight policy

- [x] 2.1 Define and export the typed preflight result/failure contract with stable codes and operation context, without sensitive payloads.
- [x] 2.2 Implement reusable feature-flag and unsafe-combination policy evaluation using `FeatureFlagService` state and operation rules; no default unsafe rule is asserted without an authoritative business contract.
- [x] 2.3 Integrate preflight into the prioritized financial mutation clients so blocked operations complete without invoking `HttpClient`.
- [x] 2.4 Add unit tests for enabled operations, disabled flags, unsafe combinations, and distinction from normalized Core HTTP errors.

## 3. Request construction and errors

- [x] 3.1 Implement or standardize one-time URL path-segment encoding for prioritized Core clients.
- [x] 3.2 Add reserved-character tests for account, custody, chart-of-accounts, and Bre-B prioritized identifiers; other client families remain in the follow-up inventory.
- [x] 3.3 Extend `HttpTestingController` tests for methods, admin/public prefixes, encoded paths, filters, pagination, bodies, and successful envelopes in the prioritized clients.
- [x] 3.4 Extend shared-client failure coverage for 403, 404, 409, 422, and 5xx responses, including correlation ID extraction and safe error mapping; `shared-http` covers the matrix and prioritized clients preserve authoritative Core errors.

## 4. Security and compatibility verification

- [x] 4.1 Verify prioritized clients do not add manual auth, CSRF, correlation ID, tenant, refresh, or telemetry headers; focused source audit found none and global interceptors remain authoritative.
- [x] 4.2 Verify external AI, Scoring, Identity, MUE, and mock-service boundaries remain owned by their existing clients and preserve their error behavior; this change only touches Core clients and shared error tests.
- [x] 4.3 Run library build and complete test suite, then build the linked backoffice and run its gate, negative tests, production build, and Angular suite; `pnpm run verify` passed in both repositories.
- [x] 4.4 Record request-contract, error, security-provider, and rollback evidence for the backoffice migration change in the linked backoffice matrix/guide and task evidence.

## 5. Consumer rollout and cleanup

- [x] 5.1 Update backoffice consumers to the new shared preflight contract only after the linked library API is available; COA and Bre-B consumers render typed preventive failures safely.
- [x] 5.2 Remove portal-side workarounds or duplicate validation only when the shared contract and consumer tests prove equivalent behavior; no duplicate HTTP/auth/error mapper was introduced.
- [x] 5.3 Update both repositories' matrices and OpenSpec task evidence; unresolved non-financial client families and QA rollout remain explicitly open in the backoffice change.
- [ ] 5.4 Publish the library change and validate the rollback by reverting the consumer dependency/link without changing routes, proxy defaults, ports, or service topology.
