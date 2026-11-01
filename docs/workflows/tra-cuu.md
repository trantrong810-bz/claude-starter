---
thu-tu: 5
tieu-de: Lịch sử và tra cứu
mo-ta: /why tìm câu trả lời trong ADR, spec, git, changelog và log prompt.
---

# Lịch sử và tra cứu

Mọi prompt được ghi vào `history/prompts/` (commit lên git, ngoài versioning, không chứa câu trả lời). Mọi quyết định có tranh cãi thành ADR trong `docs/decisions/`; quyết định rộng có chữ R.

```mermaid
flowchart TD
    Q["/why câu hỏi"] --> A1{"ADR trả lời được?"}
    A1 -->|"Có"| ANS["Trả lời 1–3 câu, kèm nguồn file:dòng, commit, id prompt, model"]
    A1 -->|"Không"| A2{"Spec?"}
    A2 -->|"Có"| ANS
    A2 -->|"Không"| A3{"git log và changelog?"}
    A3 -->|"Có"| ANS
    A3 -->|"Không"| A4{"Log prompt?"}
    A4 -->|"Có"| ANS
    A4 -->|"Không"| NONE["Báo không tìm thấy và đã tìm ở đâu"]
```
