---
description: Pha 1 (chạy bằng Opus) — plan, chốt contract trong shared, viết test backend trước. Không viết code thực thi.
argument-hint: <tên-tính-năng> <mô tả ngắn>
---

Tính năng: $ARGUMENTS

Đây là pha lập kế hoạch. Session này nên chạy bằng model mạnh (Opus); pha thực thi sẽ chạy session khác bằng Sonnet.

1. Tạo `docs/specs/<tên-tính-năng>.md` từ `docs/specs/_template.md`.
2. Chỉ đọc những file liên quan. Điền Mục tiêu, Contract, Plan, Checklist. Contract gồm cả chữ ký hàm client trong `packages/shared` (web và mobile dùng chung, không tự viết). Trong Plan, ghi rõ mỗi app có phần UI đáng kể hay chỉ gọi client — quyết định này dùng ở pha 2. Nếu tính năng KHÔNG đổi contract API hoặc chỉ chạm 1 lớp, nói rõ và đề xuất làm thẳng không cần quy trình này.
3. DỪNG để tôi duyệt plan và contract. Đây là điểm kiểm tra quan trọng nhất — nêu rõ các quyết định có thể tranh cãi.
4. Sau khi được duyệt:
   - Mỗi quyết định có tranh cãi đã được duyệt (mục "Quyết định có thể tranh cãi" trong Contract) → một ADR qua `node scripts/adr.mjs new`, `nguon` ghi tên spec; ghi số ADR vào Ghi chú của spec.
   - `git switch main && git switch -c feat/<tên-tính-năng>` (kebab-case, ≤ 40 ký tự, trùng tên spec) — mọi commit của tính năng nằm trên nhánh này; `main` luôn xanh. Mọi commit theo `docs/GIT.md`.
   - Tạo file `.claude/.allow-red` (verify sẽ bỏ qua test, nhưng typecheck và lint vẫn phải qua).
   - Viết schema/types trong `packages/shared`.
   - Tạo stub cho các hàm backend: chữ ký đầy đủ theo contract, thân hàm chỉ `throw new Error("not implemented")`. Chữ ký này là một phần của contract.
   - Viết test backend gọi các stub đó, mô tả hành vi mong muốn. Test phải đỏ vì "not implemented", không phải vì lỗi import hay type.
   - `pnpm verify` phải qua (typecheck + lint), rồi chạy riêng test backend để xác nhận chúng đỏ đúng lý do.
   - Commit: `feat(<tên>): add contract, stub and failing tests`, body có `Refs: docs/specs/<tên>.md`. Contract đổi API đã có → thêm `!` và footer `BREAKING CHANGE:`.
5. Chạy `/handoff`, rồi nhắc tôi: `/clear`, `/model sonnet`, `/build-feature <tên-tính-năng>`.
