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
        APPROVE -->|"OK"| BR["Tạo nhánh feat/tên, main luôn xanh"]
        BR --> RED["Tạo cờ .allow-red"]
        RED --> CONTRACT["Schema trong packages/shared"]
        CONTRACT --> STUB["Stub backend: chữ ký đầy đủ, throw not implemented"]
        STUB --> TESTS["Test backend viết trước, đỏ vì not implemented"]
        TESTS --> V1["verify: typecheck và lint phải qua"]
        V1 --> C1["Commit: contract, stub, failing tests"]
        C1 --> HO["/handoff: ghi tiến độ vào spec"]
    end

    HO --> SWITCH["/clear rồi /model sonnet"]
    SWITCH --> CTX["Hook SessionStart: báo spec đang dở và cờ .allow-red"]
    CTX --> P2

    subgraph PHASE2["Session 2: Sonnet, pha thực thi"]
        P2["/build-feature: đọc spec, xóa cờ .allow-red"] --> BE["Backend: thay stub, làm test xanh"]
        BE --> C2["Commit: backend"]
        C2 --> CLIENT["Client trong shared: parse bằng schema, encode URL, test"]
        CLIENT --> C2B["Commit: client"]
        C2B --> UIQ{"Mỗi app có UI đáng kể?"}
        UIQ -->|"Có"| WEB["Subagent app-builder: web"]
        UIQ -->|"Có"| MOB["Subagent app-builder: mobile"]
        UIQ -->|"Không"| INLINE["Tự làm UI trực tiếp"]
        WEB --> JOIN["pnpm verify toàn bộ"]
        MOB --> JOIN
        INLINE --> JOIN
        JOIN --> C3["Commit: web và mobile"]
        C3 --> REV["Subagent code-reviewer: main...HEAD, kèm spec và kết quả verify"]
        REV --> FIX["Sửa vấn đề cao và trung, commit"]
    end

    FIX --> MERGE{"Bạn duyệt merge vào main"}
    MERGE -->|"Cần sửa"| FIX
    MERGE -->|"OK"| RETRO["/retro: đề xuất cải tiến"]
    RETRO --> PICK{"Bạn chọn đề xuất"}
    PICK --> IMPROVE["Lint rule, hook, dòng CLAUDE.md, command mới"]
    IMPROVE -.->|"Cấu hình tốt hơn cho task sau"| START

    SMALL --> DONE(["Xong"])
    MEDDO --> DONE
    PICK -->|"Không cần"| DONE
    IMPROVE --> DONE

    classDef human fill:#fff4d6,stroke:#c98a00,color:#000
    class APPROVE,MEDOK,MERGE,PICK human
```

Ô vàng là điểm bạn cần có mặt. Mọi bước khác Claude tự làm.

## Lớp bảo vệ chạy tự động

Các cơ chế này hoạt động ở mọi loại task, không cần gọi.

```mermaid
flowchart TD
    SS["Hook SessionStart: đưa spec đang dở và cảnh báo cờ vào context"] --> EDIT
    EDIT["Claude sửa file"] --> FMT["Hook PostToolUse: Prettier"]
    FMT --> WORK["Tiếp tục làm"]
    WORK --> STOP{"Claude định kết thúc"}
    STOP --> DIFF{"Có thay đổi trong apps/ hoặc packages/?"}
    DIFF -->|"Không"| END(["Cho kết thúc"])
    DIFF -->|"Có"| FLAG{"Có cờ .allow-red?"}
    FLAG -->|"Không"| VERIFY["pnpm verify: typecheck, lint có ranh giới import, test"]
    FLAG -->|"Có: pha 1"| VERIFYP1["pnpm verify: typecheck, lint, bỏ qua test"]
    VERIFY -->|"OK"| END
    VERIFYP1 -->|"OK"| END
    VERIFY -->|"Lỗi"| BLOCK["Chặn, trả lỗi gọn cho Claude"]
    VERIFYP1 -->|"Lỗi"| BLOCK
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
