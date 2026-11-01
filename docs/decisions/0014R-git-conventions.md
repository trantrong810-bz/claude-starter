---
number: 0014
scope: broad # broad | feature
status: accepted # proposed | accepted | superseded
superseded-by: # number of the new ADR, only when superseded
date: 2026-11-01
model: claude-opus-5-5
source: request "add a git convention every Claude session must consult"; docs/GIT.md
---

# Shared git conventions in docs/GIT.md, loaded into every session and enforced by hooks

## Context

The git conventions were scattered: commands taught `feat(<name>): backend`, `/release` taught `docs(changelog): ...`, `version.mjs` wrote `release: vX`, while the real git log was free-form English sentences (`Add ...`). Version 0.1.0 was released by hand without a tag, so `version.mjs check` compared against the first commit and wrongly reported missing changelogs. On Windows (`core.autocrlf=true`) files were checked out with CRLF and `adr.mjs` could not read the frontmatter of all 13 ADRs. Every Claude session had to guess the conventions.

## Options

- **Message format:** (a) Conventional Commits; (b) free-form sentences like the old log. (a) is machine-checkable, maps to changelog sections and was already used by the commands; (b) needs no habit change but cannot be enforced.
- **Language:** English (matches history, tools, ASCII headers) or Vietnamese (matched the docs at the time). English was chosen; docs and changelogs stayed Vietnamese until ADR 0020R.
- **Merge:** fast-forward + rebase (linear history, keeps the layer commits) / squash (tidy, but loses the rollback points) / merge commits (branching history, hard to read for a solo developer).
- **How Claude "always consults" it:** docs only (easy to skip) / `@docs/GIT.md` in CLAUDE.md (always in context, costs tokens every session) / an enforcing hook (certain, with maintenance cost). Both of the latter were chosen.
- **Enforcement for people:** git hooks in `.githooks/` (no dependencies) / husky + commitlint (needs a root package.json and dependencies). `.githooks/` was chosen.

## Decision

English Conventional Commits, `<type>/<name>` branches, `--ff-only` merges only, tags only through `version.mjs release`, LF through `.gitattributes`. All of it in `docs/GIT.md`, loaded via `@` in CLAUDE.md. Enforced by `scripts/commit-msg.mjs`, shared by the `commit-guard.sh` hook (Claude, always on) and `.githooks/commit-msg` + `pre-commit` (people, enabled with `core.hooksPath`). SessionStart reports the git state. Tag `v0.1.0` was added retroactively on f8379b7.

## Consequences

- Old commits (before the convention) stay as they are; history is not rewritten.
- `docs/GIT.md` costs tokens every session: keep it short, rules only, no long explanations.
- `commit-guard.sh` can only read messages from `-m` or a heredoc; `-F` is skipped and left to the git hook.
- Every new clone must run `git config core.hooksPath .githooks`; SessionStart reminds you until it is set.
- `deny`/`ask` permissions for dangerous git commands are optional (SETUP.md); Claude never edits its own permissions.
