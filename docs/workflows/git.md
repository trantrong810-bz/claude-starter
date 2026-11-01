---
thu-tu: 3
tieu-de: Git flow qua GitHub
mo-ta: Mọi thay đổi trên nhánh ngắn; /ship push, mở PR, bạn đồng ý, GitHub rebase-merge khi CI xanh.
---

# Git flow qua GitHub

`main` chỉ nhận thay đổi qua PR. GitHub merge bằng rebase khi job `verify` xanh (ruleset do `scripts/github-setup.sh` đặt). Quy ước đầy đủ: [GIT.md](../GIT.md).

```mermaid
flowchart TD
    TASK(["Task mới, đã phân loại"]) --> PULL["git switch main, git pull --ff-only"]
    PULL --> BR["git switch -c feat|fix|refactor|chore|docs/tên"]
    BR --> WORK["Sửa, pnpm verify"]
    WORK --> COMMIT["git commit: một thay đổi logic, kèm changelog"]
    COMMIT --> CG{"commit-guard, version-guard"}
    CG -->|"Sai: chặn kèm lý do"| WORK
    CG -->|"Đúng"| MORE{"Còn việc?"}
    MORE -->|"Có"| WORK
    MORE -->|"Không"| SHIP["/ship: verify, fetch; main đi tiếp thì rebase origin/main"]
    SHIP --> PUSH["git push -u origin nhánh"]
    PUSH --> PR["gh pr create: tóm tắt, commit, Refs, verify"]
    PR --> ASK{"Bạn đồng ý merge?"}
    ASK -->|"Chưa: sửa tiếp"| WORK
    ASK -->|"OK"| AUTO["gh pr merge --auto --rebase"]
    AUTO --> CI{"CI verify trên GitHub"}
    CI -->|"Đỏ"| FIXCI["gh run view --log-failed, sửa, commit, push"]
    FIXCI --> CI
    CI -->|"Xanh"| MERGED["GitHub rebase-merge vào main, xoá nhánh remote"]
    MERGED --> SYNC["git switch main, git pull --ff-only"]
    SYNC --> CLEAN["pr.mjs cleanup nhánh: xoá local khi mọi patch đã có trên main"]
    CLEAN --> AFTER{"Nhánh gì?"}
    AFTER -->|"release/vX.Y.Z"| TAG["Action release-tag gắn tag"]
    AFTER -->|"feat/"| RETRO["Nhắc /retro; mode full thì /release"]
    AFTER -->|"Khác"| DONE(["Xong"])
    TAG --> DONE
    RETRO --> DONE

    HO["/handoff giữa chừng"] -.->|"Push nhánh và wip/nhánh, không mở PR"| PUSH

    classDef human fill:#fff4d6,stroke:#c98a00,color:#000
    class ASK human
```

- Claude không bao giờ push `main`, không force push. Nếu nhánh đã push rồi lại phải rebase thì dừng và hỏi bạn.
- `gh pr merge` nằm trong `ask` của `settings.json`: ngoài câu hỏi trong chat, công cụ cũng hỏi lại một lần.
- Rebase-merge tạo commit mới trên `main`, nên `git branch -d` từ chối xoá nhánh. Dùng `node scripts/pr.mjs cleanup <nhánh>` (so theo patch). Hook SessionStart liệt kê các nhánh cần dọn.
