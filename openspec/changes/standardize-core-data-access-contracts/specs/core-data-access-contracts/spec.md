# core-data-access-contracts — Shared Core data-access contracts

## ADDED Requirements

### Requirement: Shared mutation preflight

Prioritized Core mutation clients SHALL evaluate a reusable typed preflight policy before emitting an HTTP request. The policy MUST combine the operation's feature-flag requirements and known unsafe-combination rules without replacing Core authorization or state validation.

#### Scenario: Feature flag blocks a mutation before HTTP

- **WHEN** a prioritized mutation requires a disabled shared feature flag
- **THEN** the client returns a typed preventive failure with a stable code
- **AND** no HTTP request is emitted
- **AND** the failure is distinguishable from an HTTP error returned by Core

#### Scenario: Known unsafe combination blocks a mutation before HTTP

- **WHEN** a prioritized mutation contains a known incompatible combination of typed inputs or flags
- **THEN** the client returns the canonical preventive failure
- **AND** `HttpTestingController` has no pending request for the operation

#### Scenario: Backend remains authoritative

- **WHEN** a mutation passes local preflight but Core rejects it because of authorization, current state, concurrency, or a business rule
- **THEN** the shared client propagates the normalized Core error
- **AND** the client does not convert the rejection into a successful result

### Requirement: Safe path identifier encoding

Core data-access clients SHALL encode every required identifier inserted into a URL path segment exactly once. Query parameters MUST continue to be serialized through `HttpParams` or the equivalent shared request builder.

#### Scenario: Reserved characters remain inside one path segment

- **WHEN** a client receives an identifier containing `/`, `?`, `#`, spaces, or other reserved characters
- **THEN** the generated request URL contains the encoded identifier as one segment
- **AND** no additional route segment or query parameter is created

#### Scenario: Existing ordinary identifiers preserve the route

- **WHEN** a client receives an ordinary identifier without reserved characters
- **THEN** it sends the same endpoint path as the existing Core contract
- **AND** no double encoding is applied

### Requirement: Administrative request contract coverage

Prioritized shared clients SHALL have `HttpTestingController` tests that verify the complete request contract, including HTTP method, administrative or public prefix, encoded path segments, filters, pagination, request bodies, and successful envelope data.

#### Scenario: Filtered administrative list

- **WHEN** a client loads a prioritized administrative list with filters or pagination
- **THEN** the test asserts the expected method and complete URL
- **AND** the test asserts each serialized parameter and the typed envelope response

#### Scenario: Typed administrative mutation

- **WHEN** a client sends a prioritized create, update, approve, reject, execute, or retry operation
- **THEN** the test asserts the expected method, encoded path, and typed body
- **AND** the test asserts the envelope data returned to the consumer

### Requirement: Shared administrative error behavior

Prioritized shared clients SHALL preserve normalized error behavior for HTTP 403, 404, 409, 422, and 5xx responses, including correlation ID extraction where supplied by the shared HTTP mapper. Tests MUST verify that raw backend details are not required by the client contract.

#### Scenario: Permission and not-found errors

- **WHEN** Core returns 403 or 404 for a shared-client operation
- **THEN** the consumer receives the normalized status and stable error code when provided
- **AND** the client does not treat the operation as successful

#### Scenario: Conflict and validation errors

- **WHEN** Core returns 409 or 422 for a shared-client mutation
- **THEN** the consumer receives the normalized conflict or validation error
- **AND** the request response remains available to the canonical user-facing error resolver

#### Scenario: Server error with correlation ID

- **WHEN** Core or its proxy returns a 5xx response with an envelope correlation ID
- **THEN** the normalized error preserves the correlation ID for telemetry/support
- **AND** user-facing mapping does not expose raw internal details

### Requirement: Cross-cutting security providers remain external to clients

Shared Core clients SHALL continue to rely on application-provided authentication, CSRF, correlation ID, tenant-context, refresh, and telemetry infrastructure. Clients MUST NOT add parallel token storage, manual security headers, or external-service URL ownership.

#### Scenario: Authenticated shared-client request

- **WHEN** an application invokes a shared Core client under the normal provider configuration
- **THEN** the existing interceptors provide authentication, CSRF, correlation ID, and tenant context according to their current strategy
- **AND** the client itself does not construct those headers

#### Scenario: External dependency boundary is unchanged

- **WHEN** a portal uses an AI, Scoring, Identity, MUE, or mock-service owner outside Core
- **THEN** the dependency continues using its existing proprietary client and error behavior
- **AND** the Core client contract does not absorb or rewrite that external boundary
