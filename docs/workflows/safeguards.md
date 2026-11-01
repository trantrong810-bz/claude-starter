---
order: 2
title: Automatic safeguards
description: Hooks, permissions and verify that run on every task without being called.
---

# Automatic safeguards

These mechanisms work on every kind of task without being called.

```mermaid
flowchart TD
    SS["SessionStart hook: unfinished specs, todo (todo.mjs brief), wip snapshots, flags, git state (branch, uncommitted, merged on GitHub or not, missing tag), remember the model"] --> PROMPT
    PROMPT["UserPromptSubmit hook: log the redacted prompt to history/"] --> EDIT
    EDIT["Claude edits a file"] --> FMT["PostToolUse hook: Prettier"]
    FMT --> WORK["Keep working"]
    WORK --> COMMIT{"Claude runs git commit?"}
    COMMIT -->|"Yes"| CGUARD{"commit-guard hook: message, branch name, on main, --no-verify, amend of pushed commit?"}
    CGUARD -->|"Wrong: blocked with the reason"| WORK
    CGUARD -->|"Follows docs/GIT.md"| GUARD{"version-guard hook: do changed parts have a changelog?"}
    GUARD -->|"Missing, mode not off"| VERS["versioner subagent (Haiku) fills Unreleased"]
    VERS --> COMMIT
    GUARD -->|"Present, or mode off"| GITHOOK["Git hooks if enabled: commit-msg, pre-commit (blocks commits on main, forbidden files, Prettier on staged files then restage)"]
    GITHOOK --> WORK
    HUMAN["A person edits by hand"] --> SAVE["VSCode format on save: Prettier"]
    SAVE --> HCOMMIT["The person runs git commit"]
    HCOMMIT --> GITHOOK
    WORK --> STOP{"Claude is about to finish"}
    STOP --> DIFF{"Changes in apps/ or packages/?"}
    DIFF -->|"No"| QUICK["verify --quick: secret scan of the log, ADR, todo, workflow index, language"]
    QUICK -->|"OK"| END(["Allowed to finish"])
    QUICK -->|"Errors"| BLOCK
    DIFF -->|"Yes"| FLAG{"Is the .allow-red flag set?"}
    FLAG -->|"No"| VERIFY["pnpm verify: typecheck, lint with import boundaries, test"]
    FLAG -->|"Yes: phase 1"| VERIFYP1["pnpm verify: typecheck, lint, tests skipped"]
    VERIFY -->|"OK"| END
    VERIFYP1 -->|"OK"| END
    VERIFY -->|"Errors"| BLOCK["Blocked, terse errors back to Claude"]
    VERIFYP1 -->|"Errors"| BLOCK
    BLOCK --> WORK
    END --> LOGM["Stop hook: log the turn's model, effort, subagents, commits"]

    PERM["Permissions deny: .env, old migrations, rm -rf, force push; ask: gh pr merge"] -.->|"Always on"| EDIT
    PUSH["/ship: branch to GitHub, open a PR"] --> CI{"GitHub Action verify; main ruleset: PRs only, green CI, linear history, rebase only"}
    CI -.->|"Red: merge blocked"| WORK
    USAGE{"usage-guard hook: 5h/7d usage ≥ 90%? (numbers from the status line)"} -.->|"Not saved: only /handoff; saved: every tool blocked"| WORK
```

A commit with a hand-written todo file (`docs/todo/<part>.md`): pre-commit (people) or commit-guard (Claude, when `.githooks` is not enabled) runs `todo.mjs sync` and stages the auto file + `TODO.md` into the same commit. `verify` runs `todo.mjs check` so the overview never drifts, and `lang.mjs check` so the repo stays English (ADR 0020R).

The full git conventions (commit messages, branches, merge, tags, forbidden commands): [GIT.md](../GIT.md), loaded into every session through `CLAUDE.md`.
