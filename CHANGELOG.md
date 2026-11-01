# Changelog — claude-starter

The project-wide version. Each release lists the version of every part; details live in that part's changelog.
Changes that belong to no part (for example `versions.json`) go under `Unreleased` below.

## [Unreleased]

### Added

- `.github/workflows/`: `verify` runs `scripts/verify.sh` for every PR (the required status check); `release-tag` tags `vX.Y.Z` after the release PR merges.
- `history/prompts/`: prompt history (committed to git, outside versioning), backfilled with the claude.ai conversation that built the kit.
- `versions.json`: an `ignore` list; the version tool skips these paths. A root `.gitignore`.
- `.gitattributes`: LF for every text file.
- `.githooks/`: `commit-msg` and `pre-commit` (blocks `.env*`, Claude's local files, conflict markers, the `.allow-red` flag on main).
- Tag `v0.1.0` added retroactively on release commit f8379b7.
- `.vscode/`: `settings.json` (LF, format on save with Prettier, Git Bash terminal) and `extensions.json` (Claude Code, Prettier, ESLint, Markdown Mermaid).

### Changed

- `.githooks/`, `.github/workflows/`, `.gitattributes`, `history/README.md`: comments, messages and step names are in English (ADR 0020R); the prompt log field `ket_qua` is now `commits`.
- `.githooks/pre-commit`: blocks commits on `main` (main only accepts PRs); drops the `.allow-red` check on main, which this covers.
- `.githooks/pre-commit`: runs Prettier on staged files and restages them (hand-edited files); partially staged files are only checked and blocked if off. Runs only when the project has Prettier.
- `versions.json`: adds `automation` (`mode: changelog`, `confirmRelease: true`) for the kit repo itself.

### Removed

- **BREAKING:** `tools/version.mjs` moved to `scripts/version.mjs`; the old command is gone.

## [0.1.0] - 2026-11-01

The first versioned release: a Claude Code setup for a full-stack monorepo, with the two-phase workflow through one trial run.

### Added

- `tools/version.mjs`: a version per part, a changelog per part, releases with one command.

| Part    | Version | Changelog                                                                    |
| ------- | ------- | ---------------------------------------------------------------------------- |
| .claude | 0.1.0   | [.claude/CHANGELOG.md](.claude/CHANGELOG.md)                                 |
| docs    | 0.1.0   | [docs/CHANGELOG.md](docs/CHANGELOG.md)                                       |
| scripts | 0.1.0   | [scripts/CHANGELOG.md](scripts/CHANGELOG.md)                                 |
| example | 0.1.0   | [example/CHANGELOG.md](example/CHANGELOG.md)                                 |
| shared  | 0.1.0   | [example/packages/shared/CHANGELOG.md](example/packages/shared/CHANGELOG.md) |
| be      | 0.1.0   | [example/apps/backend/CHANGELOG.md](example/apps/backend/CHANGELOG.md)       |
| fe      | 0.1.0   | [example/apps/web/CHANGELOG.md](example/apps/web/CHANGELOG.md)               |
| mobile  | 0.1.0   | [example/apps/mobile/CHANGELOG.md](example/apps/mobile/CHANGELOG.md)         |
