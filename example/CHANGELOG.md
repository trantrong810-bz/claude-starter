# Changelog

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [SemVer](https://semver.org/).
Record changes under `Unreleased` in the same commit (the `versioner` subagent fills it when automation is on); `node scripts/version.mjs release` turns it into a new version.

## [Unreleased]

### Changed

- `.gitignore`: ignores `.claude/state/`.
- `eslint.config.js`: comments and boundary messages are in English (ADR 0020R).

## [0.1.0] - 2026-11-01

### Added

- pnpm workspaces + Turborepo monorepo (typecheck, lint, test).
- Shared strict TypeScript config (`tsconfig.base.json`).
- ESLint: typescript-eslint and import boundary rules (apps only import `@app/shared`).
- Prettier.
