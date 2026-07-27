# standardize-core-data-access-contracts — Shared Core data-access contracts

## Why

The backoffice migration now consumes shared Core clients, but the shared library does not yet provide a reusable preflight policy for feature flags and unsafe mutation combinations, nor a uniform guarantee that identifier segments are encoded. HTTP contract tests also do not consistently cover the administrative error matrix, leaving the portal unable to close its migration gates without duplicating policy locally.

## What Changes

- Add a shared, typed preflight contract for feature-flag checks and known unsafe mutation combinations that completes synchronously before HTTP emission.
- Preserve Core as the final authority for authorization, state, concurrency, and business validation; frontend preflight failures must be distinguishable from Core responses.
- Centralize encoding of path identifiers in Core data-access clients and add reserved-character coverage.
- Extend shared-client `HttpTestingController` coverage for admin prefixes, methods, parameters, bodies, envelopes, and 403/404/409/422/5xx responses.
- Export only the reusable public APIs required by portal consumers and keep existing client methods backward compatible where possible.
- Provide evidence that auth, CSRF, correlation ID, tenant context, and external dependency error behavior remain unchanged.

## Capabilities

### New Capabilities

- `core-data-access-contracts`: Shared Core-client contracts for mutation preflight validation, encoded path identifiers, and consistent administrative HTTP behavior.

### Modified Capabilities

## Impact

- `libs/core-data-access`: client request construction, mutation preflight integration, and `HttpTestingController` suites.
- `libs/core-domain`: shared DTOs and typed validation/error contracts where required.
- `libs/shared-http` and `libs/shared-auth`: only if an existing public error or feature-flag contract must be extended; no duplicate mapper or auth path.
- `pleniubank-backoffice-portal`: consumer update after the library API is available; this change does not modify the portal directly.
- No backend endpoints, authorization rules, routes, ports, proxy defaults, or external service ownership change.
