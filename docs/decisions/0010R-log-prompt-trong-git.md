---
number: 0010
scope: broad # broad | feature
status: accepted # proposed | accepted | superseded
superseded-by: # number of the new ADR, only when superseded
date: 2026-11-01
model: claude-opus-5-5
source: ca-20261101-19, ca-20261101-20, ca-20261101-21, ca-20261101-22
---

# Log prompt commit lên git, nằm ngoài versioning, ghi model xử lý, không ghi câu trả lời

## Bối cảnh

Cần tra lại đã yêu cầu gì và model nào xử lý. Transcript của Claude Code chỉ nằm trên máy và có thể bị dọn.

## Phương án

- Chỉ dựa vào transcript: không phải làm gì, nhưng mất sau một thời gian và khó tìm.
- Log trên máy (gitignore): an toàn khi repo công khai.
- Log commit lên git: bền và tra được mọi nơi; cần chống lộ secret.

## Quyết định

Repo riêng tư nên commit `history/prompts/YYYY-MM.jsonl`. Hook UserPromptSubmit ghi prompt (đã che secret); Stop ghi model (transcript → SessionStart/PostModelSwitch → `unknown`), effort, subagent và commit tạo ra. Không ghi câu trả lời. Nằm trong `ignore` của versioning. verify chặn nếu còn chuỗi giống secret.

## Hệ quả

Có lịch sử đầy đủ, nối được prompt → commit → ADR. Định dạng transcript là nội bộ của Claude Code, có thể đổi — hook đọc phòng thủ và ghi `unknown` thay vì đoán. Nếu repo chuyển sang công khai, phải xem lại quyết định này.
