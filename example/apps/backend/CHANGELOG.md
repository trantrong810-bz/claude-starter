# Changelog

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [SemVer](https://semver.org/).
Record changes under `Unreleased` in the same commit (the `versioner` subagent fills it when automation is on); `node scripts/version.mjs release` turns it into a new version.

## [Unreleased]

### Changed

- Comments and test data are in English (ADR 0020R).

## [0.1.0] - 2026-11-01

### Added

- `createTodo` and `listTodos` handlers validated with the shared schemas; with tests.
