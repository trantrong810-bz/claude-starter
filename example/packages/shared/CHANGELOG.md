# Changelog

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [SemVer](https://semver.org/).
Record changes under `Unreleased` in the same commit (the `versioner` subagent fills it when automation is on); `node scripts/version.mjs release` turns it into a new version.

## [Unreleased]

### Changed

- Comments are in English (ADR 0020R).

## [0.1.0] - 2026-11-01

### Added

- Zod schemas `TodoSchema`, `CreateTodoSchema` and the `API.todos` route.
- `createTodo` client: parses responses with the schema; tested with a fake `fetch`.
