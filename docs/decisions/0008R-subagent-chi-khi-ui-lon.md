---
so: 0008
pham-vi: rong
trang-thai: chap-nhan
thay-the-boi:
ngay: 2026-11-01
model: claude-opus-5-5
nguon: ca-20261101-15, commit 1bbadf3
---

# Chỉ dùng subagent cho web/mobile khi mỗi app có phần UI đáng kể

## Bối cảnh

Lần chạy thử: hai subagent tốn khoảng 24k token cho 6 dòng code mỗi bên.

## Phương án

- Luôn dùng subagent song song: context chính gọn nhưng tốn khởi động (~10k token mỗi subagent).
- Không bao giờ dùng: rẻ với việc nhỏ nhưng phình context với việc lớn.
- Quyết định theo Plan: subagent chỉ khi cả hai app có UI lớn.

## Quyết định

Pha 1 ghi trong Plan mỗi app có UI đáng kể hay không; pha 2 dựa vào đó để chọn.

## Hệ quả

Việc nhỏ rẻ hơn nhiều; việc lớn vẫn giữ được context chính gọn.
