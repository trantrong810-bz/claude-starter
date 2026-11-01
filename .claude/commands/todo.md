---
description: Xem hoặc ghi todo theo phần (root, shared, be, fe, mobile) — Claude chỉ ghi vào file auto
argument-hint: "[<phần>] <mô tả> [P1|P2|P3] | start <việc> | done <việc>"
---

Yêu cầu: $ARGUMENTS

Hai lớp, xem `TODO.md` mục "Cách dùng":

- `docs/todo/<phần>.md` — **người viết tay**. Chỉ đọc. Ngoại lệ duy nhất: đánh `[x]` cho việc vừa xong; không đổi chữ nào khác.
- `docs/todo/<phần>.auto.md` — **Claude ghi**: `## Đang làm`, `## Việc cần làm`, `## Xong gần đây`. Không sửa mục `## Từ viết tay` (sinh tự động).

Làm theo yêu cầu:

- **Trống**: đọc `TODO.md`, in bảng tổng quan + việc đang làm + việc P1 (cả hai lớp). Không sửa gì.
- **Thêm** (`[<phần>] <mô tả> [P1]`): thêm `- [ ] [P1] <mô tả>` vào `## Việc cần làm` của file auto. Không ghi phần → suy từ file liên quan theo `versions.json` (`.../apps/backend/` → be, `.../apps/web/` → fe, `.../apps/mobile/` → mobile, `.../packages/shared/` → shared, còn lại → root); mơ hồ thì hỏi.
- **start `<việc>`**: chuyển việc vào `## Đang làm` của file auto, dạng
  `- [ ] <tiêu đề> — từ: [be.md#L12](be.md#L12) · nhánh: <nhánh> · spec: <đường dẫn nếu có> · <YYYY-MM-DD>`
  kèm dòng con `  - Đang dở: ...` và `  - Tiếp theo: ...`. Việc lấy từ file viết tay: tiêu đề **chép nguyên chữ** của dòng đó (bỏ `[P1]`), để `todo.mjs sync` tìm lại được.
- **done `<việc>`**: xoá item khỏi `## Đang làm`/`## Việc cần làm`, thêm `- [x] <tiêu đề> (<YYYY-MM-DD>, <sha ngắn>)` lên đầu `## Xong gần đây` (giữ tối đa 10 dòng). Việc có `từ:` → đánh `[x]` ở dòng gốc trong file viết tay.

Sau khi sửa: `node scripts/todo.mjs sync`, rồi commit `chore(todo): <tóm tắt>` gồm `TODO.md` + `docs/todo/` (không cần verify xanh, không cần changelog). Task lớn: item chỉ trỏ tới spec, tiến độ chi tiết vẫn ở spec.
