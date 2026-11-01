---
description: Continue on another machine or Claude account — pull todo, apply unfinished code from wip/<branch>, report the next step
argument-hint: "[branch]"
---

Branch (optional): $ARGUMENTS

1. `git pull --ff-only` on the current branch (if it fails, report it; do not fix it yourself).
2. `node scripts/wip.mjs status` — unfinished-work snapshots on the remote.
3. Read `TODO.md`, then `## In progress` in the `docs/todo/<part>.auto.md` files with WIP. Pick the work: only one → take it; several → ask me (list part, title, branch, whether it has a snapshot).
4. Work with a snapshot: `node scripts/wip.mjs restore <branch>`. The script stops if the working tree is dirty or the snapshot is stale — report its message verbatim and ask me; never discard changes yourself.
5. Work with a spec → read the spec. Read the files named under "Next".
6. Report 3 lines: where we are (branch, part), the concrete next step, the check command (`pnpm verify` or the relevant test). Do not start editing code before I confirm.
