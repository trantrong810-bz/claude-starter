---
description: Pha 2 (chạy bằng Sonnet) — làm test xanh, rồi web + mobile song song qua subagent. Commit sau mỗi lớp.
argument-hint: <tên-tính-năng>
---

Tính năng: $ARGUMENTS

1. Đọc `docs/specs/$ARGUMENTS.md`. Đó là nguồn sự thật; không lập lại plan. Nếu spec mâu thuẫn với code hiện tại, dừng và hỏi.
2. Xóa `.claude/.allow-red` (từ giờ Stop hook kiểm tra bình thường).
3. Backend: viết code cho test pha 1 xanh. Không sửa test để cho qua — nếu test sai, dừng và hỏi.
   `pnpm verify` qua → commit `feat(<tên>): backend` → đánh dấu checklist.
4. Web và mobile độc lập với nhau khi contract đã chốt. Giao song song cho 2 subagent `app-builder` (một cho `apps/web`, một cho `apps/mobile`), mỗi cái nhận: đường dẫn spec, app phụ trách, phần Plan liên quan.
   Khi cả hai trả về: `pnpm verify` → commit `feat(<tên>): web + mobile`.
5. Gọi subagent `code-reviewer` trên toàn bộ diff của tính năng (`git diff <commit trước pha 1>..HEAD`). Sửa vấn đề mức cao.
6. Cập nhật spec (checklist + Tiến độ), rồi nhắc tôi chạy `/retro <tên-tính-năng>`.
