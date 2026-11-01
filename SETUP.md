# Claude Code starter kit — fullstack monorepo

Chép các file này vào gốc monorepo (pnpm + Turborepo, apps/backend, apps/web, apps/mobile, packages/shared).

## Có gì

| File                                | Vai trò                                                                                   |
| ----------------------------------- | ----------------------------------------------------------------------------------------- |
| `CLAUDE.md`                         | Bộ nhớ dự án, giữ ngắn. Điền tên dự án và stack thật.                                     |
| `.claude/settings.json`             | Allow lệnh an toàn, deny `.env`/migration/lệnh phá hoại, đăng ký 10 hook (7 sự kiện).     |
| `.claude/hooks/format.sh`           | Tự chạy Prettier sau mỗi lần Claude sửa file.                                             |
| `.claude/hooks/session-context.sh`  | Đầu session: báo spec đang dở và cờ `.allow-red` vào context.                             |
| `.claude/hooks/prompt-log.mjs`      | Ghi prompt, model, effort, subagent, commit vào `history/prompts/`.                       |
| `.claude/commands/why.md`           | `/why` — tra cứu ADR, spec, git, log prompt.                                              |
| `.claude/hooks/version-guard.sh`    | Chặn `git commit` khi phần bị đổi chưa có changelog (theo `automation.mode`).             |
| `.claude/hooks/commit-guard.sh`     | Chặn `git commit` của Claude sai quy ước: message, tên nhánh, `--no-verify`, amend.       |
| `docs/GIT.md`                       | Quy ước git, nạp vào mọi session qua `CLAUDE.md`.                                         |
| `scripts/commit-msg.mjs`            | Kiểm tra commit message (dùng chung cho hook của Claude và `.githooks/`).                 |
| `.githooks/`                        | `commit-msg` + `pre-commit` (chặn file cấm, Prettier file đã stage) cho người.            |
| `.vscode/`                          | LF, format on save bằng Prettier, terminal Git Bash, extension gợi ý.                     |
| `.gitattributes`                    | Ép LF cho mọi file text, kể cả trên Windows.                                              |
| `.claude/agents/versioner.md`       | Subagent (Haiku) đọc diff, điền mục `Unreleased`.                                         |
| `.claude/commands/release.md`       | `/release` — điền changelog thiếu, xem trước, hỏi, phát hành.                             |
| `scripts/version.mjs`               | `init`, `list`, `mode`, `check`, `release`.                                               |
| `scripts/adr.mjs`                   | Tạo ADR, sinh mục lục, kiểm tra (chạy trong verify).                                      |
| `.claude/hooks/verify-on-stop.sh`   | Chặn Claude báo "xong" khi `verify` còn lỗi (có chống lặp vô hạn).                        |
| `scripts/verify.sh`                 | Typecheck + lint + test phần bị ảnh hưởng, output gọn.                                    |
| `.claude/commands/plan-feature.md`  | `/plan-feature` — pha 1 (Opus): plan, contract, test backend đỏ.                          |
| `.claude/commands/build-feature.md` | `/build-feature` — pha 2 (Sonnet): test xanh, web + mobile song song.                     |
| `.claude/commands/handoff.md`       | `/handoff` — lưu todo, spec, code dở vào git và push (trước `/clear`, đổi máy/tài khoản). |
| `.claude/commands/resume.md`        | `/resume` — máy/tài khoản mới: kéo todo, áp code dở từ `wip/<nhánh>`.                     |
| `.claude/commands/todo.md`          | `/todo` — xem/ghi todo theo phần (`TODO.md`, `docs/todo/`).                               |
| `scripts/todo.mjs`                  | `sync`, `check`, `brief` cho todo hai lớp (viết tay + auto).                              |
| `scripts/wip.mjs`                   | `save`, `status`, `restore`, `drop` snapshot code dở trên remote.                         |
| `.claude/hooks/statusline.mjs`      | Statusline usage 5h/7d/context; ghi số cho `usage-guard.mjs`.                             |
| `.claude/hooks/usage-guard.mjs`     | Usage ≥ 90%: chỉ cho `/handoff`, lưu xong thì dừng.                                       |
| `.claude/commands/retro.md`         | `/retro` — biến lỗi đã gặp thành lint rule / hook / dòng CLAUDE.md.                       |
| `.claude/agents/app-builder.md`     | Subagent làm một app (web hoặc mobile), chạy song song.                                   |
| `.claude/agents/code-reviewer.md`   | Subagent review diff trong context riêng, chạy bằng Sonnet.                               |
| `docs/specs/_template.md`           | Mẫu spec cho mỗi tính năng.                                                               |

## Yêu cầu

- Windows 11, [Git for Windows](https://git-scm.com/download/win) (có Git Bash — hook và script cần `bash`), Node ≥ 20, pnpm.
- VSCode: mở thư mục gốc, cài các extension được gợi ý (`.vscode/extensions.json`): Claude Code, Prettier, ESLint, Markdown Mermaid.

## Cài đặt

1. Thêm vào `package.json` gốc: `"verify": "bash scripts/verify.sh"`.
2. Mỗi app/package cần script `typecheck`, `lint`, `test` để Turborepo gọi.
3. Khai báo các task đó trong `turbo.json`.
4. `chmod +x .claude/hooks/*.sh scripts/*.sh` — trên Windows bit này không vào git; sau `git add` chạy thêm `git update-index --chmod=+x .claude/hooks/*.sh scripts/*.sh .githooks/*`.
5. Thêm `CLAUDE.local.md`, `.claude/.allow-red` và `.claude/state/` vào `.gitignore`. Repo công khai: thêm cả `history/` hoặc đặt `CLAUDE_PROMPT_LOG=off`.
6. Xóa ADR của kit (`docs/decisions/0*.md`) rồi chạy `node scripts/adr.mjs index` — đó là lịch sử của kit, không phải của dự án.
7. `node scripts/version.mjs init` — tạo `versions.json` và `CHANGELOG.md` cho mỗi app/package (chế độ mặc định `changelog`; đặt `"mode": "off"` nếu không muốn tự động).
8. Sửa đường dẫn migration trong `deny` nếu không dùng Prisma.
9. Git: chép `.gitattributes`, `.githooks/`, `docs/GIT.md`; rồi
   ```bash
   chmod +x .githooks/*
   git config core.hooksPath .githooks   # mỗi máy, mỗi bản clone
   git config pull.ff only
   git add --renormalize . && git commit -m "chore: normalize line endings to lf"
   ```
   Dự án đã phát hành mà chưa có tag: gắn tag cho commit phát hành cuối, `git tag -a vX.Y.Z <sha> -m "vX.Y.Z"`, nếu không `version.mjs check` sẽ so với commit đầu.
   Tùy chọn, ép thêm bằng permissions trong `.claude/settings.json`: `"deny"` thêm `Bash(git clean:*)`, `Bash(git branch -D:*)`, `Bash(git tag -d:*)`, `Bash(git commit --no-verify:*)`, `Bash(git config:*)`; `"ask"`: `["Bash(git push:*)", "Bash(git rebase:*)", "Bash(git tag:*)"]`.
10. Chạy `claude`, gõ `/hooks` để kiểm tra hook đã nhận.
11. Todo: `node scripts/todo.mjs sync` tạo `TODO.md` và `docs/todo/`. Đổi danh sách phần trong hằng `SCOPES` của `scripts/todo.mjs` nếu dự án chia khác.

## Vòng làm việc

Xem README, mục "Quy trình".

**Đổi máy hoặc tài khoản Claude:** máy cũ `/handoff` (todo + spec + code dở lên `wip/<nhánh>`, tự push) → máy mới `git pull` rồi `/resume`. Máy mới lần đầu: clone, `git config core.hooksPath .githooks`, `git config pull.ff only`. Mọi trạng thái nằm trong repo: plan (`docs/plans/`), todo, spec, ADR, log prompt; memory tự động của Claude tắt cho dự án (`autoMemoryEnabled: false`).

**Usage ≥ 90%** (5 giờ hoặc 7 ngày, gói Pro/Max): statusline ghi số, hook `usage-guard` chỉ cho phép việc của `/handoff`, lưu xong thì chặn mọi tool để Claude dừng. Đổi ngưỡng: `CLAUDE_WIP_THRESHOLD=95`. Statusline phải chạy được thì guard mới có số — nếu giao diện đang dùng không hiện statusline, guard không kích hoạt.

Cờ `.claude/.allow-red` cho phép test đỏ có chủ đích ở pha 1: verify bỏ qua test nhưng vẫn bắt buộc typecheck và lint. Nếu cờ bị bỏ quên, hook SessionStart sẽ cảnh báo ở đầu mỗi session.
