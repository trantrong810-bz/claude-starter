---
number: 0012
scope: broad # broad | feature
status: accepted # proposed | accepted | superseded
superseded-by: # number of the new ADR, only when superseded
date: 2026-11-01
model: claude-opus-5-5
source: ca-20261101-23, ca-20261101-24
---

# Công cụ version đi theo kit, dự án mới tạo cấu hình bằng `init`

## Bối cảnh

ADR 0009 đặt công cụ ở `tools/` để không chép sang dự án dùng kit. Muốn tự động versioning trong mọi dự án dùng kit thì dự án đó phải có công cụ.

## Phương án

- Giữ ở `tools/`: kit gọn, nhưng dự án dùng kit không tự động được.
- Chuyển sang `scripts/` và thêm `init` sinh `versions.json` từ `apps/*`, `packages/*`.

## Quyết định

Chuyển sang `scripts/version.mjs` (thay thế phần "chỉ dùng trong repo kit" của ADR 0009; phần còn lại của 0009 giữ nguyên). `init` tạo `versions.json`, `CHANGELOG.md` cho mỗi app/package, chế độ mặc định `changelog`. Chưa có tag thì so với commit đầu.

## Hệ quả

Lệnh đổi từ `node tools/version.mjs` sang `node scripts/version.mjs`. `try-example.sh` tự chạy `init`.
