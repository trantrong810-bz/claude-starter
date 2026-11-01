# Changelog

Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/); version theo [SemVer](https://semver.org/lang/vi/).
Ghi thay đổi vào mục `Unreleased` cùng commit (subagent `versioner` tự điền khi bật tự động); `node scripts/version.mjs release` chuyển nó thành version mới.

## [Unreleased]

### Added

- `docs/decisions/`: mẫu ADR, mục lục tự sinh và 11 ADR cho các quyết định đã đưa ra khi dựng kit.
- `WORKFLOW.md`: sơ đồ tra cứu lịch sử; điểm tạo ADR và hook ghi log trong các sơ đồ cũ.
- README, SETUP: mục lịch sử prompt và quyết định.
- ADR 0012R (công cụ version đi theo kit) và 0013R (tự động versioning, chế độ tắt).
- `GIT.md`: quy ước git — commit message, nhánh, merge, viết lại lịch sử, tag, push, xuống dòng.
- ADR 0014R: quy ước git chung, nạp mọi session và ép bằng hook.
- ADR 0015R: Windows 11 + VSCode là môi trường chuẩn, script giữ POSIX.

### Changed

- Mẫu spec: dòng "Quyết định có thể tranh cãi" trong Contract.
- `WORKFLOW.md`: hook chặn commit trong sơ đồ bảo vệ; sơ đồ phát hành theo `automation.mode`.
- README, SETUP: cấu hình tự động versioning và `version.mjs init`.
- `WORKFLOW.md`: `commit-guard` và git hook trong sơ đồ bảo vệ; bước merge fast-forward; SessionStart báo trạng thái git.
- README, SETUP: thành phần git mới, bước cài `core.hooksPath`, permissions tùy chọn.
- README, SETUP: mục Môi trường/Yêu cầu (Windows 11, VSCode, Git for Windows), `.vscode/` trong danh sách thành phần, ghi chú `chmod` trên Windows.

## [0.1.0] - 2026-11-01

### Added

- `README.md`: nguyên tắc, cài đặt, phân loại task, quy trình hai pha, versioning.
- `SETUP.md`: bảng thành phần và các bước cài vào dự án có sẵn.
- `docs/WORKFLOW.md`: sơ đồ Mermaid cho quy trình, lớp bảo vệ tự động và phát hành.
- `docs/specs/_template.md`: mẫu spec với Contract và checklist theo pha.
