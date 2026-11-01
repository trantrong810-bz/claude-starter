# Changelog

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [SemVer](https://semver.org/).
Record changes under `Unreleased` in the same commit (the `versioner` subagent fills it when automation is on); `node scripts/version.mjs release` turns it into a new version.

## [Unreleased]

### Added

- ADR 0020R: everything in the repo is English except hand-written todo files; spec `docs/specs/english-only.md`.
- `GIT.md`: a "WIP snapshots" section, a verify exception for commits containing only todo/spec/plan files, `/handoff` may push.
- `WORKFLOW.md`: a "Switching machine or account" diagram, usage-guard in the safeguards diagram.
- README, SETUP: two-layer todo, switching machine/account; ADR 0017R; `docs/plans/todo-wip.md`.
- `docs/decisions/`: the ADR template, a generated index and 11 ADRs for the decisions made while building the kit.
- `WORKFLOW.md`: a history lookup diagram; ADR creation points and the logging hook in the older diagrams.
- README, SETUP: a section on prompt history and decisions.
- ADR 0012R (the version tool ships with the kit) and 0013R (automatic versioning, off mode).
- `GIT.md`: git conventions — commit messages, branches, merge, rewriting history, tags, push, line endings.
- ADR 0014R: shared git conventions, loaded into every session and enforced by hooks.
- ADR 0016R: the git pre-commit hook formats staged files.
- `WORKFLOW.md`: the hand-edit flow → format on save → pre-commit Prettier.
- ADR 0015R: Windows 11 + VSCode is the standard environment; scripts stay POSIX.

### Changed

- **BREAKING:** all docs, ADRs, plans, templates and changelogs are in English (ADR 0020R). File names change: ADR slugs (for example `0003R-task-classification.md`), workflow files (`overview`, `safeguards`, `git`, `switch-machine`, `lookup`, `switch-model`, `release`) and plans (`split-workflows.md`, `superpowers-strategy.md`, `english-only.md`). Links to the old names break.
- **BREAKING:** the ADR frontmatter, workflow front matter and todo auto sections use the English keys and section names introduced in `scripts/` (ADR 0020R). Existing files are migrated.
- `GIT.md`: `main` only accepts PRs (`/ship`, rebase-merge, auto-merge after the user agrees), `release/vX.Y.Z` branches, tags created by CI, branch cleanup with `pr.mjs`; ADR 0019R supersedes 0007R. README, SETUP: the PR flow and GitHub setup.
- `workflows/git.md`: the git flow through GitHub PRs; overview, safeguards and release diagrams updated for `/ship`, CI and Action-created tags.
- `WORKFLOW.md` becomes a generated index; each workflow diagram lives in its own file in `docs/workflows/` (with `_template.md`); ADR 0018. The README links straight to the workflow files.
- Spec template: a "Contested decisions" line in Contract.
- `WORKFLOW.md`: the commit-blocking hook in the safeguards diagram; the release diagram follows `automation.mode`.
- README, SETUP: automatic versioning settings and `version.mjs init`.
- `WORKFLOW.md`: `commit-guard` and git hooks in the safeguards diagram; the fast-forward merge step; SessionStart reports the git state.
- README, SETUP: the new git pieces, the `core.hooksPath` setup step, optional permissions.
- README, SETUP: Environment/Requirements sections (Windows 11, VSCode, Git for Windows), `.vscode/` in the component list, the `chmod` note for Windows.

## [0.1.0] - 2026-11-01

### Added

- `README.md`: principles, setup, task classification, the two-phase workflow, versioning.
- `SETUP.md`: the component table and the steps to add the kit to an existing project.
- `docs/WORKFLOW.md`: Mermaid diagrams for the workflow, the automatic safeguards and releases.
- `docs/specs/_template.md`: a spec template with Contract and a per-phase checklist.
