# standardize-core-data-access-contracts — Implementation tasks

## 1. Contract and ownership

- [ ] 1.1 Inventory prioritized Core mutation clients used by backoffice and name each operation, required feature flag, unsafe combination, owner, and expected preventive error code.
- [ ] 1.2 Confirm the public boundary between `core-data-access`, `core-domain`, `shared-http`, and `shared-auth`; document which existing types and error mapper are reused.
- [ ] 1.3 Agree with Core/backoffice owners on the first-wave operation matrix and reserved-character identifier cases before changing client URLs.

## 2. Reusable preflight policy

- [ ] 2.1 Define and export the typed preflight result/failure contract with stable codes and operation context, without sensitive payloads.
- [ ] 2.2 Implement reusable feature-flag and unsafe-combination policy evaluation using `FeatureFlagService` state and operation rules.
- [ ] 2.3 Integrate preflight into the prioritized financial mutation clients so blocked operations complete without invoking `HttpClient`.
- [ ] 2.4 Add unit tests for enabled operations, disabled flags, unsafe combinations, and distinction from normalized Core HTTP errors.

## 3. Request construction and errors

- [ ] 3.1 Implement or standardize one-time URL path-segment encoding for prioritized Core clients.
- [ ] 3.2 Add reserved-character tests for account, customer, evaluation, loan, payroll-advance, and other prioritized identifiers.
- [ ] 3.3 Extend `HttpTestingController` tests for methods, admin/public prefixes, encoded paths, filters, pagination, bodies, and successful envelopes.
- [ ] 3.4 Extend shared-client failure coverage for 403, 404, 409, 422, and 5xx responses, including correlation ID extraction and safe error mapping.

## 4. Security and compatibility verification

- [ ] 4.1 Verify prioritized clients do not add manual auth, CSRF, correlation ID, tenant, refresh, or telemetry headers.
- [ ] 4.2 Verify external AI, Scoring, Identity, MUE, and mock-service boundaries remain owned by their existing clients and preserve their error behavior.
- [ ] 4.3 Run library build and complete test suite, then build the linked backoffice and run its gate, negative tests, production build, and Angular suite.
- [ ] 4.4 Record request-contract, error, security-provider, and rollback evidence for the backoffice migration change.

## 5. Consumer rollout and cleanup

- [ ] 5.1 Update backoffice consumers to the new shared preflight contract only after the linked library API is available.
- [ ] 5.2 Remove portal-side workarounds or duplicate validation only when the shared contract and consumer tests prove equivalent behavior.
- [ ] 5.3 Update both repositories' matrices and OpenSpec task evidence; keep unresolved clients or rollout environments explicitly open.
- [ ] 5.4 Publish the library change and validate the rollback by reverting the consumer dependency/link without changing routes, proxy defaults, ports, or service topology.
