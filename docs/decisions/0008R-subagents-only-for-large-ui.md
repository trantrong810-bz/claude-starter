---
number: 0008
scope: broad # broad | feature
status: accepted # proposed | accepted | superseded
superseded-by: # number of the new ADR, only when superseded
date: 2026-11-01
model: claude-opus-5-5
source: ca-20261101-15, commit 1bbadf3
---

# Use web/mobile subagents only when each app has significant UI

## Context

In the trial run, two subagents spent about 24k tokens for 6 lines of code each.

## Options

- Always use parallel subagents: the main context stays lean, but each costs ~10k tokens to start.
- Never use them: cheap for small work, but the context bloats for large work.
- Decide from the Plan: subagents only when both apps have large UI.

## Decision

Phase 1 records in the Plan whether each app has significant UI; phase 2 chooses based on that.

## Consequences

Small work is much cheaper; large work still keeps the main context lean.
