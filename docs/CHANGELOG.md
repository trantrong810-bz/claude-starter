# Changelog

Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/); version theo [SemVer](https://semver.org/lang/vi/).
Ghi thay đổi vào mục `Unreleased` cùng commit; `node tools/version.mjs release` sẽ tự chuyển nó thành version mới.

## [Unreleased]

### Added

- `docs/decisions/`: mẫu ADR, mục lục tự sinh và 11 ADR cho các quyết định đã đưa ra khi dựng kit.
- `WORKFLOW.md`: sơ đồ tra cứu lịch sử; điểm tạo ADR và hook ghi log trong các sơ đồ cũ.
- README, SETUP: mục lịch sử prompt và quyết định.

### Changed

- Mẫu spec: dòng "Quyết định có thể tranh cãi" trong Contract.

## [0.1.0] - 2026-11-01

### Added

- `README.md`: nguyên tắc, cài đặt, phân loại task, quy trình hai pha, versioning.
- `SETUP.md`: bảng thành phần và các bước cài vào dự án có sẵn.
- `docs/WORKFLOW.md`: sơ đồ Mermaid cho quy trình, lớp bảo vệ tự động và phát hành.
- `docs/specs/_template.md`: mẫu spec với Contract và checklist theo pha.
