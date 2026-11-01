---
number: 0003
scope: broad # broad | feature
status: accepted # proposed | accepted | superseded
superseded-by: # number of the new ADR, only when superseded
date: 2026-11-01
model: claude-opus-5-5
source: ca-20261101-11, ca-20261101-12, commit 4f1b848
---

# Classify tasks as small / medium / large before starting

## Context

Forcing every task through the full process costs time and tokens, while most daily work is small fixes.

## Options

- One process for everything: simple but wasteful.
- Classify by scope: small → just do it, medium → plan in chat, large (contract change) → the two-phase process.

## Decision

Classify by whether the API contract changes and how many layers are touched. The rule lives in CLAUDE.md.

## Consequences

Small work is much faster; the Stop hook still protects every kind. The medium/large boundary depends on Claude's judgement.
