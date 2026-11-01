---
so: 0017
pham-vi: rong # rong | tinh-nang
trang-thai: chap-nhan # de-xuat | chap-nhan | bi-thay-the
thay-the-boi: # số ADR mới, chỉ khi bi-thay-the
ngay: 2026-11-01
model: claude-opus-5-5
nguon: session aa6d8532 (history/prompts/2026-11.jsonl); plan docs/plans/todo-wip.md; ADR 0014R
---

# Mọi trạng thái làm việc nằm trong repo: todo hai lớp, code dở ở ref wip/<nhánh>, usage ≥ 90% thì buộc handoff

## Bối cảnh

Đổi máy hoặc đổi tài khoản Claude làm mất ngữ cảnh: memory tự động và file plan nằm trong `~/.claude` (theo máy, theo tài khoản), task nhỏ/vừa không có nơi ghi tiến độ, và code đang sửa dở chỉ ở working tree. `docs/GIT.md` cấm commit "WIP" và commit đỏ, nên không thể đơn giản là commit rồi push. Hết usage giữa chừng thì không kịp lưu.

## Phương án

- **Code dở**: (a) commit `wip:` trên nhánh rồi squash trước merge — đơn giản nhưng phải viết lại lịch sử đã push, trái ADR 0014R; (b) chỉ ghi todo, bắt commit được mới đổi máy — mất code đỏ/dở; (c) snapshot thành commit rời ở ref `wip/<nhánh>` (index tạm + `commit-tree`), không đụng lịch sử nhánh — **chọn**.
- **Todo**: (a) một file Claude quản lý; (b) hai lớp: file người viết tay (Claude chỉ đọc) + file auto Claude ghi, `TODO.md` tổng quan tự sinh — **chọn**, vì người muốn ghi chú tự do mà không bị Claude sửa.
- **Memory/plan**: (a) giữ mặc định `~/.claude`; (b) `plansDirectory: docs/plans`, `autoMemoryEnabled: false` — **chọn**.
- **Usage**: hook không nhận số usage; chỉ statusline nhận `rate_limits`. Statusline ghi số vào `.claude/state/usage.json`, hook `usage-guard` chặn tool khi ≥ 90% — **chọn**; phương án nhắc bằng lời trong CLAUDE.md bị loại vì Claude không biết usage.

## Quyết định

- `scripts/todo.mjs` (`sync`, `check`, `brief`), `docs/todo/<phần>.md` + `<phần>.auto.md`, `TODO.md` tự sinh; commit file viết tay → pre-commit/commit-guard tự sync vào cùng commit; `verify` chạy `check`.
- `scripts/wip.mjs` (`save`, `status`, `restore`, `drop`); `/handoff` lưu todo + spec + plan, `wip.mjs save`, tự push; `/resume` ở nơi mới.
- `statusline.mjs` + `usage-guard.mjs`: ≥ 90% (`CLAUDE_WIP_THRESHOLD`) chỉ cho việc của handoff, lưu xong thì chặn mọi tool trừ đọc.

## Hệ quả

- Làm tiếp ở bất kỳ đâu: `git pull` + `/resume`. Không còn phụ thuộc memory của Claude.
- Ngoại lệ mới trong GIT.md: commit chỉ gồm todo/spec/plan được phép khi verify đỏ; `/handoff` được push.
- `wip/*` là ref force-update trên remote; cần theo dõi ref mồ côi (`wip.mjs status`, `drop`).
- Guard phụ thuộc statusline: giao diện không chạy statusline (có thể là VS Code) hoặc gói không có `rate_limits` → guard không kích hoạt, chỉ còn `/handoff` thủ công.
