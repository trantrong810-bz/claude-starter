---
number: 0011
scope: broad # broad | feature
status: accepted # proposed | accepted | superseded
superseded-by: # number of the new ADR, only when superseded
date: 2026-11-01
model: claude-opus-5-5
source: ca-20261101-19, ca-20261101-20, ca-20261101-22
---

# Every contested decision has an ADR; broad decisions are marked R

## Context

We need to look up why a decision was made, even after changing our minds later.

## Options

- Record only broad decisions: fewer files, but the reasons for small decisions are lost.
- Record every contested decision and mark the broad ones separately.

## Decision

ADRs live in `docs/decisions/`. Broad ones: `scope: broad`, an R in the file name, their own table at the top of the generated index. There is a `model` field. `scripts/adr.mjs check` runs in verify.

## Consequences

More ADRs, but still quick to filter thanks to the marking. Reversed decisions are kept with the status superseded.
