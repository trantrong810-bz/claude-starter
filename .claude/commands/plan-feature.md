---
description: Pha 1 (chạy bằng Opus) — plan, chốt contract trong shared, viết test backend trước. Không viết code thực thi.
argument-hint: <tên-tính-năng> <mô tả ngắn>
---

Tính năng: $ARGUMENTS

Đây là pha lập kế hoạch. Session này nên chạy bằng model mạnh (Opus); pha thực thi sẽ chạy session khác bằng Sonnet.

1. Tạo `docs/specs/<tên-tính-năng>.md` từ `docs/specs/_template.md`.
2. Chỉ đọc những file liên quan. Điền Mục tiêu, Contract, Plan, Checklist. Nếu tính năng KHÔNG đổi contract API hoặc chỉ chạm 1 lớp, nói rõ và đề xuất làm thẳng không cần quy trình này.
3. DỪNG để tôi duyệt plan và contract. Đây là điểm kiểm tra quan trọng nhất — nêu rõ các quyết định có thể tranh cãi.
4. Sau khi được duyệt:
   - Tạo file `.claude/.allow-red` (cho phép test đỏ có chủ đích ở pha này).
   - Viết schema/types trong `packages/shared` (phải typecheck được).
   - Viết test backend mô tả hành vi mong muốn. Chưa viết code thực thi; test được phép đỏ.
   - Commit: `feat(<tên>): contract + failing tests`.
5. Chạy `/handoff`, rồi nhắc tôi: `/clear`, `/model sonnet`, `/build-feature <tên-tính-năng>`.
