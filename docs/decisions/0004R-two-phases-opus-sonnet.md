---
number: 0004
scope: broad # broad | feature
status: accepted # proposed | accepted | superseded
superseded-by: # number of the new ADR, only when superseded
date: 2026-11-01
model: claude-opus-5-5
source: ca-20261101-11, ca-20261101-12, commit 4f1b848
---

# Large tasks run in two phases and two sessions: Opus plans, Sonnet implements

## Context

Thinking (plan, contract) and writing code cost differently. Switching models mid-session loses the prompt cache (per guidance from Lydia Hallie, Anthropic).

## Options

- One session, one strong model: simple but expensive.
- One session, switching models midway: cheaper but loses the cache.
- Two sessions separated by `/clear`, one model each; state passes through the spec.

## Decision

`/plan-feature` (Opus) → `/handoff` → `/clear`, `/model sonnet` → `/build-feature` (Sonnet).

## Consequences

The expensive thinking uses the strong model and the token-heavy work uses the cheap one, without breaking the cache. It needs a well-written spec; the SessionStart hook lets a new session find unfinished work on its own.
