---
so: 0016
pham-vi: rong # rong | tinh-nang
trang-thai: chap-nhan # de-xuat | chap-nhan | bi-thay-the
thay-the-boi: # số ADR mới, chỉ khi bi-thay-the
ngay: 2026-11-01
model: claude-opus-5-5
nguon: yêu cầu "công cụ tự động format khi thay đổi các file trong dự án bằng tay"; ADR 0014R, 0015R
---

# Git pre-commit tự chạy Prettier trên file đã stage rồi stage lại

## Bối cảnh

File Claude sửa đã được format bằng hook `format.sh`, file người sửa trong VSCode được format khi lưu (ADR 0015R). Còn lọt: file sửa bằng editor khác, khi chưa cài extension Prettier, hoặc lưu bằng "Save without formatting". Diff format lẫn vào commit sau làm review khó đọc.

## Phương án

- Pre-commit tự format file đã stage rồi `git add` lại: người không phải làm gì; bất lợi là commit đổi nội dung so với lúc stage, và file stage một phần không format được an toàn.
- Pre-commit chỉ `prettier --check` và chặn: không tự đổi file; nhưng thêm một vòng sửa tay mỗi lần lệch.
- Watcher nền format mọi file khi lưu trên đĩa: bao mọi editor; nhưng phải nhớ bật, và giành file với format-on-save của VSCode.

## Quyết định

Chọn phương án 1 (người dùng chọn). File stage một phần không bị format; hook chỉ kiểm tra bản đã stage và chặn nếu lệch, để không kéo phần chưa stage vào commit. Hook chỉ chạy khi có `node_modules/.bin/prettier`, nên repo kit gốc (không cài Prettier) không bị ảnh hưởng. Danh sách đuôi file dùng chung với `format.sh`.

## Hệ quả

- Commit của người luôn đúng format, kể cả khi bỏ qua VSCode; chỉ có hiệu lực khi đã bật `core.hooksPath .githooks`.
- Commit chậm thêm thời gian chạy Prettier trên các file đã stage.
- Đổi danh sách đuôi file phải sửa cả `.githooks/pre-commit` và `.claude/hooks/format.sh`.
