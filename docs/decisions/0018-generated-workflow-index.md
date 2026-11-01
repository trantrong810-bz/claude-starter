---
number: 0018
scope: feature # broad | feature
status: accepted # proposed | accepted | superseded
superseded-by: # number of the new ADR, only when superseded
date: 2026-11-01
model: claude-opus-5-5
source: request "split the workflows in docs/WORKFLOW.md into separate files" and "what happens when we add a workflow later?"; plan docs/plans/split-workflows.md
---

# One file per workflow in docs/workflows/; docs/WORKFLOW.md is a generated index

## Context

`docs/WORKFLOW.md` collected every workflow diagram in one long file that got harder to read and edit with each new workflow. With one file per workflow, the index in `WORKFLOW.md` has to stay in sync with the folder. Forgetting to add a line for a new workflow would leave the index wrong without anyone noticing.

## Options

- An index generated from front matter (`order`, `title`, `description`; originally Vietnamese keys, renamed by ADR 0020R) by `scripts/workflow.mjs index`, with `check` in `verify --quick`. It cannot drift, and it works like `adr.mjs` and `todo.mjs`. The cost is one more script and front matter in every file.
- A hand-written index, with `check` only matching links against files. No front matter, but you still write the index line by hand.
- Only a rule in `CLAUDE.md`. No code, but nothing catches a mistake.

## Decision

Option 1 (the user's choice). It reuses the `adr.mjs` pattern (read front matter, compare the index ignoring Prettier's table alignment). The template for a new workflow is `docs/workflows/_template.md`.

## Consequences

- New workflow: copy `_template.md`, fill it in, run `node scripts/workflow.mjs index`. If forgotten, the Stop hook (`verify --quick`) blocks.
- Never edit `docs/WORKFLOW.md` by hand; to change its intro, edit `renderIndex` in `scripts/workflow.mjs`.
- Old links of the form `WORKFLOW.md#...` are broken; new links point straight to the workflow files.
