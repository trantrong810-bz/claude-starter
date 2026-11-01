# Strategy: bringing Superpowers into the project (NOT a detailed plan yet)

Source: the todo item in `docs/todo/root.md` — install Superpowers and bring it into the current workflow.
Status: strategy under discussion with the user. **No detailed plan is written** until the user approves the strategy.

## Rule set by the user (not saved yet — save it to the repo CLAUDE.md after leaving plan mode)

- When planning: present the **strategy** for the user's approval first, then write the detailed plan.

## Principles (settled by the user)

1. The main flow is the project's own (small/medium/large classification, `/plan-feature`, `/build-feature`, `/ship`, `/handoff`, `/resume`, specs + todo in the repo).
2. Superpowers is used only for specific cases.
3. Controlled and stable use: vendor it into the project's `external/` folder, pin the version, update deliberately.

## Combined strategy (proposal, awaiting approval)

- Vendor only the chosen skills; drop the session-start hook and `using-superpowers`.
- 3 layers: `.claude/` (the project's, wins) · `external/superpowers/` (pristine, NEVER EDITED, zero diff with upstream) · the project's customization layer (CLAUDE.md + commands).
- Claude Code does not load `external/` on its own → it is used only when the routing table in CLAUDE.md or a command step points to it (reading SKILL.md by path).
- **Disable the user-level plugin `superpowers@superpowers-dev` in the repo's `.claude/settings.json`** (it still injects its hook into every session) — verify it is really off.
- A file `external/superpowers.md` (outside the vendor folder): UPSTREAM (source, pinned tag/SHA, date, list of kept skills) + a **mapping table** for every overlap: source, terms, inputs and outputs on each side, direction (project follows / project overrides), reason. It covers the `superpowers:xyz` cross-references, commit steps and the `docs/superpowers/...` paths inside skills.
- Updates: a `chore/bump-superpowers` branch → a bump script pulls the listed skills from the new tag → review the diff of the kept skills → run 2–3 fixed sample tasks before/after → update `external/superpowers.md` → `/ship`.
- Exclude `external/` from format.sh, lint, `pnpm verify`, the workspace, the changelog hook and the language check.
- Fallback check: delete `external/superpowers/` → the original flow still works.
- A broad ADR, updated diagrams in `docs/workflows/` + `node scripts/workflow.mjs index`, the `.claude` changelog.

## Routing table by case (draft)

| Case                                           | Skill                          | Hooked into                                    |
| ---------------------------------------------- | ------------------------------ | ---------------------------------------------- |
| Medium/large task, unclear requirements        | brainstorming                  | short plan in chat / step 2 of `/plan-feature` |
| Writing logic with tests                       | test-driven-development        | phase 1 RED, phase 2 GREEN                     |
| Hard bug, verify/tests red for no clear reason | systematic-debugging           | every kind of task                             |
| Before reporting done/committing               | verification-before-completion | evidence from `pnpm verify`                    |
| Handling code-reviewer output / PR reviews     | receiving-code-review          | step 6 of `/build-feature`, `/ship`            |

Not used: using-superpowers, using-git-worktrees, finishing-a-development-branch, executing-plans, subagent-driven-development, requesting-code-review (the project's `code-reviewer` subagent stays), `/build-feature` + `app-builder` unchanged.

## Open questions (for the user to settle)

1. Vendoring: a submodule (the user's earlier choice) or a selective copy of the chosen skills + a bump script (proposed, matching "vendor only the skills we use")?
2. Customizing skills: hook them into existing commands (proposed) or wrapper skills in `.claude/skills/` (note: those auto-activate by description)?
3. Is the case table complete? Are `writing-plans` and `dispatching-parallel-agents` used?
