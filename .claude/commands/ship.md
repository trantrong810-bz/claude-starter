---
description: Bring the current branch into main through GitHub — push, open a PR, (ask), enable auto-merge, wait for CI, clean up the branch
argument-hint: "[extra notes for the PR description]"
---

Conventions: `docs/GIT.md`, section Merge. `main` only accepts changes through PRs; GitHub rebase-merges when the `verify` job is green.

1. Pre-checks:
   - you are on a branch other than `main` (on `main`, stop: create a branch per `docs/GIT.md` first);
   - `git status --porcelain` shows nothing besides `history/`; otherwise stop and ask me;
   - `pnpm verify` passes.
2. `git fetch origin`. If `origin/main` has commits the branch lacks (`git log HEAD..origin/main`), run `git rebase origin/main`, then `pnpm verify` again.
3. `git push -u origin <branch>`. If the branch was rebased after an earlier push, stop and ask me, because that needs a force push and it is forbidden.
4. `gh pr view --json url,state` to see whether a PR exists. If not, run `gh pr create --base main --title "<title>" --body-file <temp file>`:
   - title: the commit header if there is only one commit; with several commits use the `<type>(<scope>): <summary>` form from `docs/GIT.md`;
   - body (English): a 3–5 line summary; the list from `git log --format="- %s" origin/main..HEAD`; `Refs:` (spec, ADR, plan if any); the verify result; `$ARGUMENTS` if given; the attribution line last.
5. Send me the PR link and summary, then **ask me whether to merge**. If I say no, stop and leave the PR open. Do not continue without an answer.
6. If I agree, run `gh pr merge --auto --rebase`, then `gh pr checks --watch`.
   - CI red: `gh run view --log-failed`, fix, commit, push, then back to `gh pr checks --watch`. Auto-merge stays on.
   - Green: `gh pr view --json state` must be `MERGED`. If it is not merged (for example `main` moved on and there is a conflict), tell me with the reason GitHub gives.
7. Merged:
   - `git switch main && git pull --ff-only`;
   - `node scripts/pr.mjs cleanup <branch>`;
   - tell me in 1 line: merged, with the link.
8. After the merge:
   - `release/*` branch: remind me that the `release-tag` Action will tag it;
   - other branches: if `node scripts/version.mjs mode` is `full`, run `/release`; otherwise remind me that I can run `/release`;
   - `feat/<name>` branch: remind me of `/retro <name>`.
