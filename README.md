# claude-starter

Bộ cấu hình Claude Code cho monorepo fullstack (backend + web + mobile), tối ưu cho làm việc một mình trên một máy dev.

Ba nguyên tắc:

1. **Claude tự kiểm chứng được** — `pnpm verify` + Stop hook không cho báo "xong" khi còn lỗi.
2. **Context luôn gọn** — CLAUDE.md ngắn, output verify chỉ hiện lỗi, review chạy trong subagent, tiến độ lưu vào spec để `/clear` thoải mái.
3. **Quy tắc ép bằng công cụ** — permissions deny `.env`/migration/lệnh phá hoại, hook tự format, ESLint chặn import vượt ranh giới (app chỉ được import `@app/shared`).

## Stack giả định

pnpm workspaces + Turborepo · `apps/backend` (Node) · `apps/web` (Next.js) · `apps/mobile` (Expo) · `packages/shared` (Zod schemas, types, API client).

## Nội dung

```
CLAUDE.md                        # bộ nhớ dự án — điền tên & stack thật
SETUP.md                         # hướng dẫn cài đặt chi tiết
.claude/
  settings.json                  # permissions + đăng ký hooks
  hooks/format.sh                # Prettier sau mỗi lần sửa file
  hooks/verify-on-stop.sh        # chặn kết thúc khi verify đỏ
  commands/new-feature.md        # /new-feature — lát dọc, duyệt plan trước
  commands/handoff.md            # /handoff — ghi tiến độ trước /clear
  agents/code-reviewer.md        # subagent review diff (Sonnet)
scripts/verify.sh                # typecheck + lint + test phần bị ảnh hưởng
scripts/try-example.sh           # dựng demo chạy được từ example/
example/                         # monorepo mẫu tối giản
docs/specs/_template.md          # mẫu spec cho mỗi tính năng
```

## Thử ngay với monorepo mẫu

```bash
bash scripts/try-example.sh ~/claude-starter-demo
cd ~/claude-starter-demo && pnpm verify && claude
```

Script ghép `example/` (shared + backend + web + mobile, có Zod schema và test thật) với toàn bộ cấu hình, chạy `git init` và `pnpm install`. Muốn thấy cơ chế hoạt động: đổi `title` thành `name` trong `packages/shared/src/index.ts` rồi chạy `pnpm verify` — typecheck backend báo lỗi đúng dòng, test fail, và Stop hook sẽ không cho Claude báo xong.

Mẫu có sẵn Prettier (hook format chạy thật) và `eslint.config.js` với quy tắc ranh giới: thử thêm `import { listTodos } from "@app/backend"` vào `apps/web` — `pnpm verify` báo lỗi kèm hướng dẫn đưa code vào `packages/shared`. Chép file này sang dự án thật để giữ nguyên ranh giới.

App `web` và `mobile` trong mẫu chỉ là client TypeScript; khi dùng thật, thay bằng `create-next-app` / `create-expo-app` và giữ việc gọi API qua `@app/shared`.

## Áp vào dự án có sẵn

```bash
# chép vào gốc monorepo của bạn
cp -r CLAUDE.md SETUP.md .claude scripts docs /path/to/your-monorepo/
cd /path/to/your-monorepo
chmod +x .claude/hooks/*.sh scripts/*.sh
npm pkg set scripts.verify="bash scripts/verify.sh"
echo "CLAUDE.local.md" >> .gitignore
```

Sau đó mở `claude`, gõ `/hooks` để kiểm tra hook đã được nhận. Chi tiết xem [SETUP.md](SETUP.md).

## Vòng làm việc

`/new-feature <tên> <mô tả>` → duyệt plan → Claude làm shared → backend → web → mobile (hook tự format, chặn khi verify đỏ) → subagent `code-reviewer` → commit → `/handoff` → `/clear`.

## Cải tiến dần

- Claude sai cùng một lỗi lần 2 → thêm 1 dòng vào CLAUDE.md.
- Lần 3 → biến thành lint rule hoặc hook.
- Lặp lại một prompt ~3 lần → biến thành command.
