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
        APPROVE -->|"OK"| ADR1["ADR cho mỗi quyết định có tranh cãi"]
        ADR1 --> BR["Tạo nhánh feat/tên, main luôn xanh"]
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
    MERGE -->|"OK"| FF["merge --ff-only, main đã đi tiếp thì rebase main trước; xóa nhánh"]
    FF --> RETRO["/retro: đề xuất cải tiến"]
    RETRO --> PICK{"Bạn chọn đề xuất"}
    PICK --> IMPROVE["Lint rule, hook, dòng CLAUDE.md, command mới, kèm ADR"]
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
    SS["Hook SessionStart: spec đang dở, cờ, trạng thái git (nhánh, chưa commit, chưa merge, tag thiếu), nhớ model"] --> PROMPT
    PROMPT["Hook UserPromptSubmit: ghi prompt đã che secret vào history/"] --> EDIT
    EDIT["Claude sửa file"] --> FMT["Hook PostToolUse: Prettier"]
    FMT --> WORK["Tiếp tục làm"]
    WORK --> COMMIT{"Claude chạy git commit?"}
    COMMIT -->|"Có"| CGUARD{"Hook commit-guard: message, tên nhánh, cờ trên main, --no-verify, amend đã push?"}
    CGUARD -->|"Sai: chặn kèm lý do"| WORK
    CGUARD -->|"Đúng docs/GIT.md"| GUARD{"Hook version-guard: phần đổi file có changelog chưa?"}
    GUARD -->|"Thiếu, mode khác off"| VERS["Subagent versioner (Haiku) điền Unreleased"]
    VERS --> COMMIT
    GUARD -->|"Đủ, hoặc mode off"| GITHOOK["Git hook nếu bật: commit-msg, pre-commit"]
    GITHOOK --> WORK
    WORK --> STOP{"Claude định kết thúc"}
    STOP --> DIFF{"Có thay đổi trong apps/ hoặc packages/?"}
    DIFF -->|"Không"| QUICK["verify --quick: quét secret trong log, kiểm tra ADR"]
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
```

Quy ước git đầy đủ (commit message, nhánh, merge, tag, lệnh cấm): [GIT.md](GIT.md), nạp vào mọi session qua `CLAUDE.md`.

## Lịch sử và tra cứu

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

## Khi nào đổi model

| Giai đoạn                   | Model  | Lý do                                                 |
| --------------------------- | ------ | ----------------------------------------------------- |
| Pha 1: plan, contract, test | Opus   | Cần tư duy; sai ở đây tốn nhất.                       |
| Pha 2: code, subagent       | Sonnet | Nhiều token, đã có test làm trọng tài.                |
| Task nhỏ và vừa             | Sonnet | Đủ cho phạm vi hẹp.                                   |
| Đổi model                   | —      | Chỉ ngay sau `/clear`, để không làm mất prompt cache. |

## Phát hành version

Mỗi phần có version và changelog riêng; toàn dự án có version và tag `vX.Y.Z`. Bảng phần → đường dẫn và cấu hình tự động nằm trong `versions.json`:

```json
"automation": { "mode": "changelog", "confirmRelease": true }
```

`off`: không tự động, không chặn commit · `changelog` (mặc định): chặn commit thiếu changelog, `versioner` tự điền · `full`: như `changelog` + tự `/release` sau khi merge. Tắt cho một session: `CLAUDE_AUTO_VERSION=off`.

```mermaid
flowchart TD
    CHANGE["Sửa file trong một phần"] --> MODE{"automation.mode"}
    MODE -->|"off"| MANUAL["Tự ghi Unreleased khi muốn; check chỉ chạy lúc phát hành"]
    MODE -->|"changelog hoặc full"| GUARD["git commit bị chặn nếu thiếu changelog"]
    GUARD --> VERS["Subagent versioner (Haiku) đọc diff, ghi Added, Changed, Fixed, Removed, BREAKING"]
    VERS --> COMMIT["Commit gồm code và changelog"]
    MANUAL --> REL
    COMMIT --> TRIG{"Khi nào phát hành?"}
    TRIG -->|"mode full: ngay sau merge vào main"| REL["/release: check, dry-run"]
    TRIG -->|"mode changelog: khi bạn gọi /release"| REL
    REL --> ASK{"confirmRelease: bạn duyệt"}
    ASK -->|"OK"| DO["release: bump theo changelog, ghi bảng vào CHANGELOG gốc, commit, tag"]
    DO --> PUSH["Bạn tự push và push tag"]

    classDef human fill:#fff4d6,stroke:#c98a00,color:#000
    class ASK human
```

Mức bump suy ra từ mục `Unreleased`: có `### Removed` hoặc chữ `BREAKING` → major; có `### Added` → minor; còn lại → patch. Ở giai đoạn `0.x`, major được hạ xuống minor.
