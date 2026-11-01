---
order: 4
title: Switching machine or account
description: /handoff saves todo, spec and unfinished code to the remote; /resume continues on the new side.
---

# Switching machine or account

All the state needed to continue lives in the repo: todo (`TODO.md`, `docs/todo/`), specs, plans (`docs/plans/`), ADRs, the prompt log; unfinished code lives at the `wip/<branch>` ref on the remote. Claude's auto memory is off for the project.

```mermaid
flowchart TD
    TRIG{"Why stop?"} -->|"Your call: other machine, other account, /clear"| HO
    TRIG -->|"5h/7d usage ≥ 90%"| GUARD["usage-guard hook: blocks every tool except handoff work; blocks Stop until saved"]
    GUARD --> HO
    HO["/handoff: Stopped at and Next into docs/todo/part.auto.md, spec, rename the plan"] --> SYNC["todo.mjs sync: From manual section, TODO.md"]
    SYNC --> CT["Commit chore(todo): todo, spec, plan only; no green verify needed"]
    CT --> SAVE["wip.mjs save: snapshot the working tree except history/ into a detached commit, push branch and wip/branch"]
    SAVE --> MARK["Write .claude/state/handoff.json: guard allows Stop, blocks every other tool"]
    MARK --> NEW(["New machine or account"])
    NEW --> PULL["git pull"]
    PULL --> SS["SessionStart hook: todo in progress, wip snapshots"]
    SS --> RES["/resume: wip.mjs status, pick the work"]
    RES --> PICK{"Snapshot for the branch?"}
    PICK -->|"Yes"| REST{"wip.mjs restore: clean working tree and snapshot matches HEAD?"}
    REST -->|"Yes"| APPLY["Apply the changes to the working tree, delete wip/branch on the remote"]
    REST -->|"No"| ASK["Report verbatim, ask you; never discard changes"]
    PICK -->|"No"| READ
    APPLY --> READ["Read the spec and the files under Next"]
    READ --> NEXT["Report position, next step, check command; wait for your confirmation"]

    classDef human fill:#fff4d6,stroke:#c98a00,color:#000
    class TRIG,ASK,NEXT human
```

Two-layer todo: you write `docs/todo/<part>.md` by hand, in any language (Claude only reads it and may only tick `[x]`); Claude writes `docs/todo/<part>.auto.md` through `/todo` and `/handoff`. `TODO.md` is generated and links to both.
