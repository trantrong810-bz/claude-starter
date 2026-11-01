---
number: 0006
scope: broad # broad | feature
status: accepted # proposed | accepted | superseded
superseded-by: # number of the new ADR, only when superseded
date: 2026-11-01
model: claude-opus-5-5
source: ca-20261101-04, ca-20261101-06, commit 88e147e
---

# Stop hook chặn Claude báo xong khi verify còn lỗi

## Bối cảnh

CLAUDE.md chỉ là lời khuyên; Claude có thể báo xong khi test còn đỏ. Cần một điều kiện máy ép buộc.

## Phương án

- Chỉ ghi quy tắc trong CLAUDE.md: rẻ nhưng không chắc.
- Stop hook luôn chạy verify đầy đủ: chắc nhưng chậm mọi lượt.
- Stop hook có điều kiện: đổi code thì verify đầy đủ, không đổi code thì chỉ kiểm tra nhanh.

## Quyết định

Stop hook trả exit 2 kèm lỗi gọn khi verify đỏ, có chống lặp vô hạn. Mức nhanh (quét secret, kiểm tra ADR) chạy mọi lượt; mức đầy đủ khi `apps/` hoặc `packages/` đổi.

## Hệ quả

Không thể báo xong khi đỏ. Câu hỏi và plan không tốn thời gian chạy test.
