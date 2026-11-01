---
description: Look up why / when / who (which model) decided or asked for something — searches ADRs, specs, git, the prompt log
argument-hint: <question, e.g. "why use feat branches?" or "which decisions did sonnet make?">
---

Question: $ARGUMENTS

Search in this order and STOP as soon as you can answer. Use Grep and read only the matching passages — never whole large files.

1. **ADR** — `docs/decisions/README.md` (the index, with a Model column), then the matching ADR file. Skip `superseded` ADRs unless the question is about history; if you use one, name the ADR that replaced it.
2. **Spec** — `docs/specs/*.md`, the Contract and Notes sections.
3. **Git** — `git log --oneline --grep=<keyword>` and the `CHANGELOG.md` files.
4. **Prompt log** — `history/prompts/*.jsonl`. Each prompt has two lines with the same `id`: the `prompt` line and the `"type":"model"` line (model, effort, subagents, commits — older lines call that field `ket_qua`). If an `id` has several `model` lines, the last one is right. Filter by model with Grep on `"model":"<name>"`, then take the matching `id`s. Prompts are stored in the user's own language. If the log is large (>2,000 matching lines), hand it to an Explore subagent and take back only the result.

Answer:

- The direct answer in 1–3 sentences.
- Sources: `file:line`, commit hash, or prompt id — one source per claim.
- Name the model/effort when the question is about who decided or handled something.
- If nothing is found, say so and say where you looked. Do not guess.
