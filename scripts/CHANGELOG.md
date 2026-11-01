# Changelog

Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/); version theo [SemVer](https://semver.org/lang/vi/).
Ghi thay đổi vào mục `Unreleased` cùng commit (subagent `versioner` tự điền khi bật tự động); `node scripts/version.mjs release` chuyển nó thành version mới.

## [Unreleased]

### Added

- `todo.mjs`: `sync` (viết tay → auto, sinh `TODO.md`), `check` (chạy trong verify), `brief`.
- `wip.mjs`: `save`, `status`, `restore`, `drop` snapshot code dở ở ref `wip/<nhánh>`.
- `verify.sh` chạy `todo.mjs check`; `.githooks/pre-commit` tự sync todo khi commit file viết tay.
- `adr.mjs`: `new`, `index`, `check` cho ADR trong `docs/decisions/`.
- `version.mjs` (chuyển từ `tools/`): `init` tạo cấu hình cho dự án mới, `mode`, `check --json` cho `versioner`, `check --auto` tôn trọng chế độ tắt; dự án chưa có tag so với commit đầu.
- `commit-msg.mjs`: kiểm tra commit message theo `docs/GIT.md` (file, `--message`, `--command` cho hook).

### Changed

- `verify.sh`: thêm phần nhanh (quét secret trong `history/`, kiểm tra ADR) và cờ `--quick`.
- `try-example.sh`: không chép ADR của kit sang dự án demo.
- `verify.sh --quick`: kiểm tra thêm changelog thiếu khi bật tự động.
- `try-example.sh`: tự chạy `version.mjs init` trong demo.
- `try-example.sh`: chép `.githooks/` và `.gitattributes`, bật `core.hooksPath`, commit đầu đúng quy ước.
- `try-example.sh`: chép `.vscode/` sang demo.

### Fixed

- `version.mjs`: sửa file changelog không còn bị tính là thay đổi của phần (trước đây đòi ghi changelog cho chính changelog).
- `version.mjs`: chỉ mục bắt đầu bằng `BREAKING` mới làm bump major; chữ BREAKING nằm giữa câu không còn bị tính.
- `adr.mjs`, `version.mjs`: đọc được file CRLF (Windows).
- `version.mjs`: `git describe --match` dùng nháy kép, tìm được tag trên Windows.

## [0.1.0] - 2026-11-01

### Added

- `verify.sh`: typecheck + lint + test chỉ cho package bị ảnh hưởng (`--filter=...[HEAD]`), chạy hết task (`--continue`), output gọn; bỏ qua test khi có cờ `.allow-red`.
- `try-example.sh`: dựng monorepo demo chạy được từ `example/` cùng toàn bộ cấu hình.
