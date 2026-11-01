# Plan: systematic todo/WIP that travels when switching machine or Claude account

> Historical plan (ADR 0017R), translated to English by ADR 0020R. The todo section names, markers and messages shown below were Vietnamese at the time; ADR 0020R renamed them (`In progress`, `To do`, `Recently done`, `From manual`, `from:`, `branch:`).

## Context

Today only large features have a place to record progress (`docs/specs/<name>.md` + `/handoff`). Small/medium tasks, pending work and **unfinished code** have nowhere to live; Claude's memory sits in `~/.claude` (tied to machine + account), so it does not travel. Goal: everything needed to continue lives in git → `git pull` + `/resume` on any machine/account continues the work.

Settled with the user:

- Unfinished code travels as a **snapshot ref** `wip/<branch>` on the remote (no WIP commits on the real branch).
- Scope: **root, shared, be, fe, mobile** (matching the `versions.json` labels).
- `/handoff` **pushes on its own** (calling /handoff = agreeing to push).

## Design

### 0. All state lives in the repo, not in `~/.claude`

| Thing                  | Default (on the machine)                | After the change (in the repo)                                                                                                        |
| ---------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Plan files (plan mode) | `~/.claude/plans/*.md`                  | `docs/plans/` — `"plansDirectory": "docs/plans"` in `.claude/settings.json`                                                           |
| Claude's auto memory   | `~/.claude/projects/<repo>/memory/`     | Off for the project (`"autoMemoryEnabled": false`); replaced by `TODO.md`, specs, ADRs, CLAUDE.md                                     |
| Todo / WIP             | (none)                                  | `TODO.md` + `docs/todo/`                                                                                                              |
| Unfinished code        | the working tree on the machine         | the `wip/<branch>` ref on the remote                                                                                                  |
| Prompts                | transcript `~/.claude/projects/*.jsonl` | already there: `history/prompts/` (the original transcript stays on the machine — Claude Code cannot move it; not needed to continue) |
| Usage, session state   | —                                       | `.claude/state/` (gitignored, per machine — intended, since the numbers belong to that machine/account)                               |

- The plan file copies this plan into `docs/plans/todo-wip.md` as the first file.
- `/handoff`: if the session has an uncommitted plan file in `docs/plans/` → rename it by content (`<kebab>.md`; random names are hard to look up) and commit it with the todo.
- Add `"docs/plans/"` to `ignore` in `versions.json`.
- The exact names of the 2 settings (`plansDirectory`, `autoMemoryEnabled`) are confirmed in Verification step 0 (Claude Code docs / `/config`) before writing them.

### 1. Two todo layers per part (root, shared, be, fe, mobile)

| File                       | Written by                       | Content                                                                                        |
| -------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------- |
| `docs/todo/<part>.md`      | **The user, by hand**            | Free-form: ideas, tasks, priorities, notes. Claude only reads it.                              |
| `docs/todo/<part>.auto.md` | **Claude** (`/todo`, `/handoff`) | In progress (WIP), tasks Claude noted, recently done. The first line links to the manual file. |
| `TODO.md` (repo root)      | **Generated** (`todo.mjs index`) | Overview table of every part, linking to both files of each part.                              |

**Manual file** — only one convention so it can be counted: a task is a `- [ ] ...` line, `[P1]` optional. Anything else goes. Claude **never edits the text** of this file; the only exception: ticking `[x]` when that task is done (and recording the sha in the auto file).

**Auto file** (`docs/todo/be.auto.md`):

```md
# Auto todo: be

← [Overview](../../TODO.md) · Manual: [be.md](be.md)

## In progress

- [ ] Paginate /todos — from: [be.md#L12](be.md#L12) · branch: feat/todo-paging · spec: docs/specs/todo-paging.md · 2026-11-01
  - Stopped at: service done, controller does not map the `cursor` query yet
  - Next: edit `apps/backend/src/todos/routes.ts`, run the todos tests

## To do

- [ ] [P2] Drop the old /v0/todos endpoint (found by Claude while doing feat/todo-paging)

## Recently done

- [x] Encode the query in listTodos (2026-10-30, a1b2c3d)
```

- Starting a task from the manual file → create an "In progress" item in the auto file with `from: <file>#L<line>` pointing back.
- Large tasks: the item points to the spec and does not copy progress (the spec is the source of truth).
- "Recently done" keeps at most 10 lines; older ones are deleted (git keeps the history).

**Root `TODO.md`** — entirely a generated block (markers, never edited by hand):

```md
# Todo — overview

<!-- todo:overview:start — generated by node scripts/todo.mjs index, do not edit -->

| Part      | Manual                       | Auto                                   | WIP   | Manual todo | Auto todo | P1    | In progress                        |
| --------- | ---------------------------- | -------------------------------------- | ----- | ----------- | --------- | ----- | ---------------------------------- |
| root      | [root.md](docs/todo/root.md) | [root.auto.md](docs/todo/root.auto.md) | 0     | 2           | 0         | 1     | —                                  |
| be        | [be.md](docs/todo/be.md)     | [be.auto.md](docs/todo/be.auto.md)     | 1     | 3           | 1         | 1     | Paginate /todos (feat/todo-paging) |
| ...       |                              |                                        |       |             |           |       |                                    |
| **Total** |                              |                                        | **2** | **9**       | **2**     | **2** |                                    |

Unfinished-work snapshot: wip/feat/todo-paging (desktop, 2026-11-01 17:40)
<!-- todo:overview:end -->

## How to use

<short: where to write by hand, /todo, /handoff, /resume when switching machine>
```

- Add `"TODO.md"` and `"docs/todo/"` to `ignore` in `versions.json` → editing todo needs no changelog.

### 1c. The `scripts/todo.mjs` script (same style as `adr.mjs`)

- `index` — for each part in the `SCOPES = ["root","shared","be","fe","mobile"]` constant: count `- [ ]` (and `[P1]`) in the manual file; count "In progress"/"To do" in the auto file, take the first line + branch of the WIP item; read snapshots from `refs/remotes/origin/wip/*` (local, no fetch); rewrite the block between the markers in `TODO.md`. Missing files → create empty skeletons.
- `check` — the overview block matches the content (like `adr.mjs check`); called from `scripts/verify.sh` (including `--quick`) → the overview never drifts, even when someone edits a manual file and forgets to index (verify reports it, Claude runs `index`).
- `/todo`, `/handoff`, `/resume` run `todo.mjs index` after editing todo, before committing.
- `sync [part...]` — sync manual file → auto file (then call `index`):
  - A generated `## From manual` section in the auto file (between markers): the open `- [ ]` tasks of the manual file, `[P1]` first, each line linking `[be.md#L12](be.md#L12)`.
  - A manual task ticked `[x]` with an "In progress" item pointing to it (`from: be.md#L..`) → move that item to "Recently done".
  - `#L<line>` links that drift because the user inserted/deleted lines → find the task again by its text and update the line number; not found (task deleted) → keep the WIP item and add the note `(original task was removed from be.md)`.
  - Only writes the auto file + `TODO.md`; never writes the manual file.

### 1d. Automatic sync when committing a manual file

When a commit has a manual file (`docs/todo/<part>.md`, not `.auto.md`) staged → run `node scripts/todo.mjs sync <those parts>` then `git add` the auto file + `TODO.md` → **the same commit**.

- People: add a step to `.githooks/pre-commit` (it already formats and restages files — follow that pattern).
- Claude: `.claude/hooks/commit-guard.sh` already catches every `git commit`; add the sync + `git add` step before letting it through (works even when the machine has no `.githooks`). Both paths call `todo.mjs sync`; running it twice is harmless (idempotent).
- Commits that only change todo files/`TODO.md` need neither a green verify nor a changelog (already in `ignore`).

### 2. The `scripts/wip.mjs` script (Node, no external libraries, in the style of `adr.mjs`; execSync with double quotes)

- `save` — snapshot the working tree (untracked files too, respecting .gitignore) with a temporary index: `GIT_INDEX_FILE=<tmp> git add -A` → `git write-tree` → `git commit-tree <tree> -p HEAD -m "wip: <branch> @ <hostname> <ISO time>"`. One push: `git push origin <branch> +<sha>:refs/heads/wip/<branch>` (pushes the real branch too, so the parent exists on the remote). Never changes the working tree, index or branch history. Clean working tree → skip the snapshot, only push the branch.
- `status` — `git fetch --prune origin "+refs/heads/wip/*:refs/remotes/origin/wip/*"`, list snapshots: branch, machine, time, whether the parent matches the branch HEAD.
- `restore [branch]` — precondition: a clean working tree (otherwise stop and report). Switch to the branch (creating tracking if needed), `git merge --ff-only origin/<branch>`; if HEAD ≠ the snapshot's parent → stop and report a stale snapshot. Apply with `git diff HEAD <sha> --binary | git apply` (handles deleted/added/binary files; changes land in the working tree, unstaged). On success → delete the remote ref with `git push origin :refs/heads/wip/<branch>`.
- `drop <branch>` — delete a snapshot by hand.
- Normalize CRLF when reading output (like `readText` in `scripts/version.mjs`).

### 3. Commands (`.claude/commands/`)

- **`todo.md` (new)** — `/todo` lists; `/todo <scope> <description> [P1|P2|P3]` adds; `/todo start <...>` moves to "In progress" (recording branch/spec); `/todo done <...>` moves to "Recently done" with the sha. No scope → infer it from the file path per `versions.json` (`example/apps/backend` → be...), ask if ambiguous. Writes to the **auto** file (never the manual one); `/todo` without arguments prints the `TODO.md` table + open items of both layers. Commit `chore(todo): <...>` with `TODO.md` + `docs/todo/`.
- **`handoff.md` (changed)** — besides updating the spec: update "In progress" in the **auto** file of every affected part ("Stopped at" / "Next" must be concrete down to the file). Commit `docs/todo/` + spec (`chore(todo): handoff <branch>`), then `node scripts/wip.mjs save` (pushes). Finally print 1 line: "Other machine: git pull then /resume".
- **`resume.md` (new)** — `git pull --ff-only`, `node scripts/wip.mjs status`, read the overview table in `TODO.md` then "In progress" of the files with WIP; pick the work (one → take it, several → ask); `wip.mjs restore <branch>` if there is a snapshot; read the related spec; report 3 lines: where we are, the next step, the verify command.

### 4. The `session-context.sh` hook (changed)

Add a short block: 1 total line from the `TODO.md` overview (`Todo: 2 WIP, 8 tasks (2 P1) — see TODO.md`) + 1 line per WIP item (part, title, branch). If `refs/remotes/origin/wip/<current branch>` exists (local, no fetch, to keep the hook fast) → print "Unfinished-work snapshot for this branch: run /resume". Keep the output to a few lines.

### 4b. Save WIP and stop automatically at usage ≥ 90%

Hooks do not receive usage numbers; only the **status line** does (its stdin JSON has `rate_limits.five_hour` / `seven_day` with `used_percentage` and `resets_at` — only on Pro/Max plans — and `context_window.used_percentage`). So the status line is the sensor and a hook is the brake:

- **`.claude/hooks/statusline.mjs` (new)**, registered as `statusLine` in `.claude/settings.json`: reads stdin, writes `.claude/state/usage.json` `{fiveHour, sevenDay, resetsAt, context, at}`, prints 1 line `5h 72% · 7d 40% · ctx 35%` (a warning sign at ≥ 80%). Without `rate_limits` → prints `usage: n/a`, the guard stays off.
- **`.claude/hooks/usage-guard.mjs` (new)**, `PreToolUse` on every tool + `Stop`. Threshold 90% (env `CLAUDE_WIP_THRESHOLD`). Triggers when `max(fiveHour, sevenDay) ≥ threshold` and `resetsAt` has not passed (a reset window or another account → new numbers overwrite, the block lifts on its own).
  - Not handed off: `PreToolUse` blocks (exit 2) every tool **except** handoff work — Read/Edit/Write in `docs/todo/`, `docs/specs/`; Bash `git status|diff|add|commit`, `node scripts/wip.mjs`. Message: "Usage X% ≥ 90%: stop the current work, run /handoff now (todo + spec, commit, `wip.mjs save`), then stop." `Stop` is blocked too, so Claude never quits without saving.
  - A successful `wip.mjs save` writes the marker `.claude/state/handoff-<resetsAt>.done` → `Stop` is allowed; `PreToolUse` still blocks every editing tool (Claude stops completely and reports "WIP saved, switch account/machine then /resume").
  - The marker is keyed by `resetsAt`, so it expires with the window.
- Context window ≥ 90% blocks nothing (Claude compacts on its own, nothing is lost) — it only shows on the status line.

### 5. Rules & docs

- `docs/GIT.md`: a new "WIP snapshots" section: the `wip/<branch>` ref is created/deleted only by `wip.mjs`, force-updated (`+`), never checked out or merged. Exceptions: a commit containing only `docs/todo/` (and specs) is allowed while verify is red; `/handoff` may push (calling /handoff = asking to push).
- `CLAUDE.md`: 1–2 lines: "Work overview: `TODO.md` (generated). The user's tasks: `docs/todo/<part>.md` — Claude only reads it and may only tick `[x]`. Claude writes WIP/tasks to `docs/todo/<part>.auto.md` (`/todo`), never to Claude's memory. Switching machine/account: `/handoff` first, `git pull` + `/resume` after."
- `docs/WORKFLOW.md`: add a Mermaid diagram "Switching machine / account" (handoff → save → push → pull → resume → restore) and update the SessionStart node in the safeguards diagram.
- `SETUP.md`: the "new machine" line mentions `/resume`.
- `.claude/settings.json`: allow `Bash(node scripts/wip.mjs:*)` (the file has the user's uncommitted changes — read the diff first and only add the line).
- ADR: `node scripts/adr.mjs new todo-va-snapshot-wip --rong --model claude-opus-5-5` (rejected options: wip commits + squash, todo only; Claude's memory), then `adr.mjs index`.
- Changelog `Unreleased`: `.claude/CHANGELOG.md`, `docs/CHANGELOG.md`, `scripts/CHANGELOG.md`.

## Commits (on `main`, a medium task — optionally a `chore/todo-wip` branch)

1. `feat(scripts): add wip snapshot save and restore`
2. `feat(claude): add todo and resume commands with wip handoff` (commands, hooks, settings, CLAUDE.md, docs, ADR, changelog, `scripts/todo.mjs`, initial `TODO.md` + `docs/todo/`)

## Verification

1. `node scripts/wip.mjs save` on a test branch with: an edited file, a new untracked file, a deleted file → `git ls-remote origin "refs/heads/wip/*"` shows the ref; `git status` is unchanged.
2. Simulate a second machine: `git clone` the repo into the scratchpad → `node scripts/wip.mjs restore <branch>` → `git status` shows all 3 kinds of change; the remote ref is gone.
3. Error cases: restore with a dirty working tree → stops; a snapshot with an old parent → stops with a message.
   4a. Confirm the setting names `plansDirectory` / `autoMemoryEnabled`; once set, try plan mode → the new plan file lands in `docs/plans/`.
4. Before writing the guard: make the status line temporarily dump stdin to `.claude/state/statusline-sample.json` to confirm the `rate_limits` field names on the installed Claude Code; adjust the parser if they differ.
   4b. Usage guard: hand-write `usage.json` with `fiveHour: 91` → editing a file outside `docs/todo` is blocked with the message; editing `docs/todo/be.md` and `node scripts/wip.mjs save` are allowed; after saving, Stop is allowed. `fiveHour: 50` or a past `resetsAt` → nothing is blocked.
5. `bash .claude/hooks/session-context.sh` prints WIP + the /resume hint.
   5b. Hand-edit `docs/todo/fe.md` to add one `- [ ]` line → `node scripts/todo.mjs check` reports drift → `index` → the fe manual-todo column in `TODO.md` goes up; Claude changes no character in `fe.md`.
   5c. The user edits `docs/todo/be.md` (adds a task, ticks `[x]` on a WIP task), `git add docs/todo/be.md && git commit -m "chore(todo): update be"` → the commit contains `be.auto.md` too (the "From manual" section has the new task, the WIP item moved to done) and `TODO.md`. Repeat through Claude (the commit-guard hook) with `.githooks` off → same result.
6. `node scripts/adr.mjs check`, `node scripts/version.mjs check`, `pnpm verify` (or `bash scripts/verify.sh`) → VERIFY OK.
7. Clean up: `node scripts/wip.mjs drop <test branch>`, delete the test branch.
