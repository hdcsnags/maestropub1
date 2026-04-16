# Vulnerabilities and Security Notes

This document captures common vulnerability classes, project-specific risks, and recommended mitigations for Session 74.

## Scope

This file applies to:

- Application code
- API handlers
- Background jobs
- Data storage and serialization
- Authentication and authorization boundaries
- Developer tooling and documentation examples

It should be read alongside:

- `ARCHITECT.md`
- `README.md`
- Environment and deployment documentation
- Dependency management and CI configuration

## Security Principles

The project should follow these baseline principles:

1. Deny by default.
2. Validate all untrusted input.
3. Escape or encode output for its target context.
4. Use least privilege for services, users, and tokens.
5. Keep secrets out of source control.
6. Prefer safe framework defaults over custom security logic.
7. Log security-relevant events without exposing sensitive data.
8. Fail securely.
9. Keep dependencies updated and auditable.
10. Treat internal interfaces as potentially hostile when trust boundaries exist.

## Threat Model Summary

Likely attack surfaces include:

- Public HTTP endpoints
- Form and JSON input payloads
- Query parameters and route params
- File upload or import functionality
- Authentication flows
- Session or token handling
- Database queries and persistence logic
- Third-party integrations
- Admin-only features
- Build and deployment pipelines

Potential attacker goals:

- Exfiltrate user or system data
- Impersonate users or admins
- Execute unauthorized actions
- Corrupt or delete data
- Abuse compute, email, storage, or API quotas
- Inject malicious content into rendered pages or downstream systems
- Exploit supply-chain weaknesses

## Common Vulnerability Classes

### 1. Injection

Risks:

- SQL injection
- NoSQL injection
- Command injection
- Template injection
- Header injection
- Log injection

Mitigations:

- Use parameterized queries or ORM-safe query builders.
- Never concatenate untrusted input into database queries.
- Avoid shell invocation when a native API exists.
- If process execution is required, pass fixed commands and validated arguments.
- Sanitize values written to logs if they may contain line breaks or control characters.
- Avoid dynamic template evaluation from user-controlled strings.

## 2. Cross-Site Scripting (XSS)

Risks:

- Stored XSS from persisted content
- Reflected XSS from parameters
- DOM-based XSS in client-side rendering

Mitigations:

- Escape output based on rendering context: HTML, attribute, URL, script, CSS.
- Sanitize rich text with a maintained allowlist sanitizer.
- Avoid dangerous DOM APIs such as `innerHTML` unless sanitized.
- Use Content Security Policy where practical.
- Treat markdown rendering as untrusted unless explicitly sanitized.

## 3. Cross-Site Request Forgery (CSRF)

Risks:

- State-changing requests triggered from another origin

Mitigations:

- Use SameSite cookies where appropriate.
- Require CSRF tokens for cookie-authenticated state-changing requests.
- Prefer explicit authorization checks on all write operations.
- Reject unsafe methods without proper anti-CSRF defenses.

## 4. Broken Authentication

Risks:

- Weak password handling
- Token leakage
- Session fixation
- Insecure reset flows
- Missing MFA for privileged operations

Mitigations:

- Hash passwords with a modern password hashing algorithm.
- Expire and rotate reset tokens.
- Store tokens securely and avoid logging them.
- Invalidate sessions after critical account changes.
- Protect admin and sensitive operations with stronger auth controls.
- Rate-limit login and recovery endpoints.

## 5. Broken Access Control

Risks:

- Insecure direct object references
- Missing ownership checks
- Admin functionality exposed to non-admins
- Tenant boundary violations

Mitigations:

- Enforce authorization server-side for every protected action.
- Do not rely on hidden UI controls as authorization.
- Check resource ownership and tenant scope at the data access layer when possible.
- Use explicit role and permission models.
- Test negative authorization paths.

## 6. Sensitive Data Exposure

Risks:

- Secrets committed to source control
- Overly verbose logs
- Insecure storage of tokens or credentials
- Unencrypted transport
- Sensitive data in client-visible responses

Mitigations:

- Use environment variables or secret managers.
- Never commit production secrets.
- Redact credentials, tokens, API keys, and personal data from logs.
- Use TLS in transit.
- Minimize sensitive fields in API responses.
- Apply encryption at rest where required by risk or compliance needs.

## 7. Insecure Deserialization and Data Parsing

Risks:

- Unsafe parsing of complex objects
- Prototype pollution vectors
- Resource exhaustion from large payloads

Mitigations:

- Parse only expected formats.
- Validate payload schemas and enforce size limits.
- Avoid deserializing executable or class-bound data from untrusted sources.
- Use strict object handling and reject unexpected keys when appropriate.

## 8. File Upload and Path Handling

Risks:

- Malicious file uploads
- Path traversal
- Overwriting protected files
- Serving executable content from uploads

Mitigations:

- Validate file type by content and allowlist accepted formats.
- Rename uploaded files to generated identifiers.
- Store uploads outside executable paths when possible.
- Scan files when risk warrants it.
- Normalize and validate paths.
- Never trust user-supplied filenames.

## 9. Server-Side Request Forgery (SSRF)

Risks:

- Fetching attacker-controlled URLs
- Accessing internal metadata or private network resources

Mitigations:

- Restrict outbound requests to allowlisted domains or services.
- Reject private, loopback, link-local, and metadata IP ranges where not required.
- Re-resolve and validate redirects carefully.
- Use network-level egress controls in addition to application checks.

## 10. Security Misconfiguration

Risks:

- Debug mode enabled in production
- Verbose error traces
- Default credentials
- Unrestricted CORS
- Insecure cookie flags

Mitigations:

- Disable debug features in production.
- Return generic errors to clients.
- Set secure headers and cookie attributes.
- Review CORS per origin, method, and credential requirements.
- Harden deployment defaults and document required configuration.

## 11. Dependency and Supply-Chain Risk

Risks:

- Vulnerable transitive dependencies
- Typosquatting packages
- Malicious install scripts
- Unpinned or uncontrolled build inputs

Mitigations:

- Use lockfiles and trusted registries.
- Run dependency audits in CI.
- Review new dependencies before adoption.
- Update regularly with changelog review.
- Prefer maintained packages with active security practices.

## 12. Rate Limiting and Abuse Prevention

Risks:

- Credential stuffing
- Enumeration attacks
- API abuse and denial of wallet
- Spam or automated misuse

Mitigations:

- Apply rate limits to authentication, recovery, and high-cost endpoints.
- Use generic responses to avoid account enumeration.
- Add backoff, quotas, or challenge mechanisms where appropriate.
- Monitor abuse signals and alert on anomalies.

## 13. Denial of Service

Risks:

- Expensive queries
- Large request bodies
- Unbounded pagination
- Recursive or pathological parsing

Mitigations:

- Enforce request size limits and timeouts.
- Bound pagination and batch sizes.
- Optimize and index frequent queries.
- Reject malformed or excessive nested structures.
- Use queues or async processing for expensive operations.

## 14. Logging and Monitoring Gaps

Risks:

- Missing audit trails
- Sensitive data leakage in logs
- No visibility into auth failures or privilege changes

Mitigations:

- Log authentication events, permission failures, admin actions, and security-relevant changes.
- Redact or hash sensitive identifiers where feasible.
- Protect log integrity and access.
- Retain logs per operational and compliance requirements.

## 15. Cryptographic Misuse

Risks:

- Custom crypto
- Weak random generation
- Mismanaged keys
- Incorrect token signing or verification

Mitigations:

- Use established libraries and platform primitives.
- Use cryptographically secure randomness.
- Rotate keys and define key ownership.
- Verify token issuer, audience, algorithm, and expiry.
- Never invent a custom encryption or signature scheme.

## Project-Specific Review Checklist

Use this checklist during implementation and review:

- Are all external inputs schema-validated?
- Are all mutations protected by server-side authorization?
- Are database operations parameterized?
- Is user content rendered safely?
- Are secrets loaded only from secure configuration?
- Are session cookies marked `HttpOnly`, `Secure`, and appropriate `SameSite`?
- Are auth and recovery endpoints rate-limited?
- Are file operations path-safe and extension/content validated?
- Are third-party callbacks or webhooks verified?
- Are logs free from tokens, passwords, and personal data?
- Are production error responses sanitized?
- Are dependencies scanned in CI?
- Are admin actions auditable?
- Are outbound network calls constrained?
- Are tests present for authorization failures and malformed input?

## Secure Coding Requirements

Contributors should follow these requirements:

### Input Validation

- Validate shape, type, range, and length.
- Reject unexpected fields for sensitive operations.
- Normalize identifiers before comparison when appropriate.

### Output Safety

- Encode output at the final rendering boundary.
- Do not mix trusted templates with untrusted HTML.

### Authentication

- Centralize authentication handling.
- Do not implement ad hoc token parsing in multiple places.

### Authorization

- Check permissions close to the action being performed.
- Prefer reusable policy or guard functions.

### Error Handling

- Avoid leaking stack traces, SQL fragments, filesystem paths, or internal service names.
- Distinguish internal logs from client-facing responses.

### Secrets

- Do not include secrets in examples, tests, fixtures, or screenshots.
- Rotate any secret that is accidentally exposed.

## Review Guidance for Pull Requests

Security review is required when a change affects:

- Authentication or session logic
- Roles, permissions, or tenant scoping
- Database query construction
- File uploads or archive extraction
- HTML rendering or markdown rendering
- Network calls to user-specified destinations
- Secrets, environment loading, or deployment configuration
- Third-party integrations
- Build scripts or CI/CD pipelines

Reviewers should explicitly ask:

- What trust boundary is crossed here?
- Can an attacker control any part of this value?
- What prevents unauthorized access?
- What happens if this input is missing, oversized, malformed, or hostile?
- Could this expose data through errors, logs, caches, or metrics?

## Incident Response Notes

If a vulnerability is discovered:

1. Confirm scope and impact.
2. Reduce exposure immediately if a safe mitigation exists.
3. Rotate affected credentials or tokens.
4. Review logs for exploitation indicators.
5. Patch root cause, not only symptom.
6. Add regression tests.
7. Document the issue and remediation.

## Security Disclosure

If this project adopts a formal disclosure channel, document it here. Until then:

- Do not publish exploit details before maintainers can assess impact.
- Share reproduction steps privately with maintainers.
- Include affected versions, prerequisites, and suggested mitigations if known.

## Maintenance

This file should be updated when:

- New attack surfaces are introduced
- Auth or permission models change
- Deployment topology changes
- New storage or integration layers are added
- A real incident reveals missing guidance
