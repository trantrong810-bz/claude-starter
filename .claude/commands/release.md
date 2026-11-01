---
description: Phát hành version mới — điền changelog còn thiếu, xem trước, (hỏi), bump từng phần, commit và tag. Không push.
argument-hint: "[--yes để bỏ bước hỏi]"
---

1. `node scripts/version.mjs mode` — báo chế độ hiện tại cho tôi trong một dòng.
2. `node scripts/version.mjs check`. Nếu thiếu changelog: gọi subagent `versioner`, rồi commit các CHANGELOG.md (`docs(changelog): ...`).
3. `git status --porcelain` phải rỗng; nếu không, dừng và hỏi tôi phải làm gì với thay đổi còn lại.
4. `node scripts/version.mjs release --dry-run` — cho tôi xem bảng version mới, kèm mọi mục `BREAKING` trong các mục Unreleased.
5. Hỏi tôi trước khi phát hành, TRỪ KHI: `$ARGUMENTS` có `--yes`, hoặc `versions.json` có `"confirmRelease": false`.
6. `node scripts/version.mjs release`.
7. Báo version mới và lệnh để tôi tự đẩy: `git push && git push origin vX.Y.Z`. Không tự push.
