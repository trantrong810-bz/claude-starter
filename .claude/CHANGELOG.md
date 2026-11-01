# Changelog

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [SemVer](https://semver.org/).
Record changes under `Unreleased` in the same commit (the `versioner` subagent fills it when automation is on); `node scripts/version.mjs release` turns it into a new version.

## [Unreleased]

### Fixed

- `commit-guard.sh`: removes a stray duplicated block with a lost quote after `exit 0`.

### Added

- `/ship`: pushes the branch, opens a PR, asks the user, enables rebase auto-merge, waits for CI, cleans up the branch.
- `/todo`, `/resume`; `/handoff` also saves the auto todo, plans and unfinished code (`wip.mjs save`) and pushes.
- Hooks `statusline.mjs` (5h/7d/context usage) and `usage-guard.mjs`: at usage ≥ 90% only `/handoff` is allowed, then it stops; threshold `CLAUDE_WIP_THRESHOLD`.
- `settings.json`: `plansDirectory: docs/plans`, `autoMemoryEnabled: false` — all state lives in the repo.
- SessionStart reports todo in progress and `wip/*` snapshots; commit-guard syncs todo when `.githooks` is not enabled.
- Hook `prompt-log.mjs`: logs every prompt (secrets redacted) to `history/prompts/`, with the model, effort, subagents and commits of each turn; off with `CLAUDE_PROMPT_LOG=off`.
- Command `/why`: looks things up in the order ADR → spec → git → prompt log, citing sources and models.
- Hook `version-guard.sh` (PreToolUse): blocks `git commit` when a changed part has no changelog entry, per `automation.mode`.
- Subagent `versioner` (Haiku): reads the diff, fills `Unreleased` under Added/Changed/Fixed/Removed and marks `**BREAKING:**`.
- Command `/release`: fills missing changelogs, previews, asks, then releases; never pushes on its own.
- Hook `commit-guard.sh` (PreToolUse): blocks `git commit` that breaks `docs/GIT.md` — message, branch name, `.allow-red` flag on main, `--no-verify`, `--amend` of a pushed commit.
- `session-context.sh`: reports the branch, uncommitted files, unmerged branches, git hooks not enabled, missing tag for the current version.

### Changed

- **BREAKING:** commands, subagents and hooks are written in English and print English (ADR 0020R). The prompt log field `ket_qua` is now `commits`; `/why` reads both. Commands refer to the English todo sections (`In progress`, `To do`, `Recently done`, `From manual`) and ADR keys (`status`, `superseded-by`, `source`).
- `CLAUDE.md` is written in English and adds the language rule: everything in the repo is English except hand-written todo files (ADR 0020R).
- **BREAKING:** commits on `main` are blocked (commit-guard for Claude, `.githooks/pre-commit` for people); every change reaches `main` through a PR via `/ship`. `/build-feature` and `/release` use `/ship` instead of a local `--ff-only` merge; `/release` works on a `release/vX.Y.Z` branch and does not tag.
- `commit-guard.sh`: accepts `release/vX.Y.Z` branches; only looks at the flags of the `git commit` command itself (no longer misfires on `sed -n ... && git commit`).
- `session-context.sh`: separates branches merged on GitHub (suggesting `pr.mjs cleanup`) from unmerged ones.
- `settings.json`: allows `git push -u origin`, `git fetch`, `git pull --ff-only`, `gh pr create/view/checks`, `gh run view`, `pr.mjs`; asks before `gh pr merge` and `github-setup.sh`.
- `/handoff` creates a branch before committing when on `main`; usage-guard allows `git switch -c`.
- `CLAUDE.md`, `/retro`: workflow diagrams live in `docs/workflows/`; a new workflow copies `_template.md` and runs `workflow.mjs index`.
- `format.sh`: also formats `.mjs`, `.cjs`, `.yml`, `.yaml` (same list as `.githooks/pre-commit`).
- `verify-on-stop.sh`: still runs `verify --quick` (secret scan, ADR check) when no code changed.
- `/plan-feature` and `/retro` create ADRs for contested decisions; `CLAUDE.md` has the ADR and `/why` rules.
- `/build-feature`: a commit missing its changelog calls `versioner`; after merge runs `/release` when `mode` is `full`.
- `CLAUDE.md`: changelog rule per automation mode.
- `CLAUDE.md`: loads `@docs/GIT.md` into every session.
- `settings.json`: registers `commit-guard.sh`; `deny` adds `git clean`, `branch -D`, `tag -d`, `commit --no-verify`, `git config`; `ask` for `git push`, `rebase`, `tag`.
- `/plan-feature`, `/build-feature`, `/release`: Conventional Commits messages; `--ff-only` merges, rebase when main moves on, delete the branch after merge; release only from main.
- `code-reviewer`: checks the `main..HEAD` commit history against `docs/GIT.md`.
- `CLAUDE.md`: Environment section — Windows 11, VSCode, Git Bash, double quotes in `execSync`, LF/CRLF, `git update-index --chmod=+x`.

## [0.1.0] - 2026-11-01

### Added

- `settings.json`: allows safe commands (verify, test, git add/commit/switch); denies `.env`, old migrations, `rm -rf`, force push.
- Hook `format.sh` (PostToolUse): Prettier after every file edit.
- Hook `verify-on-stop.sh` (Stop): blocks finishing while `verify` fails; guards against endless loops; skipped when no code changed.
- Hook `session-context.sh` (SessionStart): reports unfinished specs and warns about the `.allow-red` flag.
- Command `/plan-feature` (phase 1, Opus): `feat/` branch, contract, stubs, red backend tests.
- Command `/build-feature` (phase 2, Sonnet): backend, client in shared, UI; subagents only for large UI; review, then ask before merging.
- Commands `/handoff` and `/retro`.
- Subagents `app-builder` (one app, UI only) and `code-reviewer` (diff `main...HEAD`, with the spec and verify result).
- Sample `CLAUDE.md`: task classification, API client in shared, keeping workflow diagrams in sync, changelog entries.
