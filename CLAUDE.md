# Project: <TÊN DỰ ÁN>

<1–2 câu: app làm gì, cho ai.>

## Stack

- Monorepo: pnpm workspaces + Turborepo
- apps/backend: Node + <Hono/NestJS>, PostgreSQL (Prisma/Drizzle)
- apps/web: Next.js (App Router)
- apps/mobile: Expo (React Native)
- packages/shared: types, Zod schemas, API client — NGUỒN SỰ THẬT DUY NHẤT cho contract API

## Lệnh

- `pnpm dev` — chạy tất cả (cần `docker compose up -d` trước)
- `pnpm verify` — typecheck + lint + test phần bị ảnh hưởng. In "VERIFY OK" hoặc chỉ các dòng lỗi.
- `pnpm db:reset` — migrate + seed lại DB local
- Tài khoản test: xem `docs/dev-accounts.md`

## Quy tắc

- Đổi API: sửa schema trong packages/shared TRƯỚC, sau đó backend, rồi web/mobile.
- Không sửa migration đã tồn tại; tạo migration mới.
- Không đọc/sửa `.env*`. Biến môi trường mẫu nằm trong `.env.example`.
- Chưa chạy `pnpm verify` thành công thì chưa coi là xong.
- Task nhiều bước: plan và tiến độ ghi vào `docs/specs/<feature>.md`, cập nhật trước khi kết thúc session.

## Tài liệu (đọc khi cần, đừng đọc hết)

- Kiến trúc: @docs/ARCHITECTURE.md
- Spec tính năng: docs/specs/
