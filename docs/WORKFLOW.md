# Quy trình làm việc với Claude Code

> Sơ đồ này phản ánh cấu hình hiện tại trong `.claude/`. Khi đổi command, hook, subagent hay quy tắc phân loại task, cập nhật sơ đồ trong cùng commit.

## Tổng quan

```mermaid
flowchart TD
    START(["Task mới"]) --> TIER{"Phân loại task"}

    TIER -->|"Nhỏ: sửa 1 chỗ"| SMALL["Làm thẳng"]
    TIER -->|"Vừa: không đổi contract"| MED["Plan ngắn trong chat"]
    TIER -->|"Lớn: đổi contract API"| P1

    MED --> MEDOK{"Bạn duyệt plan"}
    MEDOK -->|"OK"| MEDDO["Làm và commit"]
    MEDOK -->|"Sửa"| MED

    subgraph PHASE1["Session 1: Opus, pha lập kế hoạch"]
        P1["/plan-feature: tạo spec, plan, contract"] --> APPROVE{"Bạn duyệt plan và contract"}
        APPROVE -->|"Sửa"| P1
        APPROVE -->|"OK"| RED["Tạo cờ .allow-red"]
        RED --> CONTRACT["Schema trong packages/shared"]
        CONTRACT --> TESTS["Test backend viết trước, đang đỏ"]
        TESTS --> C1["Commit: contract và failing tests"]
        C1 --> HO["/handoff: ghi tiến độ vào spec"]
    end

    HO --> SWITCH["/clear rồi /model sonnet"]
    SWITCH --> P2

    subgraph PHASE2["Session 2: Sonnet, pha thực thi"]
        P2["/build-feature: đọc spec, xóa cờ .allow-red"] --> BE["Backend: làm test xanh"]
        BE --> C2["Commit: backend"]
        C2 --> WEB["Subagent app-builder: web"]
        C2 --> MOB["Subagent app-builder: mobile"]
        WEB --> JOIN["pnpm verify toàn bộ"]
        MOB --> JOIN
        JOIN --> C3["Commit: web và mobile"]
        C3 --> REV["Subagent code-reviewer"]
    end

    REV --> RETRO["/retro: đề xuất cải tiến"]
    RETRO --> PICK{"Bạn chọn đề xuất"}
    PICK --> IMPROVE["Lint rule, hook, dòng CLAUDE.md, command mới"]
    IMPROVE -.->|"Cấu hình tốt hơn cho task sau"| START

    SMALL --> DONE(["Xong"])
    MEDDO --> DONE
    PICK -->|"Không cần"| DONE
    IMPROVE --> DONE

    classDef human fill:#fff4d6,stroke:#c98a00,color:#000
    class APPROVE,MEDOK,PICK human
```

Ô vàng là điểm bạn cần có mặt. Mọi bước khác Claude tự làm.

## Lớp bảo vệ chạy tự động

Các cơ chế này hoạt động ở mọi loại task, không cần gọi.

```mermaid
flowchart TD
    EDIT["Claude sửa file"] --> FMT["Hook PostToolUse: Prettier"]
    FMT --> WORK["Tiếp tục làm"]
    WORK --> STOP{"Claude định kết thúc"}
    STOP --> FLAG{"Có cờ .allow-red?"}
    FLAG -->|"Có: pha 1"| END(["Cho kết thúc"])
    FLAG -->|"Không"| DIFF{"Có thay đổi trong apps/ hoặc packages/?"}
    DIFF -->|"Không"| END
    DIFF -->|"Có"| VERIFY["pnpm verify: typecheck, lint có ranh giới import, test"]
    VERIFY -->|"OK"| END
    VERIFY -->|"Lỗi"| BLOCK["Chặn, trả lỗi gọn cho Claude"]
    BLOCK --> WORK

    PERM["Permissions deny: .env, migration cũ, rm -rf, force push"] -.->|"Luôn áp dụng"| EDIT
```

## Khi nào đổi model

| Giai đoạn                   | Model  | Lý do                                                 |
| --------------------------- | ------ | ----------------------------------------------------- |
| Pha 1: plan, contract, test | Opus   | Cần tư duy; sai ở đây tốn nhất.                       |
| Pha 2: code, subagent       | Sonnet | Nhiều token, đã có test làm trọng tài.                |
| Task nhỏ và vừa             | Sonnet | Đủ cho phạm vi hẹp.                                   |
| Đổi model                   | —      | Chỉ ngay sau `/clear`, để không làm mất prompt cache. |
