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
  hooks/session-context.sh       # đầu session: báo việc đang dở
  hooks/verify-on-stop.sh        # chặn kết thúc khi verify đỏ
  commands/plan-feature.md       # /plan-feature — pha 1: plan, contract, test đỏ
  commands/build-feature.md      # /build-feature — pha 2: test xanh, web+mobile song song
  commands/handoff.md            # /handoff — ghi tiến độ trước /clear
  commands/retro.md              # /retro — biến lỗi thành lint/hook/CLAUDE.md
  agents/app-builder.md          # subagent làm một app (web hoặc mobile)
  agents/code-reviewer.md        # subagent review diff (Sonnet)
scripts/verify.sh                # typecheck + lint + test phần bị ảnh hưởng
scripts/try-example.sh           # dựng demo chạy được từ example/
example/                         # monorepo mẫu tối giản
docs/specs/_template.md          # mẫu spec cho mỗi tính năng
docs/WORKFLOW.md                 # sơ đồ Mermaid của quy trình + lớp bảo vệ
```

Sơ đồ quy trình đầy đủ: [docs/WORKFLOW.md](docs/WORKFLOW.md) (GitHub hiển thị Mermaid trực tiếp).

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
printf 'CLAUDE.local.md\n.claude/.allow-red\n' >> .gitignore
```

Sau đó mở `claude`, gõ `/hooks` để kiểm tra hook đã được nhận. Chi tiết xem [SETUP.md](SETUP.md).

## Quy trình

### Phân loại task trước

| Loại | Dấu hiệu                          | Cách làm                                       |
| ---- | --------------------------------- | ---------------------------------------------- |
| Nhỏ  | Sửa 1 chỗ, bug rõ ràng            | Làm thẳng. Stop hook là đủ kiểm soát.          |
| Vừa  | 1–2 lớp, không đổi contract API   | Plan ngắn trong chat, duyệt, làm.              |
| Lớn  | Đổi contract API hoặc chạm 3+ lớp | `/plan-feature` → `/build-feature` → `/retro`. |

Phần lớn việc hằng ngày là loại nhỏ và vừa — đừng ép chúng qua quy trình lớn.

### Task lớn: hai pha, hai session

```
Session 1 (Opus)                         Session 2 (Sonnet)
/plan-feature <tên> <mô tả>              /build-feature <tên>
  → DUYỆT plan + contract  ◀── bạn         → backend: test xanh → commit
  → shared schema + test backend đỏ        → web ┐ subagent app-builder
  → commit → /handoff                      → mobile ┘ song song → commit
        │                                  → code-reviewer
        └── /clear, /model sonnet ──▶      → /retro  ◀── bạn chọn cải tiến
```

Vì sao như vậy:

- **Model đúng việc, không phá cache.** Phần cần tư duy (plan, contract, test) dùng Opus; phần nhiều token (viết code) dùng Sonnet. Đổi model ở ranh giới `/clear` nên không làm mất prompt cache giữa session.
- **Contract + test chốt trước.** Pha 2 có "trọng tài" sẵn: làm cho test xanh, không phải tự phán đoán khi nào xong.
- **Song song khi đã độc lập.** Web và mobile chỉ phụ thuộc contract, nên chạy hai subagent cùng lúc; context chính chỉ nhận vài dòng kết quả.
- **Commit mỗi lớp.** Điểm quay lại rõ ràng, diff nhỏ nên Stop hook chạy nhanh.
- **Bạn chỉ cần có mặt ở 2 điểm:** duyệt plan/contract (sửa ở đây rẻ nhất) và chọn đề xuất của `/retro`.

### Cải tiến dần — tự động qua `/retro`

Sau mỗi task lớn, `/retro` đề xuất cách khắc phục rẻ nhất cho từng lỗi đã gặp, theo thứ tự: lint rule/hook → một dòng CLAUDE.md → command mới. Nó cũng đề xuất xóa dòng CLAUDE.md đã thừa, để file luôn ngắn.
