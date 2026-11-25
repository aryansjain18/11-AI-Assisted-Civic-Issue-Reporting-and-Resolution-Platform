# CivicFix — Agent Instructions

You are the implementation agent for CivicFix. Inspect the repository before editing and read the relevant documentation in `docs/`.

## Source of truth
- `docs/01_PROJECT_OVERVIEW.md` — product intent and scope.
- `docs/02_REQUIREMENTS.md` — functional and non-functional requirements.
- `docs/03_TECH_STACK.md` — provisional technology decisions.
- `docs/04_ARCHITECTURE.md` — architecture constraints.
- `docs/05_DATA_MODEL.md` — conceptual data model.
- `docs/06_UI_UX_ACCESSIBILITY.md` — UI and accessibility.
- `docs/07_SECURITY_PRIVACY.md` — security and privacy.
- `docs/08_TESTING_QUALITY.md` — testing and quality gates.
- `docs/09_EVALUATION_MATRIX.md` — judging-category strategy.
- `docs/10_IMPLEMENTATION_PLAN.md` — milestone sequence.
- `docs/11_DEFINITION_OF_DONE.md` — completion criteria.
- `docs/12_DECISIONS_AND_OPEN_QUESTIONS.md` — assumptions and open decisions.
- `PROJECT_STATUS.md` — current progress and blockers.

## Mandatory workflow
1. Inspect existing files, branch, framework, scripts, and conventions before changing anything.
2. Preserve working code. Do not overwrite or restructure existing work without explaining why.
3. Read the complete official challenge statement and rubric when provided. Reconcile the docs before implementation.
4. Treat requirements and stack choices as provisional until verified against the challenge and repository.
5. Implement one milestone or small subtask at a time, not the entire application in one pass.
6. Use small, reviewable changes and avoid unnecessary dependencies or abstractions.
7. Enforce authorization at the trusted backend/database boundary, never only in the UI.
8. Never expose secrets or commit `.env`, tokens, service-role keys, or credentials.
9. Run relevant checks and report exact commands and actual results. Never claim an unrun test passed.
10. Update `PROJECT_STATUS.md` after each milestone with completed work, tests, blockers, and next task.

## Quota-aware context use
- Do not repeat the whole project specification in every prompt.
- Read only the documents relevant to the current task after initial orientation.
- Inspect affected files before editing; avoid broad rewrites and duplicate implementations.
- If a task is too large, split it into smaller verified checkpoints.

## Important
The full hackathon challenge statement and exact judging rubric have not yet been supplied. Do not invent requirements or claim guaranteed scores.
