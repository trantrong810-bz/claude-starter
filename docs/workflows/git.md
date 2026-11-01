---
order: 3
title: Git flow through GitHub
description: Every change on a short branch; /ship pushes, opens a PR, you agree, GitHub rebase-merges when CI is green.
---

# Git flow through GitHub

`main` only accepts changes through PRs. GitHub rebase-merges when the `verify` job is green (ruleset set by `scripts/github-setup.sh`). Full conventions: [GIT.md](../GIT.md).

```mermaid
flowchart TD
    TASK(["New task, classified"]) --> PULL["git switch main, git pull --ff-only"]
    PULL --> BR["git switch -c feat|fix|refactor|chore|docs/name"]
    BR --> WORK["Edit, pnpm verify"]
    WORK --> COMMIT["git commit: one logical change, with changelog"]
    COMMIT --> CG{"commit-guard, version-guard"}
    CG -->|"Wrong: blocked with the reason"| WORK
    CG -->|"OK"| MORE{"More work?"}
    MORE -->|"Yes"| WORK
    MORE -->|"No"| SHIP["/ship: verify, fetch; rebase on origin/main if main moved on"]
    SHIP --> PUSH["git push -u origin branch"]
    PUSH --> PR["gh pr create: summary, commits, Refs, verify"]
    PR --> ASK{"You agree to merge?"}
    ASK -->|"Not yet: keep fixing"| WORK
    ASK -->|"OK"| AUTO["gh pr merge --auto --rebase"]
    AUTO --> CI{"CI verify on GitHub"}
    CI -->|"Red"| FIXCI["gh run view --log-failed, fix, commit, push"]
    FIXCI --> CI
    CI -->|"Green"| MERGED["GitHub rebase-merges into main, deletes the remote branch"]
    MERGED --> SYNC["git switch main, git pull --ff-only"]
    SYNC --> CLEAN["pr.mjs cleanup branch: delete locally once every patch is on main"]
    CLEAN --> AFTER{"Which branch?"}
    AFTER -->|"release/vX.Y.Z"| TAG["release-tag Action tags it"]
    AFTER -->|"feat/"| RETRO["Remind /retro; /release in full mode"]
    AFTER -->|"Other"| DONE(["Done"])
    TAG --> DONE
    RETRO --> DONE

    HO["/handoff midway"] -.->|"Push branch and wip/branch, no PR"| PUSH

    classDef human fill:#fff4d6,stroke:#c98a00,color:#000
    class ASK human
```

- Claude never pushes `main` and never force-pushes. If a pushed branch needs a rebase, it stops and asks you.
- `gh pr merge` is in `ask` in `settings.json`: on top of the question in chat, the tool asks once more.
- Rebase-merge creates new commits on `main`, so `git branch -d` refuses to delete the branch. Use `node scripts/pr.mjs cleanup <branch>` (compares patches). The SessionStart hook lists branches to clean up.
