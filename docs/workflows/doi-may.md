---
thu-tu: 3
tieu-de: Đổi máy hoặc tài khoản
mo-ta: /handoff lưu todo, spec và code dở lên remote; /resume làm tiếp ở nơi mới.
---

# Đổi máy hoặc tài khoản

Mọi trạng thái để làm tiếp nằm trong repo: todo (`TODO.md`, `docs/todo/`), spec, plan (`docs/plans/`), ADR, log prompt; code dở nằm ở ref `wip/<nhánh>` trên remote. Memory tự động của Claude tắt cho dự án.

```mermaid
flowchart TD
    TRIG{"Vì sao dừng?"} -->|"Tự quyết: đổi máy, đổi tài khoản, /clear"| HO
    TRIG -->|"Usage 5h/7d ≥ 90%"| GUARD["Hook usage-guard: chặn mọi tool trừ việc của handoff; chặn Stop khi chưa lưu"]
    GUARD --> HO
    HO["/handoff: Đang dở và Tiếp theo vào docs/todo/phần.auto.md, spec, đổi tên plan"] --> SYNC["todo.mjs sync: mục Từ viết tay, TODO.md"]
    SYNC --> CT["Commit chore(todo): chỉ todo, spec, plan; không cần verify xanh"]
    CT --> SAVE["wip.mjs save: chụp working tree trừ history/ vào commit rời, push nhánh và wip/nhánh"]
    SAVE --> MARK["Ghi .claude/state/handoff.json: guard cho Stop, chặn mọi tool còn lại"]
    MARK --> NEW(["Máy hoặc tài khoản mới"])
    NEW --> PULL["git pull"]
    PULL --> SS["Hook SessionStart: todo đang làm, snapshot wip"]
    SS --> RES["/resume: wip.mjs status, chọn việc"]
    RES --> PICK{"Có snapshot cho nhánh?"}
    PICK -->|"Có"| REST{"wip.mjs restore: working tree sạch và snapshot khớp HEAD?"}
    REST -->|"Có"| APPLY["Áp thay đổi vào working tree, xoá wip/nhánh trên remote"]
    REST -->|"Không"| ASK["Báo nguyên văn, hỏi bạn; không tự bỏ thay đổi"]
    PICK -->|"Không"| READ
    APPLY --> READ["Đọc spec và các file ở Tiếp theo"]
    READ --> NEXT["Báo vị trí, bước kế tiếp, lệnh kiểm tra; chờ bạn xác nhận"]

    classDef human fill:#fff4d6,stroke:#c98a00,color:#000
    class TRIG,ASK,NEXT human
```

Todo hai lớp: `docs/todo/<phần>.md` bạn viết tay (Claude chỉ đọc, chỉ được đánh `[x]`), `docs/todo/<phần>.auto.md` Claude ghi qua `/todo` và `/handoff`. `TODO.md` sinh tự động, trỏ tới cả hai.
