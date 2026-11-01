---
number: 0014
scope: broad # broad | feature
status: accepted # proposed | accepted | superseded
superseded-by: # number of the new ADR, only when superseded
date: 2026-11-01
model: claude-opus-5-5
source: yêu cầu "thêm git convention để mỗi phiên làm việc claude phải tham khảo"; docs/GIT.md
---

# Quy ước git chung trong docs/GIT.md, nạp mọi session và ép bằng hook

## Bối cảnh

Quy ước git nằm rải rác: command dạy `feat(<tên>): backend`, `/release` dạy `docs(changelog): ...`, `version.mjs` ghi `release: vX`, còn git log thật là câu tiếng Anh tự do (`Add ...`). Bản 0.1.0 được phát hành tay mà không có tag, nên `version.mjs check` so với commit đầu và báo thiếu changelog sai. Trên Windows (`core.autocrlf=true`) file bị checkout CRLF, `adr.mjs` không đọc được frontmatter của cả 13 ADR. Mỗi session Claude phải tự đoán quy ước.

## Phương án

- **Định dạng message:** (a) Conventional Commits; (b) câu tự do như log cũ. (a) máy kiểm tra được, ánh xạ sang mục changelog, đã được các command dùng sẵn; (b) không cần đổi thói quen nhưng không ép được.
- **Ngôn ngữ:** tiếng Anh (khớp lịch sử, công cụ, header ASCII) hoặc tiếng Việt (khớp tài liệu). Chọn tiếng Anh; tài liệu và changelog vẫn tiếng Việt.
- **Merge:** fast-forward + rebase (lịch sử thẳng, giữ commit theo lớp) / squash (gọn nhưng mất điểm quay lại) / merge commit (lịch sử rẽ nhánh, khó đọc với một người làm).
- **Cách để Claude "luôn tham khảo":** chỉ ghi trong tài liệu (dễ bị bỏ qua) / `@docs/GIT.md` trong CLAUDE.md (luôn trong context, tốn token mỗi session) / thêm hook ép (chắc chắn, có chi phí bảo trì). Chọn cả hai cái sau.
- **Ép cho người:** git hook trong `.githooks/` (không phụ thuộc thư viện) / husky + commitlint (cần package.json gốc và dependency). Chọn `.githooks/`.

## Quyết định

Conventional Commits tiếng Anh, nhánh `<type>/<tên>`, merge chỉ `--ff-only`, tag chỉ qua `version.mjs release`, LF qua `.gitattributes`. Toàn bộ trong `docs/GIT.md`, nạp qua `@` trong CLAUDE.md. Ép bằng `scripts/commit-msg.mjs` dùng chung cho hook `commit-guard.sh` (Claude, luôn chạy) và `.githooks/commit-msg` + `pre-commit` (người, bật bằng `core.hooksPath`). SessionStart báo trạng thái git. Gắn bù tag `v0.1.0` cho f8379b7.

## Hệ quả

- Commit cũ (trước quy ước) giữ nguyên, không viết lại lịch sử.
- `docs/GIT.md` tốn token mỗi session: giữ ngắn, chỉ quy tắc, không giải thích dài.
- `commit-guard.sh` chỉ đọc được message từ `-m` hoặc heredoc; `-F` bỏ qua và để git hook kiểm tra.
- Mỗi bản clone mới phải chạy `git config core.hooksPath .githooks`; SessionStart nhắc khi chưa bật.
- Permissions `deny`/`ask` cho lệnh git nguy hiểm là tùy chọn (SETUP.md); Claude không tự sửa quyền của mình.
