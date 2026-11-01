---
thu-tu: 6
tieu-de: Phát hành version
mo-ta: Changelog theo phần, automation.mode, /release bump và tag.
---

# Phát hành version

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
