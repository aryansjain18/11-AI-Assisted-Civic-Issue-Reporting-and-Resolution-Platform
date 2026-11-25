# 07 — Security and Privacy

## Security baseline
- Enforce authorization server-side, not only in the UI.
- Apply least privilege.
- Validate and normalize untrusted input.
- Use parameterized queries or safe data-access APIs.
- Protect against XSS, injection, CSRF where applicable, and insecure direct object references.
- Rate-limit abuse-prone endpoints where supported.
- Do not leak secrets, stack traces, or internal details unnecessarily.
- Update dependencies and review known vulnerabilities.

## Authentication and authorization
- Use a maintained authentication provider where possible.
- Define reporter and administrator permissions explicitly.
- Prevent users from assigning themselves elevated roles.
- Test allowed and denied access paths.
- If using Supabase, enable and test Row Level Security on every exposed table; review SELECT, INSERT, UPDATE, and DELETE policies.

## File uploads
- Allowlist file types and enforce size limits.
- Verify actual file content where feasible; do not trust filename or browser MIME type alone.
- Generate safe storage names.
- Restrict upload and read permissions.
- Never execute uploaded content.
- Consider malware scanning when deployment context requires it.

## Privacy
- Minimize personal data collection.
- Avoid public exposure of reporter identity and contact details.
- Do not send personal data to AI providers unless necessary and disclosed.
- Define retention and deletion expectations.
- Treat precise location and photographs as potentially sensitive.

## Verification
Document the threat model, authorization matrix, security tests, and known limitations before release.
