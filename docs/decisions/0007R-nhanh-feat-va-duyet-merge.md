---
so: 0007
pham-vi: rong
trang-thai: chap-nhan
thay-the-boi:
ngay: 2026-11-01
model: claude-opus-5-5
nguon: ca-20261101-15, commit 1bbadf3
---

# Tính năng lớn làm trên nhánh feat/, merge vào main là điểm duyệt

## Bối cảnh

Lần chạy thử commit test đỏ thẳng vào main giữa hai session; reviewer mặc định `git diff HEAD` rỗng sau khi commit theo lớp.

## Phương án

- Commit thẳng vào main: đơn giản nhưng main hỏng giữa các pha.
- Nhánh feat/ + merge fast-forward sau khi bạn duyệt.

## Quyết định

Pha 1 tạo `feat/<tên>`; reviewer xem `main...HEAD`; merge chỉ sau khi bạn đồng ý.

## Hệ quả

main luôn xanh. Thêm một điểm duyệt của con người (tổng cộng 3: plan, merge, retro).
