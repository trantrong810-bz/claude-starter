---
description: End of a large feature — turn the mistakes hit into config improvements (CLAUDE.md, lint rule, hook, command)
argument-hint: <feature-name>
---

Read `docs/specs/$ARGUMENTS.md` (the Notes section) and the feature's `git log`. Look for:

- Mistakes Claude made that had to be redone.
- Places where I had to step in or repeat myself.
- Repeated steps that could be automated.

For each issue, propose EXACTLY ONE cheapest fix, in this order of preference:

1. A lint rule or hook (machine-enforced — best).
2. One line in the root CLAUDE.md or an app's CLAUDE.md (only when it cannot be machine-enforced).
3. A new command or skill (only when a prompt has repeated ≥3 times).

Present a short table: issue → proposal → file to change. At most 5 rows; skip one-off incidents.
Change nothing until I choose. Also propose removing CLAUDE.md lines that became redundant (replaced by a lint rule/hook).
If a chosen proposal changes the workflow (command, hook, subagent, task classification), update the diagram in `docs/workflows/` in the same commit (new workflow: copy `_template.md`, then `node scripts/workflow.mjs index`). Every applied change goes into `Unreleased` of the matching part's changelog. A chosen proposal with another reasonable option → an ADR; if it reverses an old ADR, set the old one to `status: superseded` with `superseded-by` pointing to the new ADR.
