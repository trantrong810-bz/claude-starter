---
thu-tu: 2
tieu-de: Lớp bảo vệ chạy tự động
mo-ta: Hook, permission và verify chạy ở mọi task mà không cần gọi.
---

# Lớp bảo vệ chạy tự động

Các cơ chế này hoạt động ở mọi loại task, không cần gọi.

```mermaid
flowchart TD
    SS["Hook SessionStart: spec đang dở, todo (todo.mjs brief), snapshot wip, cờ, trạng thái git (nhánh, chưa commit, chưa merge, tag thiếu), nhớ model"] --> PROMPT
    PROMPT["Hook UserPromptSubmit: ghi prompt đã che secret vào history/"] --> EDIT
    EDIT["Claude sửa file"] --> FMT["Hook PostToolUse: Prettier"]
    FMT --> WORK["Tiếp tục làm"]
    WORK --> COMMIT{"Claude chạy git commit?"}
    COMMIT -->|"Có"| CGUARD{"Hook commit-guard: message, tên nhánh, cờ trên main, --no-verify, amend đã push?"}
    CGUARD -->|"Sai: chặn kèm lý do"| WORK
    CGUARD -->|"Đúng docs/GIT.md"| GUARD{"Hook version-guard: phần đổi file có changelog chưa?"}
    GUARD -->|"Thiếu, mode khác off"| VERS["Subagent versioner (Haiku) điền Unreleased"]
    VERS --> COMMIT
    GUARD -->|"Đủ, hoặc mode off"| GITHOOK["Git hook nếu bật: commit-msg, pre-commit (chặn file cấm, Prettier file đã stage rồi stage lại)"]
    GITHOOK --> WORK
    HUMAN["Người sửa tay"] --> SAVE["VSCode format on save: Prettier"]
    SAVE --> HCOMMIT["Người chạy git commit"]
    HCOMMIT --> GITHOOK
    WORK --> STOP{"Claude định kết thúc"}
    STOP --> DIFF{"Có thay đổi trong apps/ hoặc packages/?"}
    DIFF -->|"Không"| QUICK["verify --quick: quét secret trong log, kiểm tra ADR, todo, mục lục workflow"]
    QUICK -->|"OK"| END(["Cho kết thúc"])
    QUICK -->|"Lỗi"| BLOCK
    DIFF -->|"Có"| FLAG{"Có cờ .allow-red?"}
    FLAG -->|"Không"| VERIFY["pnpm verify: typecheck, lint có ranh giới import, test"]
    FLAG -->|"Có: pha 1"| VERIFYP1["pnpm verify: typecheck, lint, bỏ qua test"]
    VERIFY -->|"OK"| END
    VERIFYP1 -->|"OK"| END
    VERIFY -->|"Lỗi"| BLOCK["Chặn, trả lỗi gọn cho Claude"]
    VERIFYP1 -->|"Lỗi"| BLOCK
    BLOCK --> WORK
    END --> LOGM["Hook Stop: ghi model, effort, subagent, commit của lượt"]

    PERM["Permissions deny: .env, migration cũ, rm -rf, force push"] -.->|"Luôn áp dụng"| EDIT
    USAGE{"Hook usage-guard: usage 5h/7d ≥ 90%? (số từ statusline)"} -.->|"Chưa lưu: chỉ cho /handoff; đã lưu: chặn mọi tool"| WORK
```

Commit có file todo viết tay (`docs/todo/<phần>.md`): pre-commit (người) hoặc commit-guard (Claude, khi chưa bật `.githooks`) chạy `todo.mjs sync` và stage file auto + `TODO.md` vào cùng commit. `verify` chạy `todo.mjs check` để tổng quan không lệch.

Quy ước git đầy đủ (commit message, nhánh, merge, tag, lệnh cấm): [GIT.md](../GIT.md), nạp vào mọi session qua `CLAUDE.md`.
