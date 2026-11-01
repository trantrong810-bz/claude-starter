# Claude Code starter kit — fullstack monorepo

Chép các file này vào gốc monorepo (pnpm + Turborepo, apps/backend, apps/web, apps/mobile, packages/shared).

## Có gì

| File                                | Vai trò                                                                              |
| ----------------------------------- | ------------------------------------------------------------------------------------ |
| `CLAUDE.md`                         | Bộ nhớ dự án, giữ ngắn. Điền tên dự án và stack thật.                                |
| `.claude/settings.json`             | Allow lệnh an toàn, deny `.env`/migration/lệnh phá hoại, đăng ký 10 hook (7 sự kiện). |
| `.claude/hooks/format.sh`           | Tự chạy Prettier sau mỗi lần Claude sửa file.                                        |
| `.claude/hooks/session-context.sh`  | Đầu session: báo spec đang dở và cờ `.allow-red` vào context.                        |
| `.claude/hooks/prompt-log.mjs`      | Ghi prompt, model, effort, subagent, commit vào `history/prompts/`.                  |
| `.claude/commands/why.md`           | `/why` — tra cứu ADR, spec, git, log prompt.                                         |
| `.claude/hooks/version-guard.sh`    | Chặn `git commit` khi phần bị đổi chưa có changelog (theo `automation.mode`).        |
| `.claude/hooks/commit-guard.sh`     | Chặn `git commit` của Claude sai quy ước: message, tên nhánh, `--no-verify`, amend.  |
| `docs/GIT.md`                       | Quy ước git, nạp vào mọi session qua `CLAUDE.md`.                                    |
| `scripts/commit-msg.mjs`            | Kiểm tra commit message (dùng chung cho hook của Claude và `.githooks/`).            |
| `.githooks/`                        | `commit-msg` + `pre-commit` cho commit của người (bật bằng `core.hooksPath`).        |
| `.gitattributes`                    | Ép LF cho mọi file text, kể cả trên Windows.                                         |
| `.claude/agents/versioner.md`       | Subagent (Haiku) đọc diff, điền mục `Unreleased`.                                    |
| `.claude/commands/release.md`       | `/release` — điền changelog thiếu, xem trước, hỏi, phát hành.                        |
| `scripts/version.mjs`               | `init`, `list`, `mode`, `check`, `release`.                                          |
| `scripts/adr.mjs`                   | Tạo ADR, sinh mục lục, kiểm tra (chạy trong verify).                                 |
| `.claude/hooks/verify-on-stop.sh`   | Chặn Claude báo "xong" khi `verify` còn lỗi (có chống lặp vô hạn).                   |
| `scripts/verify.sh`                 | Typecheck + lint + test phần bị ảnh hưởng, output gọn.                               |
| `.claude/commands/plan-feature.md`  | `/plan-feature` — pha 1 (Opus): plan, contract, test backend đỏ.                     |
| `.claude/commands/build-feature.md` | `/build-feature` — pha 2 (Sonnet): test xanh, web + mobile song song.                |
| `.claude/commands/handoff.md`       | `/handoff` — ghi tiến độ vào spec trước khi `/clear`.                                |
| `.claude/commands/retro.md`         | `/retro` — biến lỗi đã gặp thành lint rule / hook / dòng CLAUDE.md.                  |
| `.claude/agents/app-builder.md`     | Subagent làm một app (web hoặc mobile), chạy song song.                              |
| `.claude/agents/code-reviewer.md`   | Subagent review diff trong context riêng, chạy bằng Sonnet.                          |
| `docs/specs/_template.md`           | Mẫu spec cho mỗi tính năng.                                                          |

## Cài đặt

1. Thêm vào `package.json` gốc: `"verify": "bash scripts/verify.sh"`.
2. Mỗi app/package cần script `typecheck`, `lint`, `test` để Turborepo gọi.
3. Khai báo các task đó trong `turbo.json`.
4. `chmod +x .claude/hooks/*.sh scripts/*.sh`
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

## Vòng làm việc

Xem README, mục "Quy trình".

Cờ `.claude/.allow-red` cho phép test đỏ có chủ đích ở pha 1: verify bỏ qua test nhưng vẫn bắt buộc typecheck và lint. Nếu cờ bị bỏ quên, hook SessionStart sẽ cảnh báo ở đầu mỗi session.
