---
number: 0017
scope: broad # broad | feature
status: accepted # proposed | accepted | superseded
superseded-by: # number of the new ADR, only when superseded
date: 2026-11-01
model: claude-opus-5-5
source: session aa6d8532 (history/prompts/2026-11.jsonl); plan docs/plans/todo-wip.md; ADR 0014R
---

# All working state lives in the repo: two-layer todo, unfinished code at wip/<branch>, forced handoff at usage ≥ 90%

## Context

Switching machine or Claude account lost context: auto memory and plan files lived in `~/.claude` (per machine, per account), small/medium tasks had nowhere to record progress, and unfinished code existed only in the working tree. `docs/GIT.md` forbids "WIP" commits and red commits, so simply committing and pushing was not an option. Running out of usage midway left no time to save.

## Options

- **Unfinished code**: (a) `wip:` commits on the branch, squashed before merge — simple, but rewrites pushed history, against ADR 0014R; (b) only record todo and require a committable state before switching — loses red/unfinished code; (c) snapshot it as a detached commit at `wip/<branch>` (temporary index + `commit-tree`), never touching branch history — **chosen**.
- **Todo**: (a) one file managed by Claude; (b) two layers: a hand-written file (Claude only reads) + an auto file Claude writes, with a generated `TODO.md` overview — **chosen**, because the user wants free-form notes Claude never rewrites.
- **Memory/plans**: (a) keep the default `~/.claude`; (b) `plansDirectory: docs/plans`, `autoMemoryEnabled: false` — **chosen**.
- **Usage**: hooks do not receive usage numbers; only the status line receives `rate_limits`. The status line writes the numbers to `.claude/state/usage.json` and the `usage-guard` hook blocks tools at ≥ 90% — **chosen**; a verbal reminder in CLAUDE.md was rejected because Claude cannot see usage.

## Decision

- `scripts/todo.mjs` (`sync`, `check`, `brief`), `docs/todo/<part>.md` + `<part>.auto.md`, generated `TODO.md`; committing a manual file → pre-commit/commit-guard syncs it into the same commit; `verify` runs `check`.
- `scripts/wip.mjs` (`save`, `status`, `restore`, `drop`); `/handoff` saves todo + spec + plan, runs `wip.mjs save` and pushes; `/resume` on the new side.
- `statusline.mjs` + `usage-guard.mjs`: at ≥ 90% (`CLAUDE_WIP_THRESHOLD`) only handoff work is allowed; once saved, every tool except reading is blocked.

## Consequences

- Continue anywhere: `git pull` + `/resume`. No more dependence on Claude's memory.
- New exceptions in GIT.md: a commit containing only todo/spec/plan files is allowed while verify is red; `/handoff` may push.
- `wip/*` are force-updated refs on the remote; orphaned refs need watching (`wip.mjs status`, `drop`).
- The guard depends on the status line: an interface that does not run it (possibly VS Code) or a plan without `rate_limits` → the guard never triggers, leaving only a manual `/handoff`.
