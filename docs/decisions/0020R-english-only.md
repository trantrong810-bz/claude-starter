---
number: 0020
scope: broad # broad | feature
status: accepted # proposed | accepted | superseded
superseded-by: # number of the new ADR, only when superseded
date: 2026-11-01
model: claude-opus-5-5
source: user request to use English everywhere except hand-written todo files; plan docs/plans/english-only.md; spec docs/specs/english-only.md
---

# Everything in the repo is written in English, except hand-written todo files

## Context

The kit was written in Vietnamese: docs, ADRs, changelogs, code comments, script and hook output, and even identifiers that scripts parse (todo section names, ADR frontmatter keys, the `--rong` flag, workflow file names). The user wants a single language so the kit reads the same for anyone and for any model. Their own notes in `docs/todo/<part>.md` stay in whatever language they write.

## Options

- Scope of renaming:
  - (a) Translate text only and keep unaccented Vietnamese identifiers. Less churn, but the kit stays half Vietnamese.
  - (b) Rename identifiers too (file names, frontmatter keys, flags, todo markers). Fully English, but a breaking change for existing users.
- History:
  - (a) Translate everything, including accepted ADRs, released changelog entries and finished plans.
  - (b) Apply the rule only to new content.
- Enforcement:
  - (a) A check in verify, pre-commit and CI that rejects accented Vietnamese.
  - (b) A written rule in `CLAUDE.md` only.

## Decision

(b), (a) and (a), as chosen by the user. Exceptions:

- Hand-written `docs/todo/<part>.md`, plus the copy of its open items that `todo.mjs sync` mirrors into `docs/todo/<part>.auto.md`.
- `history/prompts/`, which logs the user's raw prompts.
- Past git commit messages, since history is never rewritten.

Chat replies to the user still follow the user's language. The rule covers repository content only.

## Consequences

- `scripts/lang.mjs check` runs in `verify.sh`, so it runs in CI and before commits. It catches accented Vietnamese only. Unaccented Vietnamese still has to be caught in review.
- These renames are breaking for anyone using an older copy of the kit:
  - ADR frontmatter keys and values.
  - `adr.mjs new --rong` becomes `--broad`.
  - The todo section names in `*.auto.md`.
  - The workflow file names under `docs/workflows/`.
- Commit messages were already in English (0014R). `commit-msg.mjs` now enforces that as well.
