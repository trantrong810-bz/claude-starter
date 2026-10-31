---
so: 0011
pham-vi: rong
trang-thai: chap-nhan
thay-the-boi:
ngay: 2026-11-01
model: claude-opus-5-5
nguon: ca-20261101-19, ca-20261101-20, ca-20261101-22
---

# Mọi quyết định có tranh cãi đều có ADR; quyết định ảnh hưởng rộng được đánh dấu R

## Bối cảnh

Cần tra lại vì sao một quyết định được đưa ra, kể cả khi đã đổi ý về sau.

## Phương án

- Chỉ ghi quyết định rộng: ít file nhưng mất lý do của quyết định nhỏ.
- Ghi mọi quyết định có tranh cãi, đánh dấu riêng loại rộng.

## Quyết định

ADR trong `docs/decisions/`. Rộng: `pham-vi: rong`, chữ R trong tên file, bảng riêng trên cùng của mục lục tự sinh. Có trường `model`. `scripts/adr.mjs check` chạy trong verify.

## Hệ quả

Nhiều ADR hơn nhưng vẫn lọc nhanh nhờ đánh dấu. Quyết định bị đảo ngược được giữ lại với trạng thái bi-thay-the.
