# Changelog

Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/); version theo [SemVer](https://semver.org/lang/vi/).
Ghi thay đổi vào mục `Unreleased` cùng commit (subagent `versioner` tự điền khi bật tự động); `node scripts/version.mjs release` chuyển nó thành version mới.

## [Unreleased]

### Added

- `adr.mjs`: `new`, `index`, `check` cho ADR trong `docs/decisions/`.
- `version.mjs` (chuyển từ `tools/`): `init` tạo cấu hình cho dự án mới, `mode`, `check --json` cho `versioner`, `check --auto` tôn trọng chế độ tắt; dự án chưa có tag so với commit đầu.

### Changed

- `verify.sh`: thêm phần nhanh (quét secret trong `history/`, kiểm tra ADR) và cờ `--quick`.
- `try-example.sh`: không chép ADR của kit sang dự án demo.
- `verify.sh --quick`: kiểm tra thêm changelog thiếu khi bật tự động.
- `try-example.sh`: tự chạy `version.mjs init` trong demo.

### Fixed

- `version.mjs`: sửa file changelog không còn bị tính là thay đổi của phần (trước đây đòi ghi changelog cho chính changelog).
- `version.mjs`: chỉ mục bắt đầu bằng `BREAKING` mới làm bump major; chữ BREAKING nằm giữa câu không còn bị tính.

## [0.1.0] - 2026-11-01

### Added

- `verify.sh`: typecheck + lint + test chỉ cho package bị ảnh hưởng (`--filter=...[HEAD]`), chạy hết task (`--continue`), output gọn; bỏ qua test khi có cờ `.allow-red`.
- `try-example.sh`: dựng monorepo demo chạy được từ `example/` cùng toàn bộ cấu hình.
