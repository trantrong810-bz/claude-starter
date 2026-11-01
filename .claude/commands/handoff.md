---
description: Lưu tiến độ (todo, spec, code dở) vào git và đẩy lên remote — trước /clear, đổi máy hoặc đổi tài khoản
---

Mục tiêu: một session mới, ở máy hoặc tài khoản bất kỳ, chỉ cần `git pull` + `/resume` là làm tiếp được.

1. **Todo**: với mỗi phần bị ảnh hưởng, cập nhật `## Đang làm` trong `docs/todo/<phần>.auto.md` (format trong `/todo`):
   - `Đang dở:` đã làm gì, dở ở đâu — cụ thể tới file/hàm.
   - `Tiếp theo:` bước kế tiếp làm được ngay, kèm lệnh kiểm tra.
   - Việc đã xong → chuyển sang `## Xong gần đây` (và đánh `[x]` ở file viết tay nếu có `từ:`). Việc phát sinh → `## Việc cần làm`.
2. **Spec** (task lớn): đánh dấu checklist, mục "Tiến độ" và "Ghi chú" (quyết định đã chốt, bẫy đã gặp, file quan trọng).
3. **Plan**: file plan chưa commit trong `docs/plans/` có tên ngẫu nhiên → đổi tên `<kebab-theo-nội-dung>.md`.
4. Đang ở `main` thì tạo nhánh trước (`chore/handoff-<ngày>`, hoặc nhánh theo việc đang dở), vì `main` chỉ nhận thay đổi qua PR. `node scripts/todo.mjs sync`, rồi commit `chore(todo): handoff <nhánh>` gồm `TODO.md`, `docs/todo/`, spec, `docs/plans/` — chỉ những file đó, không kèm code dở (commit này không cần verify xanh).
5. `node scripts/wip.mjs save` — chụp code dở lên `wip/<nhánh>` và push cả nhánh. Gọi `/handoff` nghĩa là tôi đồng ý push.
6. Báo 2 dòng: đã lưu gì; "Máy/tài khoản khác: `git pull` rồi `/resume`". Nếu chỉ `/clear` ở máy này thì nhắc tôi chạy `/clear`.

Viết ngắn gọn, đủ để session mới chỉ đọc todo + spec là làm tiếp được.
