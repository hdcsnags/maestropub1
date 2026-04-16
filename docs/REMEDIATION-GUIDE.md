# Remediation Guide

This guide describes how to identify, triage, fix, validate, and document issues in Session 74.

It is intended for maintainers, contributors, reviewers, and incident responders working across the repository. The goal is to make remediation predictable, auditable, and low-risk.

## Objectives

- Restore correct behavior quickly.
- Minimize regressions and blast radius.
- Preserve architectural boundaries defined by the project.
- Produce clear documentation for future operators.
- Leave the system in a better state than before the issue.

## Guiding Principles

### 1. Fix the cause, not only the symptom
Temporary mitigations are acceptable during active incidents, but the underlying cause must be identified and tracked to closure.

### 2. Prefer small, reversible changes
A narrowly scoped remediation is easier to review, test, and roll back than a broad refactor performed under pressure.

### 3. Respect module boundaries
Apply fixes in the correct layer. Do not patch around broken abstractions in unrelated modules if the problem belongs elsewhere.

### 4. Preserve compatibility where possible
If behavior changes are required, document them clearly and update tests, examples, and release notes.

### 5. Validate before and after
Every remediation should include:
- reproduction of the issue,
- proof of the fix,
- regression coverage,
- operational verification where applicable.

## Severity Levels

Use the following severity model to prioritize remediation work.

### Critical
Use when one or more of the following are true:
- data loss or corruption is occurring,
- a security boundary is broken,
- core workflows are unavailable,
- the issue impacts most users or production systems.

Target response:
- immediate triage,
- mitigation first if needed,
- root-cause fix as soon as safely possible,
- post-incident review required.

### High
Use when:
- important features are degraded,
- there is significant user impact,
- there is elevated operational risk,
- workarounds are difficult or unsafe.

Target response:
- prioritize in current work cycle,
- implement fix with focused review,
- add regression tests before closure.

### Medium
Use when:
- the issue affects non-critical paths,
- workarounds exist,
- impact is limited in scope or frequency.

Target response:
- schedule into planned remediation work,
- fix with standard review and validation.

### Low
Use when:
- impact is cosmetic or minor,
- there is little operational risk,
- the issue does not materially affect correctness.

Target response:
- batch with maintenance work,
- still document if behavior was incorrect.

## Issue Intake Checklist

Before implementing a fix, collect the following:

- issue summary,
- affected module or component,
- current observed behavior,
- expected behavior,
- steps to reproduce,
- environment details,
- severity and user impact,
- known workarounds,
- first known bad version or change,
- logs, traces, screenshots, or error samples,
- owner and reviewer.

Recommended issue template:

```text
Title:
Severity:
Affected area:
Environment:
Observed behavior:
Expected behavior:
Reproduction steps:
Frequency:
Impact:
Workaround:
Suspected cause:
Related changes/issues:
Validation plan:
```

## Remediation Workflow

Follow this sequence unless an incident requires emergency handling.

### Step 1: Confirm and Reproduce
- Verify the issue is real and current.
- Reproduce locally or in a safe test environment.
- Reduce the reproduction to the smallest reliable case.
- Capture evidence before changing code.

Deliverables:
- reproducible steps,
- failing test or recorded failing scenario,
- notes on scope and frequency.

### Step 2: Contain Blast Radius
If the issue is active in production or affecting shared environments:
- disable the affected path if safe,
- apply feature flags or configuration guards,
- limit access to risky operations,
- communicate known impact and temporary workarounds.

Containment is not closure. Track follow-up work explicitly.

### Step 3: Identify Root Cause
Use evidence rather than assumption.

Useful techniques:
- compare known good vs bad revisions,
- inspect recent changes in the affected module,
- review logs and metrics around failure events,
- trace data flow across boundaries,
- check assumptions at interfaces,
- verify configuration, environment, and dependency versions.

Document:
- direct cause,
- contributing factors,
- why safeguards did not catch it.

### Step 4: Design the Fix
Choose the smallest complete fix that resolves the root cause.

A good remediation plan answers:
- which layer owns the correction,
- whether behavior changes externally,
- whether a migration is needed,
- whether backward compatibility is preserved,
- what test coverage will prove correctness,
- how the change will be rolled out safely.

### Step 5: Implement
During implementation:
- keep changes scoped to the issue,
- avoid opportunistic refactors unless necessary,
- update tests in the same change,
- preserve readability and existing conventions,
- add comments only where logic would otherwise be unclear.

### Step 6: Validate
Validation should include as applicable:
- unit tests,
- integration tests,
- end-to-end tests,
- manual verification of the original reproduction,
- negative tests for edge cases,
- performance checks if timing or scale is affected,
- security validation if access, trust, or input handling changed.

### Step 7: Review and Merge
Reviewers should verify:
- root cause is addressed,
- fix is placed in the right architectural layer,
- tests meaningfully cover the problem,
- risk of regression is acceptable,
- documentation and operational notes are updated.

### Step 8: Release and Monitor
After deployment:
- monitor logs, metrics, and alerts,
- re-run critical workflows,
- confirm the incident signal has cleared,
- watch for adjacent regressions.

### Step 9: Close and Learn
Before closing the issue:
- document what happened,
- link the fix,
- record validation evidence,
- identify any follow-up hardening tasks,
- create a postmortem for High or Critical issues when warranted.

## Architecture-Aware Remediation

Follow the architecture of the repository as defined in `ARCHITECT.md`.

General rules:
- Apply business-rule fixes in domain logic, not in presentation or transport layers.
- Apply API contract fixes at the boundary where data enters or leaves the system.
- Apply persistence fixes in data-access code, not by scattering storage-specific checks elsewhere.
- Apply UI-only fixes in the UI layer unless domain behavior is actually wrong.
- Do not introduce cross-module coupling to avoid a targeted fix.
- Prefer explicit interfaces and adapters over direct reach-through into internals.

If a bug seems to require touching multiple unrelated layers, pause and confirm whether:
- the abstraction boundary is wrong,
- the ownership of logic is unclear,
- the issue should be split into a remediation plus a separate refactor.

## Common Remediation Categories

### Logic Defect
Symptoms:
- wrong output,
- invalid branching,
- edge-case failures,
- incorrect state transitions.

Approach:
- reproduce with minimal inputs,
- identify the violated invariant,
- encode that invariant in tests,
- fix the logic at the owning layer.

### Validation Defect
Symptoms:
- malformed input accepted,
- invalid states created,
- errors appearing later in the workflow.

Approach:
- validate at boundaries,
- return or surface clear errors,
- avoid duplicating validation in every downstream consumer.

### Data or Persistence Defect
Symptoms:
- duplicate records,
- missing data,
- schema mismatches,
- stale reads,
- migration failures.

Approach:
- confirm data shape and assumptions,
- review migrations and backward compatibility,
- add safeguards for nullability, uniqueness, and transactional integrity,
- prepare recovery steps if data repair is required.

### Concurrency or Ordering Defect
Symptoms:
- race conditions,
- intermittent failures,
- out-of-order updates,
- non-deterministic tests.

Approach:
- reproduce under load or repeated execution,
- identify shared mutable state,
- enforce ordering, idempotency, or locking where appropriate,
- test for repeatability.

### Performance Regression
Symptoms:
- slow requests,
- elevated resource consumption,
- timeouts,
- degraded throughput.

Approach:
- compare baseline and regression,
- profile before changing code,
- fix the dominant bottleneck,
- verify no correctness tradeoffs were introduced.

### Security Defect
Symptoms:
- unauthorized access,
- unsafe input handling,
- secret exposure,
- broken trust assumptions.

Approach:
- contain exposure immediately,
- restrict disclosure while remediation is in progress,
- fix root cause,
- rotate affected secrets or credentials if applicable,
- add tests and defense-in-depth controls.

## Validation Matrix

Use this matrix when deciding what evidence a fix requires.

| Change Type | Unit Tests | Integration Tests | Manual Verification | Rollout Monitoring |
| --- | --- | --- | --- | --- |
| Pure logic fix | Required | Recommended | Optional | Recommended |
| API contract fix | Required | Required | Recommended | Recommended |
| Persistence fix | Required | Required | Recommended | Required |
| UI presentation fix | Recommended | Optional | Required | Optional |
| Security fix | Required | Required | Required | Required |
| Performance fix | Required | Recommended | Recommended | Required |

## Safe Rollout Practices

For higher-risk changes, use one or more of the following:
- feature flags,
- staged deployment,
- canary release,
- read-only or shadow mode,
- backward-compatible schema changes before code cutover,
- kill switch or rapid rollback path.

Before deployment, ensure:
- release notes are prepared,
- operational owners are informed,
- dashboards or logs exist to confirm behavior,
- rollback instructions are known.

## Rollback Guidance

Rollback is appropriate when:
- the fix introduces new user-facing failures,
- risk is increasing faster than confidence,
- validation signals are inconclusive under production load,
- the remediation depends on follow-up work that is not ready.

Before rollback, assess:
- whether data written by the new version is backward compatible,
- whether schema changes are reversible,
- whether partial rollback creates mixed-version hazards,
- whether a mitigation is safer than immediate reversal.

Document rollback decisions and outcomes.

## Data Repair Guidance

If the issue affected persisted data, code changes alone may not be sufficient.

Data remediation should include:
- criteria for identifying affected records,
- a dry-run plan,
- backup or snapshot strategy if applicable,
- idempotent repair logic where possible,
- validation queries before and after,
- audit record of what was changed.

Never run destructive repair steps without:
- explicit review,
- tested recovery procedure,
- confirmation of environment target.

## Documentation Requirements

Every completed remediation should update documentation as needed.

Possible documentation updates:
- behavior or API docs,
- configuration docs,
- migration notes,
- troubleshooting guides,
- changelog or release notes,
- postmortem records.

At minimum, record:
- what was wrong,
- why it happened,
- what fixed it,
- how it was validated,
- what future maintainers should watch for.

## Reviewer Checklist

Use this checklist during code review.

- [ ] The issue is reproduced or otherwise demonstrated.
- [ ] The proposed fix addresses the root cause.
- [ ] The change is in the correct architectural layer.
- [ ] Scope is appropriate and avoids unrelated modifications.
- [ ] Tests fail before the fix and pass after it, where practical.
- [ ] Edge cases and error paths are covered.
- [ ] Backward compatibility impact is understood.
- [ ] Operational rollout and rollback considerations are documented.
- [ ] User-facing or developer-facing documentation is updated.
- [ ] Follow-up work is tracked separately if needed.

## Incident Remediation Template

```text
Incident/Issue:
Date detected:
Severity:
Owner:
Affected components:

Summary:

Impact:

Root cause:

Contributing factors:

Mitigation applied:

Permanent fix:

Validation performed:
- Unit tests:
- Integration tests:
- Manual verification:
- Monitoring checks:

Rollback plan:

Follow-up actions:
- 
- 
```

## Anti-Patterns to Avoid

Do not:
- patch symptoms in multiple places without identifying ownership,
- silence errors without preserving observability,
- merge emergency fixes without retrospective validation,
- combine large refactors with urgent remediations,
- skip tests because the bug appears obvious,
- rely on manual verification alone for repeatable defects,
- leave temporary mitigations undocumented.

## Definition of Done

A remediation is complete when all of the following are true:
- the issue is understood well enough to explain the cause,
- the correct layer contains the fix,
- the original failure is no longer reproducible,
- regression tests or equivalent safeguards are in place,
- deployment risk has been considered,
- documentation is updated,
- follow-up actions, if any, are tracked explicitly.

## Quick Reference

### Fast path for low-risk defects
1. Reproduce.
2. Add or identify a failing test.
3. Implement minimal fix.
4. Validate locally and in CI.
5. Update docs if behavior changed.
6. Merge and monitor.

### Fast path for production incidents
1. Triage severity and impact.
2. Contain or mitigate.
3. Communicate status.
4. Reproduce and identify root cause.
5. Implement smallest safe fix.
6. Validate in a controlled environment.
7. Deploy with monitoring.
8. Confirm recovery.
9. Complete post-incident documentation.

## Final Note

Good remediation is disciplined, not hurried. Speed matters, but clarity, validation, and respect for architecture matter more. A strong fix resolves today’s issue while reducing the chance of tomorrow’s recurrence.
