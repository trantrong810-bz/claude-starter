# Changelog — claude-starter

Version toàn dự án. Mỗi bản phát hành liệt kê version của từng phần; chi tiết nằm trong changelog của phần đó.
Thay đổi không thuộc phần nào (ví dụ `versions.json`) ghi vào mục `Unreleased` bên dưới.

## [Unreleased]

### Added

- `.github/workflows/`: `verify` chạy `scripts/verify.sh` cho mọi PR (status check bắt buộc); `release-tag` gắn tag `vX.Y.Z` sau khi PR release merge.
- `history/prompts/`: lịch sử prompt (commit lên git, ngoài versioning), điền lại cuộc trò chuyện dựng kit trên claude.ai.
- `versions.json`: danh sách `ignore`; công cụ version bỏ qua các đường dẫn này. `.gitignore` gốc.
- `.gitattributes`: LF cho mọi file text.
- `.githooks/`: `commit-msg` và `pre-commit` (chặn `.env*`, file cục bộ của Claude, dấu xung đột, cờ `.allow-red` trên main).
- Tag `v0.1.0` gắn bù cho commit phát hành f8379b7.
- `.vscode/`: `settings.json` (LF, format on save bằng Prettier, terminal Git Bash) và `extensions.json` (Claude Code, Prettier, ESLint, Markdown Mermaid).

### Changed

- `.githooks/pre-commit`: chặn commit trên `main` (main chỉ nhận qua PR); bỏ kiểm tra cờ `.allow-red` trên main vì đã bao gồm.
- `.githooks/pre-commit`: tự chạy Prettier trên file đã stage rồi stage lại (file người sửa tay); file stage một phần chỉ kiểm tra, lệch thì chặn. Chỉ chạy khi dự án cài Prettier.

### Removed

- **BREAKING:** `tools/version.mjs` chuyển thành `scripts/version.mjs`; lệnh cũ không còn.

### Changed

- `versions.json`: thêm `automation` (`mode: changelog`, `confirmRelease: true`) cho chính repo kit.

## [0.1.0] - 2026-11-01

Bản phát hành đầu tiên có version: bộ cấu hình Claude Code cho monorepo fullstack, quy trình hai pha đã qua một vòng chạy thử.

### Added

- `tools/version.mjs`: version riêng cho từng phần, changelog cho mỗi phần, phát hành bằng một lệnh.

| Phần    | Version | Changelog                                                                    |
| ------- | ------- | ---------------------------------------------------------------------------- |
| .claude | 0.1.0   | [.claude/CHANGELOG.md](.claude/CHANGELOG.md)                                 |
| docs    | 0.1.0   | [docs/CHANGELOG.md](docs/CHANGELOG.md)                                       |
| scripts | 0.1.0   | [scripts/CHANGELOG.md](scripts/CHANGELOG.md)                                 |
| example | 0.1.0   | [example/CHANGELOG.md](example/CHANGELOG.md)                                 |
| shared  | 0.1.0   | [example/packages/shared/CHANGELOG.md](example/packages/shared/CHANGELOG.md) |
| be      | 0.1.0   | [example/apps/backend/CHANGELOG.md](example/apps/backend/CHANGELOG.md)       |
| fe      | 0.1.0   | [example/apps/web/CHANGELOG.md](example/apps/web/CHANGELOG.md)               |
| mobile  | 0.1.0   | [example/apps/mobile/CHANGELOG.md](example/apps/mobile/CHANGELOG.md)         |
