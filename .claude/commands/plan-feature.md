---
description: Phase 1 (run with Opus) — plan, settle the contract in shared, write backend tests first. No implementation code.
argument-hint: <feature-name> <short description>
---

Feature: $ARGUMENTS

This is the planning phase. Run this session with a strong model (Opus); the implementation phase runs in another session with Sonnet.

1. Create `docs/specs/<feature-name>.md` from `docs/specs/_template.md`.
2. Read only the relevant files. Fill in Goal, Contract, Plan, Checklist. The Contract includes the client function signatures in `packages/shared` (shared by web and mobile, never hand-written there). In the Plan, state for each app whether it has significant UI or only calls the client — phase 2 uses this. If the feature does NOT change the API contract or only touches one layer, say so and suggest doing it directly without this process.
3. STOP so I can review the plan and contract. This is the most important checkpoint — call out the decisions that could be contested.
4. After approval:
   - Each approved contested decision (the "Contested decisions" item in Contract) → one ADR via `node scripts/adr.mjs new`, with the spec name in `source`; record the ADR number in the spec's Notes.
   - `git switch main && git switch -c feat/<feature-name>` (kebab-case, ≤ 40 characters, same as the spec name) — every commit of the feature lives on this branch; `main` stays green. Every commit follows `docs/GIT.md`.
   - Create `.claude/.allow-red` (verify will skip tests, but typecheck and lint must still pass).
   - Write the schemas/types in `packages/shared`.
   - Create stubs for the backend functions: full signatures per the contract, bodies only `throw new Error("not implemented")`. These signatures are part of the contract.
   - Write backend tests that call the stubs and describe the expected behaviour. They must be red because of "not implemented", not because of import or type errors.
   - `pnpm verify` must pass (typecheck + lint), then run the backend tests on their own to confirm they are red for the right reason.
   - Commit: `feat(<name>): add contract, stub and failing tests`, with `Refs: docs/specs/<name>.md` in the body. A contract that changes an existing API → add `!` and a `BREAKING CHANGE:` footer.
5. Run `/handoff`, then remind me: `/clear`, `/model sonnet`, `/build-feature <feature-name>`.
