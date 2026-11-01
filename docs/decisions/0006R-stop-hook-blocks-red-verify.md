---
number: 0006
scope: broad # broad | feature
status: accepted # proposed | accepted | superseded
superseded-by: # number of the new ADR, only when superseded
date: 2026-11-01
model: claude-opus-5-5
source: ca-20261101-04, ca-20261101-06, commit 88e147e
---

# A Stop hook prevents Claude from reporting done while verify fails

## Context

CLAUDE.md is only advice; Claude could report done with red tests. A machine-enforced condition is needed.

## Options

- Only a rule in CLAUDE.md: cheap but unreliable.
- A Stop hook that always runs the full verify: reliable but slows every turn.
- A conditional Stop hook: full verify when code changed, quick checks otherwise.

## Decision

The Stop hook exits 2 with terse errors when verify is red, with an endless-loop guard. The quick level (secret scan, ADR check) runs every turn; the full level when `apps/` or `packages/` changed.

## Consequences

It is impossible to report done while red. Questions and plans do not pay for running tests.
