# 08 — Testing and Quality

## Testing layers
- Unit tests for validation and domain rules.
- Component tests for forms and key UI states.
- Integration tests for data access and authorization.
- End-to-end tests for report submission and administrative resolution.
- Manual accessibility and responsive checks.

## Critical scenarios
1. Valid report submission succeeds.
2. Missing/invalid fields are rejected with useful messages.
3. A user cannot read another user's private data.
4. A non-admin cannot access admin functions.
5. An authorized admin can update status.
6. Invalid status transitions are rejected.
7. Upload constraints are enforced.
8. Empty, loading, and failure states render correctly.
9. Keyboard users can complete the core workflow.

## Quality gates
- Lint passes.
- Type checking passes.
- Unit/component tests pass.
- Critical end-to-end tests pass where configured.
- Production build succeeds.
- No secrets are committed.
- Dependency/security findings are reviewed.
- No obvious console errors in critical flows.

Record exact commands and results. Never report tests as passing if they were not run.
