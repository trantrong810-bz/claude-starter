---
description: Tra cứu vì sao / khi nào / ai (model nào) đã quyết định hoặc yêu cầu điều gì — tìm trong ADR, spec, git, log prompt
argument-hint: <câu hỏi, ví dụ "vì sao dùng nhánh feat?" hoặc "quyết định nào do sonnet đưa ra?">
---

Câu hỏi: $ARGUMENTS

Tìm theo thứ tự, DỪNG ngay khi đủ để trả lời. Chỉ dùng Grep rồi đọc đúng đoạn khớp — không đọc cả file lớn.

1. **ADR** — `docs/decisions/README.md` (mục lục, có cột Model), rồi file ADR khớp. Bỏ qua ADR `bi-thay-the` trừ khi câu hỏi về lịch sử; nếu có, nêu ADR thay thế.
2. **Spec** — `docs/specs/*.md`, mục Contract và Ghi chú.
3. **Git** — `git log --oneline --grep=<từ khóa>` và các `CHANGELOG.md`.
4. **Log prompt** — `history/prompts/*.jsonl`. Mỗi prompt có hai dòng cùng `id`: dòng `prompt` và dòng `"type":"model"` (model, effort, subagents, ket_qua). Nếu có nhiều dòng `model` cho một `id`, dòng cuối là đúng. Lọc theo model bằng Grep trên `"model":"<tên>"` rồi lấy các `id` tương ứng. Nếu log lớn (>2.000 dòng khớp), giao cho một subagent Explore và chỉ nhận về kết quả.

Trả lời:

- Câu trả lời trực tiếp trong 1–3 câu.
- Nguồn: `file:dòng`, mã commit, hoặc id prompt — mỗi khẳng định một nguồn.
- Nêu model/effort khi câu hỏi liên quan đến ai đã quyết định hoặc xử lý.
- Không tìm thấy thì nói rõ là không tìm thấy và đã tìm ở đâu. Không suy đoán.
