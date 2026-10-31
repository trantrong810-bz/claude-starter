# Lịch sử prompt

`prompts/YYYY-MM.jsonl` — mỗi prompt hai dòng cùng `id`:

- Dòng prompt: `t` (giờ địa phương), `src` (`claude-code` | `claude.ai`), `session`, `branch`, `prompt` (đã che secret; cắt ở 4.000 ký tự, kèm `truncated_from`).
- Dòng `"type": "model"`: `model` xử lý, `effort`, `subagents` (loại, model khai báo, effort), `ket_qua` (mã commit hoặc `ADR-NNNN` — không có tóm tắt câu trả lời). Nếu có nhiều dòng `model` cho một `id`, dòng cuối là đúng.

Ghi tự động bởi `.claude/hooks/prompt-log.mjs` (tắt: `CLAUDE_PROMPT_LOG=off`). Được commit nhưng nằm ngoài versioning. `pnpm verify` chặn nếu còn chuỗi giống secret.

`unknown` nghĩa là không xác định được — không bao giờ đoán. Prompt từ claude.ai được điền lại thủ công; model của subagent là model khai báo trong file agent.
