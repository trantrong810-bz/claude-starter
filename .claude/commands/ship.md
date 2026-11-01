---
description: Đưa nhánh hiện tại vào main qua GitHub — push, mở PR, (hỏi), bật auto-merge, chờ CI, dọn nhánh
argument-hint: "[ghi chú thêm cho mô tả PR]"
---

Quy ước: `docs/GIT.md` mục Merge. `main` chỉ nhận thay đổi qua PR; GitHub merge bằng rebase khi job `verify` xanh.

1. Kiểm tra trước:
   - đang ở nhánh khác `main` (ở `main` thì dừng: tạo nhánh theo `docs/GIT.md` trước);
   - `git status --porcelain` không còn gì ngoài `history/`; còn thì dừng và hỏi tôi;
   - `pnpm verify` qua.
2. `git fetch origin`. Nếu `origin/main` có commit mà nhánh chưa có (`git log HEAD..origin/main`), chạy `git rebase origin/main`, rồi `pnpm verify` lại.
3. `git push -u origin <nhánh>`. Nhánh đã rebase mà từng push trước đó thì dừng và hỏi tôi, vì cần force push và lệnh này bị cấm.
4. `gh pr view --json url,state` để xem PR đã có chưa. Chưa có thì chạy `gh pr create --base main --title "<title>" --body-file <file tạm>`:
   - title: header của commit nếu chỉ có một; nhiều commit thì theo dạng `<type>(<scope>): <tóm tắt>` của `docs/GIT.md`;
   - body: tóm tắt 3–5 dòng; danh sách `git log --format="- %s" origin/main..HEAD`; `Refs:` (spec, ADR, plan nếu có); kết quả verify; `$ARGUMENTS` nếu có; dòng attribution cuối cùng.
5. Gửi tôi link PR và tóm tắt, rồi **hỏi tôi có merge không**. Không đồng ý thì dừng và để PR mở. Chưa có câu trả lời thì không làm tiếp.
6. Đồng ý thì chạy `gh pr merge --auto --rebase`, rồi `gh pr checks --watch`.
   - CI đỏ: `gh run view --log-failed`, sửa, commit, push, rồi quay lại `gh pr checks --watch`. Auto-merge vẫn bật.
   - Xanh: `gh pr view --json state` phải là `MERGED`. Chưa merge (ví dụ `main` đi tiếp và có xung đột) thì báo tôi kèm lý do GitHub đưa ra.
7. Đã merge:
   - `git switch main && git pull --ff-only`;
   - `node scripts/pr.mjs cleanup <nhánh>`;
   - báo tôi 1 dòng: đã merge, kèm link.
8. Sau merge:
   - nhánh `release/*`: nhắc tôi rằng Action `release-tag` sẽ gắn tag;
   - nhánh khác: nếu `node scripts/version.mjs mode` là `full` thì làm `/release`, không thì nhắc tôi có thể chạy `/release`;
   - nhánh `feat/<tên>`: nhắc `/retro <tên>`.
