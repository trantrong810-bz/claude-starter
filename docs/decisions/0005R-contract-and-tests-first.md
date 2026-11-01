---
number: 0005
scope: broad # broad | feature
status: accepted # proposed | accepted | superseded
superseded-by: # number of the new ADR, only when superseded
date: 2026-11-01
model: claude-opus-5-5
source: ca-20261101-14, commit b6d0967
---

# Contract and tests come first; 'not implemented' stubs; the .allow-red flag only skips tests

## Context

Phase 2 needs an objective referee. In the first version, tests called functions that did not exist yet (red for the wrong reason), and the `.allow-red` flag turned off every check.

## Options

- Write code, then tests: Claude grades its own work.
- Tests first without stubs: type errors hide the behaviour.
- Tests first + stubs with full signatures; the flag only skips tests, typecheck and lint stay mandatory.

## Decision

Phase 1 writes the schemas, `throw new Error("not implemented")` stubs, and tests that are red for the right reason. The `.allow-red` flag only skips tests; SessionStart warns while the flag is on.

## Consequences

Function signatures become part of the approved contract. Forgetting to delete the flag no longer silently removes protection.
