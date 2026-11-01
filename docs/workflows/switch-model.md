---
order: 6
title: When to switch models
description: Opus for plans and contracts, Sonnet for code; switch only right after /clear.
---

# When to switch models

| Stage                         | Model  | Why                                                  |
| ----------------------------- | ------ | ---------------------------------------------------- |
| Phase 1: plan, contract, test | Opus   | Needs thinking; mistakes here cost the most.         |
| Phase 2: code, subagents      | Sonnet | Token-heavy, and tests already act as the referee.   |
| Small and medium tasks        | Sonnet | Enough for a narrow scope.                           |
| Switching models              | —      | Only right after `/clear`, to keep the prompt cache. |
