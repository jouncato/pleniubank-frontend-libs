# Design — standardize-core-data-access-contracts

## Context

The linked backoffice migration uses `core-data-access` as the Core HTTP boundary. Existing clients already centralize `ApiConfig`, administrative/public prefixes, `HttpParams`, and shared HTTP infrastructure, but coverage is uneven: mutation policies are not reusable, some path IDs are interpolated without encoding, and the service tests do not exercise the full administrative error matrix. The change must remain additive and preserve Core as the authority for authorization and state-dependent validation.

## Goals / Non-Goals

**Goals:**

- Define a typed preflight result/error contract that can be reused by mutation clients and portal view-models.
- Evaluate feature flags and explicitly known unsafe combinations before calling `HttpClient`.
- Make all path-segment IDs safe through one helper or equivalent client-level policy.
- Establish representative `HttpTestingController` coverage for request construction and normalized errors.
- Preserve the existing auth, CSRF, correlation ID, tenant, and external-service boundaries.

**Non-Goals:**

- No backend validation, authorization, endpoint, route, or response contract changes.
- No frontend-only replacement for Core authorization, current-state, concurrency, or risk decisions.
- No migration of every existing client in one change; the implementation will prioritize clients consumed by the backoffice migration and then apply the pattern incrementally.
- No new error mapper parallel to `shared-http` and no manual auth/header logic in clients.

## Decisions

### 1. Use a reusable preflight policy boundary

Introduce a small public policy contract in the shared libraries rather than embedding feature-specific conditions in each API service. A policy receives an operation identifier and typed mutation context and returns either an allowed result or a typed preventive failure. The API service evaluates this result before invoking `HttpClient`.

The preventive failure will carry a stable code and operation context but no sensitive payload. It will remain distinguishable from `ApiHttpError` returned by Core. `FeatureFlagService` remains the source of flag state; the new policy composes that state with operation rules and does not grant authorization.

**Alternative rejected:** form validators only. Form validators cannot protect non-form callers, retries, or programmatic mutations.

### 2. Encode path segments at the shared boundary

Add or standardize a helper for required path identifiers and use it whenever a client interpolates an ID into a URL segment. Query values continue to use `HttpParams`. Tests will include reserved characters such as `/`, `?`, `#`, and spaces to prove that IDs do not alter route structure.

**Alternative rejected:** asking every portal caller to pre-encode IDs. That duplicates policy and risks double encoding.

### 3. Test request construction and error normalization independently

For each prioritized client, `HttpTestingController` tests will assert method, complete URL, admin/public prefix, encoded path, query parameters, request body, and envelope response. Representative failures will assert that 403, 404, 409, 422, and 5xx responses remain available to the shared error mapper without exposing raw backend details.

Preventive policy tests will assert no pending request exists when a flag or unsafe combination blocks an operation. Client tests will separately assert that backend rejection is propagated and not converted into success.

### 4. Preserve cross-cutting HTTP providers

Clients continue using injected `HttpClient` and `ApiConfig`; auth, CSRF, correlation ID, tenant context, refresh, and telemetry remain provided by application-level interceptors. Tests will verify client construction does not add manual headers or bypass those providers.

## Risks / Trade-offs

- **A preflight rule can become stale** → Keep the rule set small, versioned, operation-specific, and subordinate to Core validation; add an explicit owner and test for each rule.
- **A shared policy can become a hidden global coupling point** → Export narrow interfaces and keep domain-specific request DTOs in their owning bounded context.
- **Encoding changes can expose mismatches with backend routing** → Add reserved-character tests and compare generated URLs with the actual Core route contract before rollout.
- **Error tests can assert implementation details** → Assert stable status/code/correlation behavior and user-safe mapping, not backend prose or private client internals.
- **Consumer/library drift can break the portal** → Build the linked backoffice against the change before updating its migration tasks; rollback is a dependency version/link revert.

## Migration Plan

1. Agree on operation names, preventive error codes, and ownership with the backoffice and Core teams.
2. Implement the public policy and path-encoding helpers with unit tests in `frontend-libs`.
3. Apply the helpers to prioritized Core clients and add the HTTP contract/error matrix tests.
4. Run all library builds/tests and the linked backoffice gate/suite.
5. Update the backoffice consumers to use the new preflight result only where the shared client exposes it; retain Core error handling for authoritative failures.
6. Roll back by reverting the library consumer update and the library release/link if a contract or route regression appears.

## Open Questions

- Which exact financial mutation operation identifiers and unsafe combinations are in scope for the first implementation wave?
- Should the preventive error be an `Error` subtype, an `Observable` error contract, or a discriminated result before existing Observable execution?
- Which existing clients still need path encoding after the initial prioritized inventory?
- Should 5xx test fixtures assert only status/error code, or also the correlation ID extraction contract already provided by `shared-http`?
