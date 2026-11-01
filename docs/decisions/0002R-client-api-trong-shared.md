---
number: 0002
scope: broad # broad | feature
status: accepted # proposed | accepted | superseded
superseded-by: # number of the new ADR, only when superseded
date: 2026-11-01
model: claude-opus-5-5
source: ca-20261101-04, ca-20261101-15, commit 1bbadf3
---

# Client gọi API đặt trong packages/shared, các app chỉ chứa UI

## Bối cảnh

Lần chạy thử toggle-todo: hai subagent viết hàm gọi API giống hệt nhau ở web và mobile, không có test; reviewer bắt lỗi `id` không encode và response chỉ ép kiểu `as`.

## Phương án

- Mỗi app tự viết client: linh hoạt, nhưng lặp code và lặp lỗi.
- Client sinh tự động từ OpenAPI: chắc chắn nhưng thêm công cụ.
- Client viết tay một lần trong shared, có test với `fetch` giả.

## Quyết định

Client nằm trong `packages/shared`: parse response bằng schema, encode mọi tham số URL, có test. App chỉ gọi client.

## Hệ quả

Đổi contract làm lỗi lan tới cả 4 package. App không còn `fetch` riêng; `app-builder` và `code-reviewer` được dặn kiểm tra điều này.
