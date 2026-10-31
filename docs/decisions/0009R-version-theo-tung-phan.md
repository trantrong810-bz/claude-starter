---
so: 0009
pham-vi: rong
trang-thai: chap-nhan
thay-the-boi:
ngay: 2026-11-01
model: claude-opus-5-5
nguon: ca-20261101-16, ca-20261101-17, ca-20261101-18, commit f8379b7
---

# Version và changelog riêng cho từng phần; mức bump suy ra từ changelog; chỉ tag version dự án

## Bối cảnh

Cần biết từng phần (.claude, docs, scripts, example, shared, be, fe, mobile) đang ở version nào và đã đổi gì.

## Phương án

- Một version chung: đơn giản nhưng không biết phần nào đổi.
- Version riêng, tự chọn mức bump: dễ sai, dễ quên.
- Version riêng, ghi `Unreleased` khi làm, `release` tự suy mức bump; tag riêng từng phần hoặc chỉ tag dự án.

## Quyết định

`versions.json` ánh xạ phần → đường dẫn (khớp dài nhất). Ghi `Unreleased` cùng commit; `tools/version.mjs release` bump theo mục Removed/Added/khác. Chỉ tag `vX.Y.Z`. Bắt đầu 0.1.0; ở 0.x major hạ xuống minor.

## Hệ quả

`check` chặn phần có thay đổi mà thiếu changelog. Proxy phiên Claude chặn đẩy tag — tag phải đẩy từ máy người dùng.
