---
number: 0012
scope: broad # broad | feature
status: accepted # proposed | accepted | superseded
superseded-by: # number of the new ADR, only when superseded
date: 2026-11-01
model: claude-opus-5-5
source: ca-20261101-23, ca-20261101-24
---

# The version tool ships with the kit; new projects create their config with `init`

## Context

ADR 0009 put the tool in `tools/` so it would not be copied into projects using the kit. Automating versioning in every project that uses the kit requires that project to have the tool.

## Options

- Keep it in `tools/`: a lean kit, but projects using it cannot automate.
- Move it to `scripts/` and add `init`, which generates `versions.json` from `apps/*` and `packages/*`.

## Decision

Move it to `scripts/version.mjs` (this replaces the "kit repo only" part of ADR 0009; the rest of 0009 stands). `init` creates `versions.json` and a `CHANGELOG.md` per app/package, with the default mode `changelog`. Without a tag, compare against the first commit.

## Consequences

The command changes from `node tools/version.mjs` to `node scripts/version.mjs`. `try-example.sh` runs `init` automatically.
