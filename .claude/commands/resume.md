---
description: Làm tiếp trên máy hoặc tài khoản Claude khác — kéo todo, áp code dở từ wip/<nhánh>, báo bước kế tiếp
argument-hint: "[nhánh]"
---

Nhánh (tuỳ chọn): $ARGUMENTS

1. `git pull --ff-only` trên nhánh hiện tại (lỗi thì báo, không tự sửa).
2. `node scripts/wip.mjs status` — snapshot code dở trên remote.
3. Đọc `TODO.md`, rồi `## Đang làm` trong các `docs/todo/<phần>.auto.md` có WIP. Chọn việc: chỉ một → lấy luôn; nhiều → hỏi tôi (liệt kê phần, tiêu đề, nhánh, có snapshot không).
4. Việc có snapshot: `node scripts/wip.mjs restore <nhánh>`. Script dừng nếu working tree bẩn hoặc snapshot cũ — báo nguyên văn và hỏi tôi, không tự xoá thay đổi.
5. Việc có spec → đọc spec. Đọc các file nêu ở "Tiếp theo".
6. Báo 3 dòng: đang ở đâu (nhánh, phần), bước kế tiếp cụ thể, lệnh kiểm tra (`pnpm verify` hoặc test liên quan). Không bắt đầu sửa code trước khi tôi xác nhận.
