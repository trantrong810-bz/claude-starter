---
so: 0005
pham-vi: rong
trang-thai: chap-nhan
thay-the-boi:
ngay: 2026-11-01
model: claude-opus-5-5
nguon: ca-20261101-14, commit b6d0967
---

# Contract và test viết trước; stub 'not implemented'; cờ .allow-red chỉ bỏ qua test

## Bối cảnh

Pha 2 cần trọng tài khách quan. Bản đầu: test gọi hàm chưa tồn tại (đỏ sai lý do), và cờ `.allow-red` tắt toàn bộ kiểm tra.

## Phương án

- Viết code rồi mới viết test: Claude tự chấm bài mình.
- Test trước không có stub: lỗi type che mất hành vi.
- Test trước + stub có chữ ký đầy đủ; cờ chỉ bỏ qua test, typecheck và lint vẫn bắt buộc.

## Quyết định

Pha 1 viết schema, stub `throw new Error("not implemented")`, test đỏ vì đúng lý do. Cờ `.allow-red` chỉ bỏ qua test; SessionStart cảnh báo khi cờ còn bật.

## Hệ quả

Chữ ký hàm thành một phần contract được duyệt. Quên xóa cờ không còn làm mất bảo vệ âm thầm.
