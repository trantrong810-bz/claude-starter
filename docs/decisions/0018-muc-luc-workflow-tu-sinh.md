---
so: 0018
pham-vi: tinh-nang # rong | tinh-nang
trang-thai: chap-nhan # de-xuat | chap-nhan | bi-thay-the
thay-the-boi: # số ADR mới, chỉ khi bi-thay-the
ngay: 2026-11-01
model: claude-opus-5-5
nguon: yêu cầu "tách các workflow ở trong docs/WORKFLOW.md sang các file con" và "sau này nếu thêm workflow thì sao?"; plan docs/plans/t-ch-c-c-workflow-floofy-biscuit.md
---

# Mỗi quy trình một file trong docs/workflows/, docs/WORKFLOW.md là mục lục tự sinh

## Bối cảnh

`docs/WORKFLOW.md` gom mọi sơ đồ quy trình vào một file dài, càng thêm quy trình càng khó đọc và khó sửa. Tách mỗi quy trình ra một file thì mục lục trong `WORKFLOW.md` phải giữ khớp với thư mục. Nếu quên thêm dòng khi tạo quy trình mới, mục lục lệch mà không ai hay.

## Phương án

- Mục lục tự sinh từ front-matter (`thu-tu`, `tieu-de`, `mo-ta`) bằng `scripts/workflow.mjs index`, và `check` chạy trong `verify --quick`. Không lệch được, cách làm giống `adr.mjs` và `todo.mjs`. Đổi lại phải thêm một script và có front-matter ở mỗi file.
- Mục lục viết tay, `check` chỉ đối chiếu link với file. Không cần front-matter, nhưng vẫn phải tự viết dòng mục lục.
- Chỉ ghi quy tắc trong `CLAUDE.md`. Không thêm code, nhưng quên thì không có gì bắt lỗi.

## Quyết định

Chọn phương án 1 (người dùng chọn). Cách này dùng lại khuôn của `adr.mjs` (đọc front-matter, so mục lục bỏ qua khoảng trắng căn bảng của Prettier). Mẫu cho quy trình mới nằm ở `docs/workflows/_template.md`.

## Hệ quả

- Thêm quy trình: chép `_template.md`, điền, chạy `node scripts/workflow.mjs index`. Nếu quên, hook Stop (`verify --quick`) chặn lại.
- Không sửa tay `docs/WORKFLOW.md`; muốn đổi lời dẫn thì sửa `renderIndex` trong `scripts/workflow.mjs`.
- Link tới mục cũ dạng `WORKFLOW.md#...` đã hỏng; link mới trỏ thẳng tới file con.
