# 02 — Requirements

> Provisional baseline. Reconcile this document against the official challenge statement before implementation.

## Functional requirements

### Reporting
- A reporter can submit an issue with a title, description, category, and location information.
- Photo evidence is optional unless the challenge requires it.
- The form validates required fields and gives actionable errors.
- Submission produces a stable report identifier and confirmation.
- Duplicate submissions should be discouraged where practical without silently discarding legitimate reports.

### Tracking
- A reporter can view reports they are authorized to see.
- Each report has a clear status.
- Status history records actor and time where feasible.
- Users cannot alter administrative fields through client-side requests.

### Administration
- Authorized staff can review reports.
- Authorized staff can change status and priority.
- Administrative actions are validated and auditable.
- Non-admin users cannot access administrative operations or data.

### Discovery and analytics
- Support useful filters by category, status, and time where appropriate.
- Aggregate counts must come from persisted data, not fabricated hard-coded metrics.

### Optional intelligent assistance
- Classification output is a suggestion, not an authoritative decision.
- A human can correct suggestions.
- Core workflows remain available if an AI provider is unavailable.
- Do not send unnecessary personal or sensitive information to AI services.

## Non-functional requirements
- Responsive layout.
- Accessible forms, navigation, focus states, and status communication.
- Server-side validation and authorization.
- Safe handling of uploaded files.
- Useful loading, empty, error, and success states.
- Maintainable modular code.
- Automated tests for critical paths.

## Challenge traceability
When the official challenge is supplied, map every requirement to an implemented feature, file/module, and verification test. Do not mark a requirement complete without evidence.
