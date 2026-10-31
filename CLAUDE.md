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
- Gọi API chỉ qua client trong packages/shared (parse response bằng schema, encode tham số URL). Apps chỉ chứa UI.
- Không sửa migration đã tồn tại; tạo migration mới.
- Không đọc/sửa `.env*`. Biến môi trường mẫu nằm trong `.env.example`.
- Chưa chạy `pnpm verify` thành công thì chưa coi là xong.
- Phân loại task trước khi làm: nhỏ (1 chỗ) → làm thẳng; vừa (không đổi contract) → plan ngắn trong chat; lớn (đổi contract API) → `/plan-feature` rồi `/build-feature`.
- Task nhiều session: plan và tiến độ ghi vào `docs/specs/<feature>.md`, cập nhật trước khi kết thúc session.
- Đổi command, hook, subagent hoặc quy tắc phân loại task trong `.claude/` → cập nhật sơ đồ Mermaid trong `docs/WORKFLOW.md` ở cùng commit.
- Quyết định có tranh cãi (có ≥2 phương án hợp lý) → tạo ADR: `node scripts/adr.mjs new <slug> [--rong] --model <model của bạn>`, điền nội dung, chạy `node scripts/adr.mjs index`. `--rong` khi ảnh hưởng ≥2 phần, đổi quy trình/contract dùng chung, hoặc khó đảo ngược.
- Tra cứu quyết định và lịch sử prompt: `/why <câu hỏi>`. Không đọc `history/` trừ khi cần tra cứu.
- Sửa file trong thư mục có `CHANGELOG.md` → thêm một dòng vào mục `Unreleased` của changelog gần nhất (Added / Changed / Fixed / Removed), cùng commit. Không tự sửa số version.

## Tài liệu (đọc khi cần, đừng đọc hết)

- Kiến trúc: @docs/ARCHITECTURE.md
- Spec tính năng: docs/specs/
