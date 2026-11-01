---
description: Phát hành version mới — điền changelog còn thiếu, xem trước, (hỏi), bump từng phần trên nhánh release/, mở PR; CI gắn tag sau merge.
argument-hint: "[--yes để bỏ bước hỏi]"
---

1. `node scripts/version.mjs mode`: báo chế độ hiện tại cho tôi trong một dòng.
2. `git switch main && git pull --ff-only`. `git status --porcelain` phải rỗng (bỏ qua `history/`); còn gì thì dừng và hỏi tôi.
3. `node scripts/version.mjs check`. Thiếu changelog thì làm như sau rồi quay lại bước 2:
   - gọi subagent `versioner`;
   - commit các CHANGELOG.md trên nhánh `docs/changelog-<ngày>` (`docs(changelog): fill unreleased for <phần>`);
   - `/ship`.
4. `node scripts/version.mjs release --dry-run`: cho tôi xem bảng version mới, kèm mọi mục `BREAKING` trong các mục Unreleased.
5. Hỏi tôi trước khi phát hành, TRỪ KHI: `$ARGUMENTS` có `--yes`, hoặc `versions.json` có `"confirmRelease": false`.
6. `git switch -c release/v<X.Y.Z>` (version dự án từ dry-run), rồi `node scripts/version.mjs release --no-tag`.
7. Làm theo `/ship`. Hỏi merge như mọi PR, trừ khi bước 5 đã được bỏ qua bằng `--yes`. Sau khi merge, Action `release-tag` gắn tag `vX.Y.Z` lên commit release trên `main`. Không tự tạo tag.
