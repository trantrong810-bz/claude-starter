---
number: 0007
scope: broad # broad | feature
status: superseded # proposed | accepted | superseded
superseded-by: 0019 # number of the new ADR, only when superseded
date: 2026-11-01
model: claude-opus-5-5
source: ca-20261101-15, commit 1bbadf3
---

# Large features live on a feat/ branch; merging into main is the approval point

## Context

In the trial run, red tests were committed straight to main between the two sessions; the reviewer's default `git diff HEAD` was empty after the layer-by-layer commits.

## Options

- Commit straight to main: simple, but main is broken between phases.
- A feat/ branch + fast-forward merge after your approval.

## Decision

Phase 1 creates `feat/<name>`; the reviewer looks at `main...HEAD`; merging happens only after you agree.

## Consequences

main is always green. One more human checkpoint (3 in total: plan, merge, retro).
