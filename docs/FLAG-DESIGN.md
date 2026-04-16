# Feature Flag Design

## Purpose

This document defines a simple, consistent feature flag design for Session 74. It is intended to fit the project architecture described in `ARCHITECT.md` and to give product, backend, frontend, and operations teams a shared model for introducing, evaluating, and retiring flags safely.

The design goals are:

- keep flag behavior predictable across modules
- separate configuration from business logic
- support local development, test, and production environments
- allow safe rollout, rollback, and cleanup
- avoid permanent accumulation of stale flags

## Scope

This design covers:

- runtime feature flags used by application code
- environment-specific configuration
- request-scoped evaluation where applicable
- testing and observability expectations
- lifecycle management and retirement

This design does not attempt to define:

- vendor-specific SaaS flag tooling
- experimentation statistics
- UI-specific A/B test methodology
- secrets management beyond normal project configuration practices

## Architectural Fit

Per the project architecture, documentation and implementation should preserve clear boundaries between:

- domain logic
- application or service orchestration
- infrastructure and configuration
- presentation or API surfaces

Feature flags should follow those same boundaries.

### Core rule

Business logic must not directly read raw environment variables or ad hoc config values. Instead, application code should depend on a flag evaluation interface exposed by the application layer.

This ensures:

- consistent behavior across modules
- easier testing with deterministic flag states
- simpler migration if the backing store changes
- reduced coupling between domain code and infrastructure concerns

## Guiding Principles

1. **Flags are temporary by default**  
   A feature flag is a delivery mechanism, not a permanent permissions system unless explicitly designed as one.

2. **Safe default behavior**  
   Every flag must define a default state that is safe for the environment where it runs.

3. **Centralized evaluation contract**  
   The project should expose one standard way to evaluate flags.

4. **Typed meaning over stringly usage**  
   Avoid scattered string literals for flag keys in business code.

5. **Request-aware when needed**  
   If targeting depends on user, tenant, region, or request metadata, evaluation should accept explicit context.

6. **Observable changes**  
   Flag-driven behavior should be traceable through logs, metrics, or audit events where appropriate.

7. **Retire aggressively**  
   Flags should be removed once a rollout is complete or abandoned.

## Flag Categories

Different categories of flags have different expectations.

### 1. Release flags

Used to gradually expose incomplete or newly delivered functionality.

Characteristics:

- short lived
- usually boolean
- often default off until rollout
- should be removed after launch stabilizes

Examples:

- enabling a new workflow
- switching traffic to a new handler
- exposing a new UI path

### 2. Operational flags

Used to reduce risk or control system behavior during incidents.

Characteristics:

- can remain longer than release flags
- may be toggled quickly by operators
- often guard expensive integrations or non-critical paths

Examples:

- disabling a third-party integration
- turning off background enrichment
- forcing a fallback code path

### 3. Permission or entitlement flags

Used to enable behavior for specific accounts, tenants, or plans.

Characteristics:

- may be long lived
- should be treated more like product configuration than temporary release control
- should have clear ownership and durable semantics

Examples:

- premium-only feature access
- beta access for specific tenants
- region-scoped capability enablement

### 4. Experiment flags

Used to support controlled experiments.

Characteristics:

- usually request-scoped
- often include variant assignment
- require stronger analytics discipline
- must not silently become permanent release flags

Examples:

- control vs variant experience
- ranking model selection
- alternate onboarding flow

## Recommended Data Model

The project should treat a feature flag definition as metadata plus a runtime state.

Suggested conceptual fields:

- `key`: unique stable identifier
- `type`: `boolean` or `variant`
- `category`: release, operational, entitlement, experiment
- `description`: concise human-readable summary
- `owner`: team or individual responsible
- `created_at`: creation date
- `expires_at`: expected retirement date
- `default`: safe fallback value
- `tags`: optional labels such as module, domain, or incident-related

For variant flags, include:

- `variants`: allowed values
- `rollout_strategy`: deterministic assignment rules

## Naming Convention

Flag names should be explicit, stable, and scoped.

Recommended format:

`<area>.<capability>.<intent>`

Examples:

- `billing.invoice_pdf.release`
- `search.ranking_model.v2`
- `auth.magic_link.enabled`
- `integration.crm.sync_disabled`

Naming guidance:

- use lowercase
- use dot-separated segments
- avoid negated names when possible
- prefer domain-oriented naming over implementation details
- avoid ambiguous version labels unless they matter operationally

Prefer:

- `checkout.new_summary.enabled`

Avoid:

- `use_new_thing`
- `feature_x`
- `disable_old_checkout_unless_beta`

## Evaluation Model

Flags should be evaluated through a single abstraction.

Example conceptual interface:

- `isEnabled(flagKey, context?) -> boolean`
- `getVariant(flagKey, context?) -> string`
- `getSnapshot(context?) -> flag state view`

### Evaluation context

A request or execution context may include:

- user id
- tenant id
- account plan
- region
- environment
- request id
- actor role
- application version

Context should be:

- explicit, not pulled implicitly from global state where avoidable
- minimal, containing only fields needed for targeting
- serializable for logging and test fixtures where useful

### Resolution order

A predictable order is critical. Recommended resolution order:

1. hardcoded emergency overrides if the system is in safe mode
2. environment or deployment-level overrides
3. remote or persisted flag configuration
4. targeting rules based on context
5. default value from the flag definition

If a provider fails, the evaluator must degrade safely to the default value and emit observability signals.

## Layer Responsibilities

To align with the architecture, responsibilities should be split clearly.

### Domain layer

- may depend on semantic decisions supplied by the application layer
- should not know where flags come from
- should not parse environment variables or targeting rules

Preferred pattern:

- application service evaluates the relevant flags
- domain service receives concrete behavior inputs or policy objects

### Application layer

- owns the flag evaluation contract
- translates request or job context into evaluation context
- orchestrates behavior based on flag state
- can expose feature-policy objects to the domain layer

### Infrastructure layer

- reads environment variables, config files, or remote providers
- implements caching, polling, fallback, and provider clients
- records diagnostics about evaluation failures

### Interface layer

- passes identity, tenant, request, or locale data into evaluation context
- should not implement business targeting rules itself

## Configuration Sources

The design supports multiple configuration sources as long as they adhere to the same evaluation contract.

### 1. Static local configuration

Suitable for:

- local development
- CI
- deterministic integration tests
- early project stages

Examples:

- environment variables
- local config files
- test fixtures

### 2. Deployment configuration

Suitable for:

- environment-wide release gates
- operational kill switches
- staged rollout by environment

Examples:

- container environment settings
- config maps
- deployment manifests

### 3. Remote provider or datastore

Suitable for:

- dynamic rollout without redeploy
- tenant targeting
- operator-controlled toggles
- experiments

Examples:

- database-backed flag table
- managed feature flag service
- internal config service

## Environment Strategy

Each environment should have documented defaults.

### Local development

- defaults should optimize developer productivity
- local overrides should be easy to set
- deterministic behavior is preferred over dynamic rollout

### Test and CI

- tests should explicitly set flag states
- avoid dependence on shared mutable remote configuration
- integration suites should verify both enabled and disabled paths for important flags

### Staging

- should closely mirror production behavior
- useful for validating targeting logic and operational overrides
- should not accumulate staging-only semantics that differ from production without reason

### Production

- safe defaults required
- changes should be observable
- critical kill switches must be documented and easy to locate

## Rollout Patterns

### Boolean rollout

The simplest rollout path:

1. ship code behind default-off flag
2. test in local and staging with flag enabled
3. enable for internal users or low-risk tenants
4. increase rollout gradually
5. remove dead code after stabilization

### Percentage rollout

If supported, percentage-based rollout should be deterministic for a stable unit such as:

- user id
- tenant id
- account id

Do not use nondeterministic per-request randomness for user-facing features, because that causes inconsistent experiences.

### Targeted rollout

Enable by explicit segments such as:

- internal staff
- allowlisted tenants
- region
- plan tier
- app version

Targeting rules should remain understandable. If rules become complex, the flag may be masking a product configuration problem and should be redesigned.

### Kill switch

For risky external dependencies or expensive operations, include operational flags that can immediately force:

- a no-op path
- fallback behavior
- degraded mode
- queue suspension

Kill switches must be documented with expected user impact.

## Caching and Freshness

If a remote provider is used, caching rules should be explicit.

Recommended guidance:

- cache reads for a short, documented interval
- use background refresh where possible
- define behavior for stale reads
- make defaults safe if refresh fails

Considerations:

- request-scoped consistency matters more than perfect freshness for many flows
- incident response may require lower cache TTLs for operational flags
- long-lived workers may need explicit refresh behavior

## Failure Handling

Feature flag evaluation must fail safely.

### Failure modes

- provider unavailable
- malformed configuration
- unknown flag key
- invalid targeting context
- cache corruption or stale state

### Expected behavior

- use the flag definition default
- log a structured warning or error as appropriate
- emit metrics for evaluation failures
- avoid crashing request paths due to non-critical flag errors

Unknown flag keys should generally be treated as a development error. In production, they should degrade safely while surfacing diagnostics.

## Testing Strategy

Feature flags often create hidden branching. Testing must keep that branching explicit.

### Unit tests

- inject a fake or in-memory flag evaluator
- test both enabled and disabled paths for meaningful behavior changes
- avoid dependence on global process environment when unit testing business logic

### Integration tests

- verify module wiring with realistic flag sources
- cover fallback behavior when providers fail
- validate request-context targeting for critical flows

### End-to-end tests

- use stable fixtures and deterministic flag states
- avoid flaky tests caused by dynamic rollout percentages

### Contract tests

If there are multiple flag providers, ensure they conform to the same evaluation semantics, especially for:

- default resolution
- missing keys
- targeting precedence
- variant selection

## Observability

Observability is required for safe rollout and incident handling.

### Logs

Emit structured logs when:

- a critical flag is evaluated in a sensitive path
- a provider fails
- a fallback default is used unexpectedly
- an operator changes an operational flag, if the system supports auditing

Avoid excessive logging on hot paths. Prefer sampled or aggregated logs for frequently evaluated flags.

### Metrics

Useful metrics include:

- evaluation count by flag key
- fallback count by flag key
- provider error count
- cache refresh latency
- enabled vs disabled distribution for rollout verification

### Tracing

For critical requests, it can be useful to attach a compact flag snapshot or selected flag annotations to traces, especially when debugging rollout issues.

## Security and Privacy

Feature flag systems must not become an unreviewed side channel for sensitive data.

Guidelines:

- do not store secrets in flag values
- minimize personal data in targeting context
- prefer stable opaque identifiers over emails or names
- ensure auditability for production changes where operational impact is high
- apply least-privilege access to flag administration tools

## Ownership and Governance

Each flag must have a clear owner.

Minimum governance requirements:

- owner team or individual
- documented purpose
- expected expiry or review date
- category classification
- rollout plan for risky features
- cleanup plan before general availability or cancellation

### Review questions before adding a flag

- Is a flag necessary, or would normal configuration suffice?
- Is this a temporary release flag or a durable entitlement rule?
- What is the safe default?
- What happens if the provider is down?
- How will we test both states?
- When will this flag be removed?

## Lifecycle

A flag should move through a defined lifecycle.

### 1. Proposal

Document:

- purpose
- owner
- category
- default state
- targeting needs
- expected removal date

### 2. Implementation

- add the definition in the central registry or definitions module
- wire evaluation through the application layer
- add tests for both states
- add observability if operationally significant

### 3. Rollout

- start with limited exposure
- monitor logs and metrics
- document production changes
- keep emergency rollback path clear

### 4. Stabilization

- confirm the feature behaves correctly at intended rollout level
- remove obsolete fallback behavior if no longer needed
- decide whether the flag is still temporary or should become durable configuration

### 5. Retirement

- remove code branches guarded by the flag
- remove definition and config
- update docs and operational runbooks
- verify cleanup in all environments

## Anti-Patterns

Avoid the following.

### Permanent dead branches

Flags left in place long after rollout increase complexity and risk.

### Nested flag logic

Stacking multiple flags inside the same code path can create behavior that is impossible to reason about or test.

### Flags inside low-level utilities

Generic helpers should not secretly branch on feature state. Prefer higher-level orchestration decisions.

### Direct environment checks in business code

This breaks architectural boundaries and complicates tests.

### Reusing one flag for multiple meanings

A flag should have one clear purpose. If semantics change, create a new flag.

### Negatively named flags

Names like `disable_x` often cause confusion in code and operational usage. Prefer positive naming unless the flag is truly an emergency kill switch.

## Suggested Minimal Standard for Session 74

If the project is early-stage or intentionally lightweight, the following baseline is sufficient:

1. a central flag definitions file or module
2. a single evaluator interface
3. an in-memory and environment-backed implementation
4. explicit test helpers for setting flag state
5. owner and expiry metadata for every new flag
6. a documented removal step in the delivery checklist

This baseline can later be extended to a remote provider without changing domain code.

## Example Decision Flow

A typical request should follow this pattern:

1. interface layer extracts actor and tenant context
2. application service builds evaluation context
3. application service queries flag evaluator
4. application service selects behavior or policy
5. domain logic executes with concrete inputs
6. infrastructure provider handles config retrieval and fallback
7. observability records failures or important state changes

## Documentation Expectations

Whenever a new significant flag is introduced, document:

- key name
- category
- owner
- default value
- rollout plan
- monitoring expectations
- expiry target
- cleanup trigger

This can live in team docs, release notes, or a dedicated registry, but it must be discoverable.

## Summary

Feature flags in Session 74 should be:

- centrally defined
- evaluated through a standard application-facing contract
- isolated from domain and infrastructure coupling
- safe by default
- tested in both states
- observable in production
- retired quickly when no longer needed

A disciplined feature flag design supports fast delivery without turning the codebase into a maze of hidden runtime branches.