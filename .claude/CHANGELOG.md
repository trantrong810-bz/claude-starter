# Changelog

Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/); version theo [SemVer](https://semver.org/lang/vi/).
Ghi thay đổi vào mục `Unreleased` cùng commit (subagent `versioner` tự điền khi bật tự động); `node scripts/version.mjs release` chuyển nó thành version mới.

## [Unreleased]

### Added

- Hook `prompt-log.mjs`: ghi mọi prompt (đã che secret) vào `history/prompts/`, kèm model, effort, subagent và commit của từng lượt; tắt bằng `CLAUDE_PROMPT_LOG=off`.
- Command `/why`: tra cứu theo thứ tự ADR → spec → git → log prompt, trích nguồn và model.
- Hook `version-guard.sh` (PreToolUse): chặn `git commit` khi phần bị đổi chưa có changelog, theo `automation.mode`.
- Subagent `versioner` (Haiku): đọc diff, điền `Unreleased` theo Added/Changed/Fixed/Removed và đánh dấu `**BREAKING:**`.
- Command `/release`: điền changelog thiếu, xem trước, hỏi rồi phát hành; không tự push.
- Hook `commit-guard.sh` (PreToolUse): chặn `git commit` sai `docs/GIT.md` — message, tên nhánh, cờ `.allow-red` trên main, `--no-verify`, `--amend` commit đã push.
- `session-context.sh`: báo nhánh, số file chưa commit, nhánh chưa merge, git hook chưa bật, tag thiếu cho version hiện tại.

### Changed

- `verify-on-stop.sh`: khi không đổi code vẫn chạy `verify --quick` (quét secret, kiểm tra ADR).
- `/plan-feature` và `/retro` tạo ADR cho quyết định có tranh cãi; `CLAUDE.md` có quy tắc ADR và `/why`.
- `/build-feature`: commit thiếu changelog thì gọi `versioner`; sau merge tự `/release` khi `mode` là `full`.
- `CLAUDE.md`: quy tắc changelog theo chế độ tự động.
- `CLAUDE.md`: nạp `@docs/GIT.md` vào mọi session.
- `settings.json`: đăng ký `commit-guard.sh`; `deny` thêm `git clean`, `branch -D`, `tag -d`, `commit --no-verify`, `git config`; `ask` cho `git push`, `rebase`, `tag`.
- `/plan-feature`, `/build-feature`, `/release`: message theo Conventional Commits; merge `--ff-only`, rebase khi main đi tiếp, xóa nhánh sau merge; phát hành chỉ từ main.
- `code-reviewer`: kiểm tra lịch sử commit `main..HEAD` theo `docs/GIT.md`.
- `CLAUDE.md`: mục Môi trường — Windows 11, VSCode, Git Bash, nháy kép trong `execSync`, LF/CRLF, `git update-index --chmod=+x`.

## [0.1.0] - 2026-11-01

### Added

- `settings.json`: allow lệnh an toàn (verify, test, git add/commit/switch), deny `.env`, migration cũ, `rm -rf`, force push.
- Hook `format.sh` (PostToolUse): Prettier sau mỗi lần sửa file.
- Hook `verify-on-stop.sh` (Stop): chặn kết thúc khi `verify` lỗi; chống lặp vô hạn; bỏ qua khi không đổi code.
- Hook `session-context.sh` (SessionStart): báo spec đang dở và cảnh báo cờ `.allow-red`.
- Command `/plan-feature` (pha 1, Opus): nhánh `feat/`, contract, stub, test backend đỏ.
- Command `/build-feature` (pha 2, Sonnet): backend, client trong shared, UI; subagent chỉ khi UI lớn; review rồi hỏi trước khi merge.
- Command `/handoff` và `/retro`.
- Subagent `app-builder` (một app, chỉ UI) và `code-reviewer` (diff `main...HEAD`, kèm spec và kết quả verify).
- `CLAUDE.md` mẫu: phân loại task, client API trong shared, đồng bộ sơ đồ quy trình, ghi changelog.
