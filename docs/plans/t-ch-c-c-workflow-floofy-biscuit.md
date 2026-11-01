# Tách docs/WORKFLOW.md thành các file con trong docs/workflows/

## Context

`docs/WORKFLOW.md` đang gom 6 quy trình (5 sơ đồ Mermaid và 1 bảng) trong một file dài. Mỗi quy trình sẽ có file riêng trong `docs/workflows/`. `WORKFLOW.md` thành mục lục **tự sinh** từ front-matter của các file con, và `verify --quick` báo lỗi khi mục lục lệch, giống cách `adr.mjs` đang làm. Thêm workflow sau này chỉ cần tạo file rồi chạy `node scripts/workflow.mjs index`; nếu quên, verify sẽ báo.

## 1. File con (nội dung chép nguyên văn từ WORKFLOW.md)

Mỗi file có front-matter rồi đến `# <tieu-de>`:

```md
---
thu-tu: 1
tieu-de: Tổng quan
mo-ta: Phân loại task, pha 1 Opus và pha 2 Sonnet, merge, retro.
---
```

| File                               | Mục gốc (dòng WORKFLOW.md)                                            |
| ---------------------------------- | --------------------------------------------------------------------- |
| `docs/workflows/tong-quan.md` (1)  | Tổng quan (5–71)                                                      |
| `docs/workflows/lop-bao-ve.md` (2) | Lớp bảo vệ chạy tự động (73–115), link `GIT.md` đổi thành `../GIT.md` |
| `docs/workflows/doi-may.md` (3)    | Đổi máy hoặc tài khoản (117–146)                                      |
| `docs/workflows/tra-cuu.md` (4)    | Lịch sử và tra cứu (148–163)                                          |
| `docs/workflows/doi-model.md` (5)  | Khi nào đổi model (165–172)                                           |
| `docs/workflows/phat-hanh.md` (6)  | Phát hành version (174–203)                                           |

Thêm `docs/workflows/_template.md` (front-matter mẫu, một sơ đồ rỗng, và dòng nhắc `classDef human` cho ô người duyệt). `load()` bỏ qua file bắt đầu bằng `_`, giống adr.mjs.

## 2. scripts/workflow.mjs (mới, viết theo khuôn của scripts/adr.mjs)

- `parse` / `load`: dùng lại đúng cách của [adr.mjs:21-42](scripts/adr.mjs#L21-L42) (chuẩn hoá CRLF, đọc front-matter bằng regex, bỏ `README.md` và `_*`). Sắp xếp theo `thu-tu`, sau đó theo tên file.
- `renderIndex`: sinh `docs/WORKFLOW.md`, gồm:
  - tiêu đề, dòng "File này do `node scripts/workflow.mjs index` sinh ra — đừng sửa tay."
  - câu nhắc "Đổi command, hook, subagent hay quy tắc phân loại task → cập nhật sơ đồ trong `docs/workflows/` cùng commit."
  - "Ô vàng trong sơ đồ là điểm bạn cần có mặt."
  - bảng `| # | Quy trình | Mô tả |` có link tới `workflows/<file>.md`
  - dòng "Thêm workflow: chép `workflows/_template.md` sang `workflows/<ten>.md`, điền rồi chạy `node scripts/workflow.mjs index`."
- `check`: kiểm tra tên file kebab-case ASCII; có front-matter; có đủ `thu-tu` (số), `tieu-de`, `mo-ta`; `thu-tu` không trùng. Mục lục khớp `renderIndex`, so sánh qua `norm()` bỏ khoảng trắng căn bảng (chép từ [adr.mjs:114-124](scripts/adr.mjs#L114-L124)). Lỗi in `WORKFLOW LỖI:` kèm danh sách, rồi `exit 1`.
- CLI: `index | check`.

## 3. Nối vào verify

[scripts/verify.sh:20](scripts/verify.sh#L20), sau khối todo:

```bash
if [ -f scripts/workflow.mjs ] && [ -d docs/workflows ]; then
  node scripts/workflow.mjs check || fail=1
fi
```

Thêm "mục lục workflow" vào chú thích `--quick` ở dòng 5.

## 4. Cập nhật tham chiếu

- [README.md:61](README.md#L61): cây thư mục thêm `docs/workflows/`; đổi mô tả của `docs/WORKFLOW.md` thành "mục lục tự sinh".
- [README.md:139](README.md#L139): link sang `docs/workflows/doi-may.md`.
- [README.md:186](README.md#L186): link sang `docs/workflows/phat-hanh.md`.
- [CLAUDE.md:39](CLAUDE.md#L39): "cập nhật sơ đồ trong `docs/workflows/` (workflow mới: tạo file từ `_template.md` rồi chạy `node scripts/workflow.mjs index`) ở cùng commit."
- [.claude/commands/retro.md:20](.claude/commands/retro.md#L20): sửa câu tương ứng cho giống.
- `docs/workflows/lop-bao-ve.md`: thêm "mục lục workflow" vào node `QUICK` của sơ đồ (verify --quick giờ kiểm thêm việc này).

## 5. ADR và changelog

- Lúc chọn cách giữ mục lục có 3 phương án hợp lý: tự sinh có check, viết tay có check, chỉ ghi quy tắc. Vì vậy cần một ADR: `node scripts/adr.mjs new muc-luc-workflow-tu-sinh --model claude-opus-5-5`. Không đánh `--rong`, vì thay đổi chỉ chạm docs/scripts và đảo ngược dễ. Điền nội dung rồi chạy `node scripts/adr.mjs index`.
- `Unreleased` → `### Changed` trong `docs/CHANGELOG.md`: "`WORKFLOW.md` thành mục lục tự sinh; sơ đồ tách sang `docs/workflows/`."
- `scripts/`, `CLAUDE.md` và `retro.md` thuộc phần root. Thêm một dòng `### Added` (`scripts/workflow.mjs`, check trong verify) vào changelog root. Nếu version-guard báo thiếu ở phần nào thì gọi `versioner`.

## 6. Git

Dùng nhánh `docs/split-workflows` (kiểm lại tiền tố trong docs/GIT.md trước khi tạo). Một commit: `docs: split workflow diagrams into docs/workflows`. Merge vào main bằng `--ff-only` sau khi bạn duyệt.

## Verification

- `node scripts/workflow.mjs index`, rồi `node scripts/workflow.mjs check` phải trả exit 0.
- Thử lỗi: tạm xoá một dòng trong bảng WORKFLOW.md thì `check` báo "mục lục chưa cập nhật"; tạo file con thiếu `mo-ta` thì `check` báo thiếu. Hoàn tác cả hai sau khi thử.
- `docs/workflows/` có đúng 5 khối ```mermaid; `grep -rn "WORKFLOW.md#" --exclude-dir=history` không còn kết quả.
- `pnpm verify` in `VERIFY OK`.
