# Changelog

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [SemVer](https://semver.org/).
Record changes under `Unreleased` in the same commit (the `versioner` subagent fills it when automation is on); `node scripts/version.mjs release` turns it into a new version.

## [Unreleased]

### Added

- `lang.mjs check [--all]`: lists lines with Vietnamese letters outside the hand-written todo files and `history/prompts/` (ADR 0020R); `verify.sh` (and so CI and the Stop hook) runs it.
- `commit-msg.mjs`: rejects commit messages with Vietnamese letters in the body as well as the header.
- `pr.mjs`: `stale` and `cleanup <branch>` clean up local branches after a GitHub rebase-merge (compared by patch; deletes only when every commit is on main).
- `github-setup.sh`: `main` ruleset (PRs only, CI `verify` green, linear history, rebase only) and auto-merge; safe to rerun.
- `version.mjs`: `release --no-tag` (release through a PR) and `tag`, which tags the `release: vX.Y.Z` commit (CI runs it after merge).
- `workflow.mjs`: `index` generates `docs/WORKFLOW.md` from the front matter of `docs/workflows/*.md`; `check` runs in verify.
- `todo.mjs`: `sync` (manual → auto, generates `TODO.md`), `check` (runs in verify), `brief`.
- `wip.mjs`: `save`, `status`, `restore`, `drop` for unfinished-work snapshots at `wip/<branch>`.
- `verify.sh` runs `todo.mjs check`; `.githooks/pre-commit` syncs todo when a manual file is committed.
- `adr.mjs`: `new`, `index`, `check` for ADRs in `docs/decisions/`.
- `version.mjs` (moved from `tools/`): `init` sets up a new project, `mode`, `check --json` for `versioner`, `check --auto` respects the off mode; projects without a tag compare against the first commit.
- `commit-msg.mjs`: validates commit messages against `docs/GIT.md` (file, `--message`, `--command` for the hook).

### Changed

- **BREAKING:** every script prints and documents in English (ADR 0020R). Parsed identifiers are renamed:
  - `adr.mjs`:
    - The `--rong` flag is now `--broad`.
    - Frontmatter keys: `number`, `scope`, `status`, `superseded-by`, `date`, `source`.
    - `scope` values: `broad`/`feature`. `status` values: `proposed`/`accepted`/`superseded`.
  - `todo.mjs`:
    - `*.auto.md` sections are now `From manual`, `In progress`, `To do`, `Recently done`.
    - Item markers are now `from:` and `branch:`.
  - `workflow.mjs`: front matter keys are now `order`, `title`, `description`.
- `verify.sh`: `VERIFY_BASE` picks the baseline for affected packages (CI sets `origin/main`; default `HEAD`).
- `verify.sh`: adds a quick part (secret scan of `history/`, ADR check) and the `--quick` flag.
- `try-example.sh`: no longer copies the kit's ADRs into the demo.
- `verify.sh --quick`: also checks for missing changelogs when automation is on.
- `try-example.sh`: runs `version.mjs init` in the demo.
- `try-example.sh`: copies `.githooks/` and `.gitattributes`, sets `core.hooksPath`, makes a conventional first commit.
- `try-example.sh`: copies `.vscode/` into the demo.

### Fixed

- `version.mjs`: editing a changelog file no longer counts as a change to its part (it used to require a changelog entry for the changelog itself).
- `version.mjs`: only entries that start with `BREAKING` bump major; the word in the middle of a sentence no longer counts.
- `adr.mjs`, `version.mjs`: read CRLF files (Windows).
- `version.mjs`: `git describe --match` uses double quotes, so tags are found on Windows.

## [0.1.0] - 2026-11-01

### Added

- `verify.sh`: typecheck + lint + test only for affected packages (`--filter=...[HEAD]`), runs every task (`--continue`), terse output; skips tests when the `.allow-red` flag is set.
- `try-example.sh`: builds a runnable demo monorepo from `example/` with the full setup.
