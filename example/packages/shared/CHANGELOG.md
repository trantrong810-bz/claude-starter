# Changelog

Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/); version theo [SemVer](https://semver.org/lang/vi/).
Ghi thay đổi vào mục `Unreleased` cùng commit; `node tools/version.mjs release` sẽ tự chuyển nó thành version mới.

## [Unreleased]

## [0.1.0] - 2026-11-01

### Added

- Schema Zod `TodoSchema`, `CreateTodoSchema` và route `API.todos`.
- Client `createTodo`: parse response bằng schema; test với `fetch` giả.
