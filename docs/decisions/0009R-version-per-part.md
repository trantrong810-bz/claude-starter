---
number: 0009
scope: broad # broad | feature
status: accepted # proposed | accepted | superseded
superseded-by: # number of the new ADR, only when superseded
date: 2026-11-01
model: claude-opus-5-5
source: ca-20261101-16, ca-20261101-17, ca-20261101-18, commit f8379b7
---

# A version and changelog per part; the bump level comes from the changelog; only the project version is tagged

## Context

We need to know which version each part (.claude, docs, scripts, example, shared, be, fe, mobile) is at and what changed.

## Options

- One shared version: simple, but you cannot tell which part changed.
- Separate versions with a hand-picked bump level: error-prone and easy to forget.
- Separate versions, `Unreleased` written while working, `release` infers the bump level; tag each part or only the project.

## Decision

`versions.json` maps parts → paths (longest match wins). `Unreleased` is written in the same commit; `tools/version.mjs release` bumps by the Removed/Added/other sections. Only `vX.Y.Z` is tagged. Start at 0.1.0; at 0.x, major is lowered to minor.

## Consequences

`check` blocks parts that changed without a changelog. The Claude session proxy blocks pushing tags — tags must be pushed from the user's machine.
