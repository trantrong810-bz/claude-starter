# Claude Code starter kit — fullstack monorepo

Chép các file này vào gốc monorepo (pnpm + Turborepo, apps/backend, apps/web, apps/mobile, packages/shared).

## Có gì

| File                                | Vai trò                                                                  |
| ----------------------------------- | ------------------------------------------------------------------------ |
| `CLAUDE.md`                         | Bộ nhớ dự án, giữ ngắn. Điền tên dự án và stack thật.                    |
| `.claude/settings.json`             | Allow lệnh an toàn, deny `.env`/migration/lệnh phá hoại, đăng ký 2 hook. |
| `.claude/hooks/format.sh`           | Tự chạy Prettier sau mỗi lần Claude sửa file.                            |
| `.claude/hooks/verify-on-stop.sh`   | Chặn Claude báo "xong" khi `verify` còn lỗi (có chống lặp vô hạn).       |
| `scripts/verify.sh`                 | Typecheck + lint + test phần bị ảnh hưởng, output gọn.                   |
| `.claude/commands/plan-feature.md`  | `/plan-feature` — pha 1 (Opus): plan, contract, test backend đỏ.         |
| `.claude/commands/build-feature.md` | `/build-feature` — pha 2 (Sonnet): test xanh, web + mobile song song.    |
| `.claude/commands/handoff.md`       | `/handoff` — ghi tiến độ vào spec trước khi `/clear`.                    |
| `.claude/commands/retro.md`         | `/retro` — biến lỗi đã gặp thành lint rule / hook / dòng CLAUDE.md.      |
| `.claude/agents/app-builder.md`     | Subagent làm một app (web hoặc mobile), chạy song song.                  |
| `.claude/agents/code-reviewer.md`   | Subagent review diff trong context riêng, chạy bằng Sonnet.              |
| `docs/specs/_template.md`           | Mẫu spec cho mỗi tính năng.                                              |

## Cài đặt

1. Thêm vào `package.json` gốc: `"verify": "bash scripts/verify.sh"`.
2. Mỗi app/package cần script `typecheck`, `lint`, `test` để Turborepo gọi.
3. Khai báo các task đó trong `turbo.json`.
4. `chmod +x .claude/hooks/*.sh scripts/*.sh`
5. Thêm `CLAUDE.local.md` và `.claude/.allow-red` vào `.gitignore`.
6. Sửa đường dẫn migration trong `deny` nếu không dùng Prisma.
7. Chạy `claude`, gõ `/hooks` để kiểm tra hook đã nhận.

## Vòng làm việc

Xem README, mục "Quy trình".

Cờ `.claude/.allow-red` cho phép test đỏ có chủ đích ở pha 1. Nếu Stop hook không chặn khi lẽ ra phải chặn, kiểm tra xem file này có bị bỏ quên không.
