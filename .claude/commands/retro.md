---
description: Cuối tính năng lớn — biến lỗi đã gặp thành cải tiến cấu hình (CLAUDE.md, lint rule, hook, command)
argument-hint: <tên-tính-năng>
---

Đọc `docs/specs/$ARGUMENTS.md` (mục Ghi chú) và `git log` của tính năng. Tìm:

- Lỗi Claude mắc phải và phải sửa lại.
- Chỗ tôi phải can thiệp hoặc nhắc lại.
- Bước lặp đi lặp lại có thể tự động hóa.

Với mỗi vấn đề, đề xuất ĐÚNG MỘT cách khắc phục rẻ nhất, theo thứ tự ưu tiên:

1. Lint rule hoặc hook (máy ép buộc — tốt nhất).
2. Một dòng trong CLAUDE.md gốc hoặc CLAUDE.md của app (chỉ khi không ép bằng máy được).
3. Command hoặc skill mới (chỉ khi một prompt đã lặp ≥3 lần).

Trình bày dạng bảng ngắn: vấn đề → đề xuất → file sẽ sửa. Tối đa 5 dòng; bỏ qua sự cố một lần.
Không sửa gì cho đến khi tôi chọn. Cũng đề xuất xóa dòng CLAUDE.md nào đã thừa (vì đã có lint/hook thay thế).
Nếu đề xuất được chọn làm thay đổi quy trình (command, hook, subagent, phân loại task), cập nhật sơ đồ trong `docs/workflows/` cùng commit (quy trình mới: chép `_template.md`, rồi `node scripts/workflow.mjs index`). Mọi thay đổi được áp dụng đều ghi vào `Unreleased` của changelog phần tương ứng. Đề xuất được chọn mà có phương án khác hợp lý → một ADR; nếu nó đảo ngược ADR cũ, đặt ADR cũ `trang-thai: bi-thay-the` và `thay-the-boi` trỏ tới ADR mới.
