---
description: Làm một tính năng fullstack theo lát dọc (shared → backend → web → mobile)
argument-hint: <tên tính năng> <mô tả ngắn>
---

Tính năng: $ARGUMENTS

1. Nếu chưa có, tạo `docs/specs/<tên-tính-năng>.md` từ `docs/specs/_template.md`. Nếu đã có, đọc nó và tiếp tục từ mục "Tiến độ".
2. Đọc chỉ những file liên quan. Viết plan vào spec (mục Plan + Checklist) rồi DỪNG để tôi duyệt.
3. Sau khi được duyệt, làm theo thứ tự, mỗi bước chạy `pnpm verify` xong mới sang bước sau:
   - packages/shared: schema + types
   - apps/backend: endpoint + test
   - apps/web: UI + gọi API
   - apps/mobile: UI + gọi API
4. Đánh dấu checklist và ghi tiến độ vào spec sau mỗi bước.
5. Kết thúc: tóm tắt thay đổi trong 3–5 dòng, đề xuất commit message.
