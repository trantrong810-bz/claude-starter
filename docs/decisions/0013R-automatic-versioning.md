---
number: 0013
scope: broad # broad | feature
status: accepted # proposed | accepted | superseded
superseded-by: # number of the new ADR, only when superseded
date: 2026-11-01
model: claude-opus-5-5
source: ca-20261101-23, ca-20261101-24
---

# Automatic versioning through a commit-blocking hook and the `versioner` subagent (Haiku), with an off mode

## Context

The changelog rule in CLAUDE.md is only advice; releases have to be run by hand. Automation is needed, but it must be possible to turn off.

## Options

- Only a rule in CLAUDE.md: cheap, easy to forget.
- A git pre-commit hook calling `claude -p`: also covers manual commits, but slow and costly.
- A PreToolUse hook blocking Claude's `git commit` + a `versioner` subagent that fills the changelog; the Stop hook as a safety net.
- Model for versioner: Haiku (cheap, a classification task) or Sonnet.

## Decision

PreToolUse blocks the commit when `version check --auto` fails; `versioner` (Haiku) reads the diff of the missing parts and writes `Unreleased` (Added/Changed/Fixed/Removed, `**BREAKING:**`). `versions.json` → `automation.mode`: `off` | `changelog` (default) | `full` (runs `/release` after merge, asking first when `confirmRelease`). `CLAUDE_AUTO_VERSION=off` turns it off for one session.

## Consequences

The changelog lands in the same commit as the code. Manual commits outside Claude are not blocked — `check` at release time still catches them. A trial run with a general agent and versioner's instructions cost ~78k tokens because it carried every tool; the real versioner has fewer tools — measure again in real Claude Code, and if it is still expensive, consider calling it only at release time.
