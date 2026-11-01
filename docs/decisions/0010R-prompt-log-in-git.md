---
number: 0010
scope: broad # broad | feature
status: accepted # proposed | accepted | superseded
superseded-by: # number of the new ADR, only when superseded
date: 2026-11-01
model: claude-opus-5-5
source: ca-20261101-19, ca-20261101-20, ca-20261101-21, ca-20261101-22
---

# The prompt log is committed to git, outside versioning, with the handling model and without answers

## Context

We need to look up what was asked and which model handled it. Claude Code transcripts live only on the machine and may be cleaned up.

## Options

- Rely on transcripts: nothing to do, but they disappear after a while and are hard to search.
- A log on the machine (gitignored): safe if the repo is public.
- A log committed to git: durable and searchable anywhere; needs protection against leaking secrets.

## Decision

The repo is private, so `history/prompts/YYYY-MM.jsonl` is committed. The UserPromptSubmit hook logs the prompt (secrets redacted); Stop logs the model (transcript → SessionStart/PostModelSwitch → `unknown`), effort, subagents and the commits made. Answers are not logged. It is in the versioning `ignore` list. verify blocks when a secret-like string remains.

## Consequences

A full history linking prompt → commit → ADR. The transcript format is internal to Claude Code and may change — the hook reads defensively and logs `unknown` instead of guessing. If the repo becomes public, this decision must be revisited.
