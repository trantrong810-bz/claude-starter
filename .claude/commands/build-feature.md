---
description: Phase 2 (run with Sonnet) — green backend, client in shared, then web + mobile UI. Commit after each layer, on the feat/ branch.
argument-hint: <feature-name>
---

Feature: $ARGUMENTS

1. Read `docs/specs/$ARGUMENTS.md`. It is the source of truth; do not re-plan. If the spec contradicts the current code, stop and ask. Make sure you are on the `feat/$ARGUMENTS` branch.
2. Delete `.claude/.allow-red` (from now on verify runs the tests too).
3. Backend: replace the stubs and make the phase 1 tests green. Do not edit tests to make them pass — if a test is wrong, stop and ask.
   `pnpm verify` passes → commit `feat(<name>): implement backend` (if the changelog is missing the hook blocks: call the `versioner` subagent and commit again; if the message breaks the conventions, fix it per `docs/GIT.md`) → tick the checklist. (This applies to every commit below.)
4. Client in `packages/shared`: API functions per the contract, parse responses with the schema (no `as` casts), encode every parameter that goes into a URL. Write tests with a fake `fetch`.
   `pnpm verify` passes → commit `feat(<name>): add api client in shared` → tick the checklist.
5. Web and mobile UI — call the client from `@app/shared` only, never rewrite API-calling logic:
   - If the Plan says both apps have significant UI (new screens/components, many files): hand them to 2 `app-builder` subagents in parallel.
   - Otherwise: do it directly. A subagent costs ~10k tokens to start; not worth it for a few lines.
   - Then: `pnpm verify` passes → commit `feat(<name>): add web and mobile ui` → tick the checklist.
6. Update the spec (checklist + Progress). Run `pnpm verify` one last time, then call the `code-reviewer` subagent with: the range `git diff main...HEAD`, the spec path, and the verify result. Fix high and medium issues and commit (`fix(<name>): ...`).
7. Report to me: a 3–5 line summary + the low-severity issues left unfixed. Then follow `/ship`: push, open a PR, ask me before enabling auto-merge, wait for CI, clean up the branch, then release/retro.
