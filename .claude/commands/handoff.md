---
description: Save progress (todo, spec, unfinished code) to git and push it — before /clear, switching machine or switching account
---

Goal: a new session, on any machine or account, only needs `git pull` + `/resume` to continue.

1. **Todo**: for each affected part, update `## In progress` in `docs/todo/<part>.auto.md` (format in `/todo`):
   - `Stopped at:` what was done and where it stopped — down to the file/function.
   - `Next:` the next step that can be done right away, with the command that checks it.
   - Finished work → move to `## Recently done` (and tick `[x]` in the manual file if it has `from:`). New work → `## To do`.
2. **Spec** (large tasks): tick the checklist, update "Progress" and "Notes" (settled decisions, traps hit, key files).
3. **Plan**: an uncommitted plan file in `docs/plans/` with a random name → rename it to `<kebab-by-content>.md`.
4. On `main`, create a branch first (`chore/handoff-<date>`, or the branch of the unfinished work), because `main` only accepts changes through PRs. `node scripts/todo.mjs sync`, then commit `chore(todo): handoff <branch>` with `TODO.md`, `docs/todo/`, the spec, `docs/plans/` — only those files, no unfinished code (this commit does not need a green verify).
5. `node scripts/wip.mjs save` — snapshot unfinished code to `wip/<branch>` and push the branch too. Calling `/handoff` means I agree to the push.
6. Report 2 lines: what was saved; "Other machine/account: `git pull` then `/resume`". If this is only a `/clear` on this machine, remind me to run `/clear`.

Keep it short, but enough for a new session to continue from the todo + spec alone. Write in English (ADR 0020R).
