---
order: 5
title: History and lookup
description: /why finds answers in ADRs, specs, git, changelogs and the prompt log.
---

# History and lookup

Every prompt is logged to `history/prompts/` (committed to git, outside versioning, without answers, in the user's own language). Every contested decision becomes an ADR in `docs/decisions/`; broad decisions have an R.

```mermaid
flowchart TD
    Q["/why question"] --> A1{"Does an ADR answer it?"}
    A1 -->|"Yes"| ANS["Answer in 1–3 sentences, with sources file:line, commit, prompt id, model"]
    A1 -->|"No"| A2{"Spec?"}
    A2 -->|"Yes"| ANS
    A2 -->|"No"| A3{"git log and changelogs?"}
    A3 -->|"Yes"| ANS
    A3 -->|"No"| A4{"Prompt log?"}
    A4 -->|"Yes"| ANS
    A4 -->|"No"| NONE["Report nothing found and where you looked"]
```
