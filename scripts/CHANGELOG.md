# Changelog

Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/); version theo [SemVer](https://semver.org/lang/vi/).
Ghi thay đổi vào mục `Unreleased` cùng commit; `node tools/version.mjs release` sẽ tự chuyển nó thành version mới.

## [Unreleased]

## [0.1.0] - 2026-11-01

### Added

- `verify.sh`: typecheck + lint + test chỉ cho package bị ảnh hưởng (`--filter=...[HEAD]`), chạy hết task (`--continue`), output gọn; bỏ qua test khi có cờ `.allow-red`.
- `try-example.sh`: dựng monorepo demo chạy được từ `example/` cùng toàn bộ cấu hình.
