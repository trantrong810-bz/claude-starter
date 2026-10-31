# Claude Code starter kit — fullstack monorepo

Chép các file này vào gốc monorepo (pnpm + Turborepo, apps/backend, apps/web, apps/mobile, packages/shared).

## Có gì
| File | Vai trò |
|---|---|
| `CLAUDE.md` | Bộ nhớ dự án, giữ ngắn. Điền tên dự án và stack thật. |
| `.claude/settings.json` | Allow lệnh an toàn, deny `.env`/migration/lệnh phá hoại, đăng ký 2 hook. |
| `.claude/hooks/format.sh` | Tự chạy Prettier sau mỗi lần Claude sửa file. |
| `.claude/hooks/verify-on-stop.sh` | Chặn Claude báo "xong" khi `verify` còn lỗi (có chống lặp vô hạn). |
| `scripts/verify.sh` | Typecheck + lint + test phần bị ảnh hưởng, output gọn. |
| `.claude/commands/new-feature.md` | `/new-feature` — quy trình lát dọc, dừng để duyệt plan. |
| `.claude/commands/handoff.md` | `/handoff` — ghi tiến độ vào spec trước khi `/clear`. |
| `.claude/agents/code-reviewer.md` | Subagent review diff trong context riêng, chạy bằng Sonnet. |
| `docs/specs/_template.md` | Mẫu spec cho mỗi tính năng. |

## Cài đặt
1. Thêm vào `package.json` gốc: `"verify": "bash scripts/verify.sh"`.
2. Mỗi app/package cần script `typecheck`, `lint`, `test` để Turborepo gọi.
3. Khai báo các task đó trong `turbo.json`.
4. `chmod +x .claude/hooks/*.sh scripts/*.sh`
5. Thêm `CLAUDE.local.md` vào `.gitignore` (ghi chú cá nhân).
6. Sửa đường dẫn migration trong `deny` nếu không dùng Prisma.
7. Chạy `claude`, gõ `/hooks` để kiểm tra hook đã nhận.

## Vòng làm việc
`/new-feature ...` → duyệt plan → Claude làm từng lớp, hook tự format và chặn khi verify đỏ → gọi subagent `code-reviewer` → commit → `/handoff` → `/clear`.

## Cải tiến dần
- Claude sai cùng một lỗi lần 2 → thêm 1 dòng vào CLAUDE.md.
- Lần 3 → biến thành lint rule hoặc hook.
- Lặp lại một prompt ~3 lần → biến thành command.
