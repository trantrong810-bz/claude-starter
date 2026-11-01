# Git flow through GitHub: Claude pushes, opens a PR, GitHub merges when CI is green

> Historical plan (ADR 0019R), translated to English by ADR 0020R. File names, front matter keys and frontmatter values are quoted as they were at the time; ADR 0020R renamed them.

## Context

Today `docs/GIT.md` says: Claude never pushes, merges `--ff-only` locally, and the user approves merges in chat (ADR 0007R, 0014R). The user wants to **push to GitHub and let GitHub merge**. Three points are settled:

- **Approval:** Claude pushes and opens a PR, sends the link and **asks in chat**. When you agree, Claude enables auto-merge and GitHub merges when CI is green. GitHub does not let authors approve their own PRs, so "required review" is not used.
- **Every change through a PR:** `main` is protected (no direct pushes, green CI required, linear history). Small tasks also get a short branch.
- **Releases through a PR:** `/release` runs on a `release/vX.Y.Z` branch and commits without tagging. After the merge, a GitHub Action tags the right commit on `main`.

Merges use **rebase** (keeps the layer commits, linear history). Merge commits and squash are disabled.

## Step 0: finish the previous work

The `docs/split-workflows` branch is not merged yet (reported last turn). Merge it locally the old way: `git switch main && git merge --ff-only docs/split-workflows && git branch -d docs/split-workflows`. Push `main` to origin before turning on protection. Then create the `feat/github-pr-flow` branch.

**You need to do this yourself** (interactive login, Claude cannot):

```powershell
winget install GitHub.cli
gh auth login          # GitHub.com, HTTPS, scopes including repo + workflow
```

This plan file has the same name as the workflow-split plan, committed in `8535b27`. When starting: copy the content to `docs/plans/github-pr-flow.md`, then `git restore` the old plan file so it stays unchanged.

## 1. CI: `.github/workflows/verify.yml` (new)

- Runs on `pull_request` and on `push` to `main`. The job is named `verify`; it is the required status check.
- Steps: `actions/checkout@v4` with `fetch-depth: 0` (tags and `main` for `version.mjs` and `turbo`), `actions/setup-node@v4` (Node 22).
- With a `package.json` (a real project): `pnpm/action-setup`, `pnpm install --frozen-lockfile`, then `VERIFY_BASE=origin/${{ github.base_ref || 'main' }} bash scripts/verify.sh`.
- Without one (the kit repo): `bash scripts/verify.sh --quick`.

[scripts/verify.sh](scripts/verify.sh): change `--filter='...[HEAD]'` to `--filter="...[${VERIFY_BASE:-HEAD}]"`. Local behaviour is unchanged; in CI it compares against the target branch.

## 2. CI tagging: `.github/workflows/release-tag.yml` (new)

- Runs on `push` to `main`, with `contents: write`.
- If HEAD's subject is `release: vX.Y.Z` and the tag does not exist: run `node scripts/version.mjs tag`, then `git push origin vX.Y.Z` (git user `github-actions[bot]`).

[scripts/version.mjs](scripts/version.mjs):

- `release --no-tag`: commit without tagging. The final message becomes "open a PR: /ship".
- New `tag` command: check that HEAD's subject matches `release: v<project.version>` from `versions.json` and that the tag does not exist, then create an annotated tag. Otherwise report clearly and `exit 1`.
- Update the header comment.

## 3. GitHub repo setup: `scripts/github-setup.sh` (new, safe to rerun)

Uses `gh api` to:

- Repo: `allow_auto_merge=true`, `allow_rebase_merge=true`, `allow_merge_commit=false`, `allow_squash_merge=false`, `delete_branch_on_merge=true`.
- `main` ruleset (created or updated by name): PR required (0 approvals), required status check `verify`, `required_linear_history`, no force push or deletion. No bypass.
- Check first: `gh auth status`. Private repos on the Free plan have no rulesets/auto-merge and the API returns 403; then report "needs a public repo or GitHub Pro" and stop without changing anything halfway.

Claude runs this script once (step 9), after your approval. Document it in SETUP.md for projects using the kit.

## 4. Claude's flow: the `/ship` command (new, `.claude/commands/ship.md`)

1. On a branch other than `main`, clean working tree (`history/` ignored), `pnpm verify` passes.
2. `git fetch origin`. If `main` moved on, `git rebase origin/main` then `pnpm verify` again (rebase stays `ask`).
3. `git push -u origin <branch>`.
4. `gh pr create --base main`:
   - title: the main commit's header, or `<type>(<scope>): <summary>` with several commits;
   - body: a 3–5 line summary, the commit list, `Refs:` spec/ADR, the verify result, the attribution line;
   - if the PR already exists, only push.
5. Send the link and summary, then **ask you**. If you say no, stop; the PR stays open.
6. If you agree: `gh pr merge --auto --rebase`, then `gh pr checks --watch`.
   - CI red: read the log (`gh run view --log-failed`), fix, commit, push, repeat step 6. Auto-merge stays on.
   - Merged: `git switch main && git pull --ff-only`, then `node scripts/pr.mjs cleanup <branch>`.
7. After the merge: if `version.mjs mode` is `full`, run `/release`; otherwise mention that `/release` is available. For `feat/` branches, remind about `/retro`.

## 5. Cleaning up after rebase-merge: `scripts/pr.mjs` (new)

Rebase-merge creates new commit hashes, so `git branch -d` refuses to delete the branch.

- `cleanup <branch>`: if `git cherry main <branch>` has no `+` lines left (every patch is on `main`), delete the local ref with `git update-ref -d` and `git fetch --prune`. If patches are missing, list them and do not delete.
- `stale`: list local branches whose patches are all on `main`.

`git branch -D` stays forbidden; deletion only goes through this check.

## 6. Hooks and permissions

- [.claude/hooks/commit-guard.sh](.claude/hooks/commit-guard.sh):
  - block commits on `main` ("main is protected: create a `<type>/<name>` branch, then commit");
  - the branch-name regex also accepts `release/v[0-9]+\.[0-9]+\.[0-9]+`.
- [.claude/hooks/session-context.sh](.claude/hooks/session-context.sh): the "branches not merged into main" line uses `pr.mjs stale` to separate branches merged on GitHub (suggesting `pr.mjs cleanup`) from branches really not merged.
- [.claude/settings.json](.claude/settings.json):
  - `allow`: `git push -u origin:*`, `git fetch:*`, `git pull --ff-only`, `gh pr create:*`, `gh pr view:*`, `gh pr checks:*`, `gh run view:*`, `node scripts/pr.mjs:*`;
  - `ask`: `gh pr merge:*`, `bash scripts/github-setup.sh`. A tool-level approval layer on top of the question in chat;
  - keep `git push` in `ask` for other cases. `deny` is unchanged (force push, `branch -D`, ...).
- `.githooks/pre-commit`: block commits on `main` for people too, even though GitHub already blocks the push. Reason: avoid commits stuck on a local `main`.

## 7. Existing commands

- [build-feature.md:19](.claude/commands/build-feature.md#L19): replace the local merge with "run `/ship`".
- [release.md](.claude/commands/release.md), reworked:
  1. mode, check, dry-run, ask (unchanged);
  2. `git switch -c release/v<X.Y.Z>` from the latest `main`;
  3. `version.mjs release --no-tag`;
  4. `/ship`.

  CI creates the tag. The command description changes "no push" to "push through a PR".

- `plan-feature.md`: still creates the `feat/` branch. Push only in `/handoff` or `/ship`.
- CLAUDE.md, task classification rule: "small → short branch then `/ship`", "medium → short plan in chat → branch → `/ship`".

## 8. Docs

- [docs/GIT.md](docs/GIT.md):
  - rewrite Branches: `main` only accepts PRs, add `release/vX.Y.Z`;
  - Merge: PR, rebase-merge, auto-merge after the user agrees in chat, cleanup with `pr.mjs`;
  - Tags: created by CI;
  - Push: Claude pushes its own branch in `/ship` and `/handoff`, never `main`;
  - New machine setup: `gh auth login`.
- `docs/workflows/git.md` (new, `thu-tu: 3`): a Mermaid diagram of Claude's git lifecycle, from task to branch, commit (through commit-guard), `/ship`, PR, CI, user approval, auto-merge, pull, cleanup, then release/retro. Later workflows move down one position.
- Diagram updates:
  - `tong-quan.md`: the MERGE/FF node becomes `/ship`; the small and medium paths go through a branch;
  - `lop-bao-ve.md`: commit-guard blocks on main, CI on GitHub;
  - `phat-hanh.md`: release branch, PR, CI tagging.
- Run `node scripts/workflow.mjs index`.
- SETUP.md (Setup, git step): `gh auth login`, copy `.github/`, run `bash scripts/github-setup.sh`. README: one line about the PR flow.
- **ADR 0019R** `git-flow-qua-github-pr`: the options (local merge / PR with approval in chat / fully automatic; release through a PR or CI releasing on its own). ADR 0007R becomes `bi-thay-the` with `thay-the-boi: 0019`. State that 0019R amends the push/merge/tag part of 0014R. Run `adr.mjs index`.
- Changelog `Unreleased`:
  - root: `.github/`;
  - scripts: `pr.mjs`, `github-setup.sh`, `version.mjs tag`/`--no-tag`, `VERIFY_BASE`;
  - claude: `/ship`, hooks, permissions, `**BREAKING:**` commits on main are blocked;
  - docs.

## 9. Order of work and commits on `feat/github-pr-flow`

1. `feat(scripts): add pr cleanup, github setup and release tag support`: pr.mjs, github-setup.sh, version.mjs, verify.sh.
2. `ci: add verify and release tag workflows`
3. `feat(claude)!: ship changes through github pull requests`: `/ship`, hooks, settings, commands, CLAUDE.md, githooks.
4. `docs: describe github pr flow`: GIT.md, workflows, SETUP, README, ADR.
5. The first `/ship`, so this PR tests the new flow: push, open the PR, CI runs. Then **ask you** before running `bash scripts/github-setup.sh`, and **ask you** again before enabling auto-merge.

## Verification

- Local:
  - `bash scripts/verify.sh --quick` prints OK;
  - a test commit on `main` is blocked by commit-guard;
  - `node scripts/version.mjs release --dry-run` runs;
  - `node scripts/version.mjs tag` fails when HEAD is not a release commit;
  - `node scripts/pr.mjs stale` lists the right branches.
- GitHub, on this very PR:
  - the `verify` job is green;
  - after `github-setup.sh`, `gh api repos/{owner}/{repo}/rulesets` shows the `main` ruleset;
  - `git push origin main` is rejected;
  - auto-merge rebase-merges the PR;
  - `pr.mjs cleanup feat/github-pr-flow` deletes the local branch.
- Release, only if you want to try it now: `/release` creates a `release/v...` PR; after the merge, the `release-tag` Action creates the `v...` tag on the release commit.
