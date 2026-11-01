---
number: 0013
scope: broad # broad | feature
status: accepted # proposed | accepted | superseded
superseded-by: # number of the new ADR, only when superseded
date: 2026-11-01
model: claude-opus-5-5
source: ca-20261101-23, ca-20261101-24
---

# Tự động versioning bằng hook chặn commit và subagent `versioner` (Haiku), có chế độ tắt

## Bối cảnh

Quy tắc ghi changelog trong CLAUDE.md chỉ là lời khuyên; phát hành phải tự chạy. Cần tự động nhưng tắt được.

## Phương án

- Chỉ quy tắc trong CLAUDE.md: rẻ, dễ quên.
- Git pre-commit hook gọi `claude -p`: chạy cả với commit tay nhưng chậm và tốn.
- Hook PreToolUse chặn `git commit` của Claude + subagent `versioner` điền changelog; Stop hook làm lưới an toàn.
- Model cho versioner: Haiku (rẻ, việc phân loại) hoặc Sonnet.

## Quyết định

PreToolUse chặn commit khi `version check --auto` lỗi; `versioner` (Haiku) đọc diff của phần thiếu và viết `Unreleased` (Added/Changed/Fixed/Removed, `**BREAKING:**`). `versions.json` → `automation.mode`: `off` | `changelog` (mặc định) | `full` (tự `/release` sau merge, hỏi trước nếu `confirmRelease`). `CLAUDE_AUTO_VERSION=off` tắt cho một session.

## Hệ quả

Changelog nằm cùng commit với code. Commit tay ngoài Claude không bị chặn — `check` lúc phát hành vẫn bắt. Chạy thử bằng agent chung với hướng dẫn của versioner tốn ~78k token vì kèm toàn bộ công cụ; versioner thật có ít công cụ hơn — cần đo lại trên Claude Code thật, nếu vẫn đắt thì cân nhắc chỉ gọi lúc phát hành.
