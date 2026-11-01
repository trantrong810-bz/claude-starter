---
number: 0016
scope: broad # broad | feature
status: accepted # proposed | accepted | superseded
superseded-by: # number of the new ADR, only when superseded
date: 2026-11-01
model: claude-opus-5-5
source: request "a tool that formats files automatically when they are edited by hand"; ADR 0014R, 0015R
---

# The git pre-commit hook runs Prettier on staged files and restages them

## Context

Files edited by Claude are formatted by the `format.sh` hook, and files edited by people in VSCode are formatted on save (ADR 0015R). What still slips through: files edited in another editor, without the Prettier extension, or saved with "Save without formatting". Formatting diffs then leak into later commits and make review harder.

## Options

- Pre-commit formats the staged files and `git add`s them again: nothing for people to do; the downside is that the commit differs from what was staged, and partially staged files cannot be formatted safely.
- Pre-commit only runs `prettier --check` and blocks: never changes files, but adds a manual round each time something is off.
- A background watcher formats every file saved to disk: covers every editor, but must be remembered and fights VSCode's format-on-save.

## Decision

Option 1 (the user's choice). Partially staged files are not formatted; for them the hook only checks the staged version and blocks if it is off, so unstaged changes never get pulled into the commit. The hook only runs when `node_modules/.bin/prettier` exists, so the kit repo itself (no Prettier installed) is unaffected. The list of file extensions is shared with `format.sh`.

## Consequences

- People's commits are always formatted, even when bypassing VSCode; only effective once `core.hooksPath .githooks` is set.
- Commits take a little longer, the time Prettier needs on the staged files.
- Changing the extension list means editing both `.githooks/pre-commit` and `.claude/hooks/format.sh`.
