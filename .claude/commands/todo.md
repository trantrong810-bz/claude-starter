---
description: View or record todo per part (root, shared, be, fe, mobile) — Claude writes only to the auto files
argument-hint: "[<part>] <description> [P1|P2|P3] | start <task> | done <task>"
---

Request: $ARGUMENTS

Two layers, see `TODO.md`, section "How to use":

- `docs/todo/<part>.md` — **hand-written by the user**, in any language. Read only. The only exception: tick `[x]` for work just finished; change no other character.
- `docs/todo/<part>.auto.md` — **written by Claude**, in English: `## In progress`, `## To do`, `## Recently done`. Never edit the `## From manual` section (generated).

Do as requested:

- **Empty**: read `TODO.md`, print the overview table + work in progress + P1 tasks (both layers). Change nothing.
- **Add** (`[<part>] <description> [P1]`): add `- [ ] [P1] <description>` to `## To do` in the auto file. No part given → infer it from the related files per `versions.json` (`.../apps/backend/` → be, `.../apps/web/` → fe, `.../apps/mobile/` → mobile, `.../packages/shared/` → shared, otherwise → root); ask if ambiguous.
- **start `<task>`**: move the task into `## In progress` of the auto file, as
  `- [ ] <title> — from: [be.md#L12](be.md#L12) · branch: <branch> · spec: <path if any> · <YYYY-MM-DD>`
  with the sub-lines `  - Stopped at: ...` and `  - Next: ...`. For a task taken from the manual file, the title **copies that line's text verbatim** (without `[P1]`), so `todo.mjs sync` can find it again.
- **done `<task>`**: remove the item from `## In progress`/`## To do`, add `- [x] <title> (<YYYY-MM-DD>, <short sha>)` at the top of `## Recently done` (keep at most 10 lines). A task with `from:` → tick `[x]` on the original line in the manual file.

After editing: `node scripts/todo.mjs sync`, then commit `chore(todo): <summary>` with `TODO.md` + `docs/todo/` (no green verify or changelog needed). Large tasks: the item only points to the spec; detailed progress stays in the spec.
