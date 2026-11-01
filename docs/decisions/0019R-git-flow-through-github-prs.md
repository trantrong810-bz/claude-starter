---
number: 0019
scope: broad # broad | feature
status: accepted # proposed | accepted | superseded
superseded-by: # number of the new ADR, only when superseded
date: 2026-11-01
model: claude-opus-5-5
source: requests "define the git flow Claude works with" and "push to github and merge automatically through github"; plan docs/plans/github-pr-flow.md; supersedes 0007R, amends 0014R
---

# Every change reaches main through a GitHub PR; the user agrees in chat, GitHub rebase-merges when CI is green

## Context

Under 0007R and 0014R, Claude never pushed, merged `--ff-only` locally after the user approved in chat, and small tasks were committed straight to `main`. The user wants to push to GitHub and let GitHub merge. Three points had to be settled: whether the user still approves, whether small tasks need a PR, and where release tags are created. Claude opens PRs with the user's account, and GitHub does not let authors approve their own PRs, so "required review" cannot work for a solo developer.

## Options

- Approval:
  - (a) Claude asks in chat before enabling auto-merge. Keeps the approval point, but the user must be present.
  - (b) Fully automatic when CI is green. Fast, but CI is the only referee.
  - (c) Automatic except for large tasks. Needs self-classification, which drifts.
- Small tasks:
  - (a) Every change goes through a PR, with `main` protected by a ruleset. One flow, CI checks every commit.
  - (b) Small tasks still push straight to `main`. Fewer steps, but the ruleset must allow a bypass, so CI cannot stop a broken commit.
- Releases:
  - (a) `/release` on a `release/vX.Y.Z` branch through a PR; an Action tags after merge. Still triggered by the user.
  - (b) An Action bumps and tags after every merge. The Action would have to push to the protected `main`, and versions would jump with every PR.

## Decision

(a) for all three points (the user's choice). Merges are rebase-only: they keep the layer commits and the linear history of 0007R/0014R. Squash drops the layers; merge commits branch the history. `/ship` wraps the whole flow. `gh pr merge` is in `ask` in `settings.json`, adding an approval layer at the tool level.

## Consequences

- `main` only changes through PRs with a green `verify` job. Commits on a local `main` are blocked by `commit-guard.sh` and `.githooks/pre-commit`.
- Rebase-merge changes commit hashes, which has two consequences:
  - `git branch -d` cannot delete merged branches. `scripts/pr.mjs cleanup` (compares patches) replaces it.
  - Nothing can be tagged before merge. `version.mjs release --no-tag`, then the `release-tag` Action tags.
- Needs a logged-in `gh` CLI and one run of `scripts/github-setup.sh` per repo. Private repos on the Free plan have no rulesets/auto-merge.
- A pushed branch that needs a rebase would need a force push, which is forbidden. Claude stops and asks the user.
- Amends 0014R on push, merge and tags. The rest of 0014R (commit messages, forbidden commands, line endings) stands.
