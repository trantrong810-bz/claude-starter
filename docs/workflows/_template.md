---
order: 0 # số thứ tự trong mục lục docs/WORKFLOW.md, không trùng
title: <Tên quy trình>
description: <Một câu: quy trình này dùng khi nào, gồm những bước chính nào.>
---

# <Tên quy trình>

<Bối cảnh 1–2 câu: khi nào dùng, liên quan command/hook/subagent nào.>

```mermaid
flowchart TD
    START(["Bắt đầu"]) --> STEP["Bước"]
    STEP --> OK{"Bạn duyệt"}
    OK -->|"OK"| DONE(["Xong"])
    OK -->|"Sửa"| STEP

    classDef human fill:#fff4d6,stroke:#c98a00,color:#000
    class OK human
```

<Ghi chú ngắn sau sơ đồ nếu cần.>
