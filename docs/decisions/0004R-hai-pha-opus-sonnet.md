---
so: 0004
pham-vi: rong
trang-thai: chap-nhan
thay-the-boi:
ngay: 2026-11-01
model: claude-opus-5-5
nguon: ca-20261101-11, ca-20261101-12, commit 4f1b848
---

# Task lớn chạy hai pha, hai session: Opus lập kế hoạch, Sonnet thực thi

## Bối cảnh

Tư duy (plan, contract) và viết code có chi phí khác nhau. Đổi model giữa session làm mất prompt cache (theo hướng dẫn của Lydia Hallie, Anthropic).

## Phương án

- Một session, một model mạnh: đơn giản nhưng đắt.
- Một session, đổi model giữa chừng: rẻ hơn nhưng mất cache.
- Hai session tách bởi `/clear`, mỗi session một model; trạng thái truyền qua spec.

## Quyết định

`/plan-feature` (Opus) → `/handoff` → `/clear`, `/model sonnet` → `/build-feature` (Sonnet).

## Hệ quả

Phần tốn kém dùng model mạnh, phần nhiều token dùng model rẻ, không phá cache. Cần spec viết tốt; hook SessionStart giúp session mới tự biết việc đang dở.
