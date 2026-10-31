# Changelog

Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/); version theo [SemVer](https://semver.org/lang/vi/).
Ghi thay đổi vào mục `Unreleased` cùng commit; `node tools/version.mjs release` sẽ tự chuyển nó thành version mới.

## [Unreleased]

### Changed

- `.gitignore`: bỏ qua `.claude/state/`.

## [0.1.0] - 2026-11-01

### Added

- Monorepo pnpm workspaces + Turborepo (typecheck, lint, test).
- TypeScript strict dùng chung (`tsconfig.base.json`).
- ESLint: typescript-eslint và quy tắc ranh giới import (app chỉ import `@app/shared`).
- Prettier.
