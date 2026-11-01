# Chiến lược: đưa Superpowers vào dự án (CHƯA phải plan chi tiết)

Nguồn: todo `docs/todo/root.md` — "cài đặt, đưa superpower vào quy trình hiện tại".
Trạng thái: đang bàn chiến lược với người dùng. **Chưa được viết plan chi tiết** cho tới khi người dùng duyệt chiến lược.

## Quy tắc người dùng đặt (chưa lưu — cần lưu vào CLAUDE.md repo khi ra khỏi plan mode)

- Khi plan: đưa **chiến lược** cho người dùng duyệt trước, rồi mới làm plan chi tiết.

## Nguyên tắc (người dùng chốt)

1. Flow chính là của dự án gốc (phân loại nhỏ/vừa/lớn, `/plan-feature`, `/build-feature`, `/ship`, `/handoff`, `/resume`, spec + todo trong repo).
2. Superpowers chỉ dùng theo case cụ thể.
3. Dùng có kiểm soát, ổn định: vendor vào folder `external/` của dự án, pin phiên bản, update có kiểm soát.

## Chiến lược hợp nhất (đề xuất, chờ duyệt)

- Chỉ vendor các skill được chọn; bỏ hook session-start và `using-superpowers`.
- 3 lớp: `.claude/` (dự án, thắng) · `external/superpowers/` (nguyên gốc, KHÔNG SỬA, diff với upstream = 0) · lớp tùy biến của dự án (CLAUDE.md + command).
- `external/` không được Claude Code tự nạp → chỉ dùng khi bảng định tuyến trong CLAUDE.md hoặc bước trong command trỏ tới (đọc SKILL.md theo đường dẫn).
- **Tắt plugin user-level `superpowers@superpowers-dev` trong `.claude/settings.json` của repo** (hiện nó vẫn inject hook vào mọi session) — kiểm chứng đã tắt thật.
- File `external/superpowers.md` (ngoài thư mục vendor): UPSTREAM (nguồn, tag/SHA pin, ngày, danh sách skill giữ) + **bảng ánh xạ** từng điểm chồng lấn: nguồn, thuật ngữ, input, output của mỗi bên, hướng (dự án đổi theo / dự án override), lý do. Bao gồm xử lý tham chiếu chéo `superpowers:xyz`, bước commit, đường dẫn `docs/superpowers/...` trong skill.
- Update: nhánh `chore/bump-superpowers` → script bump lấy skill trong danh sách từ tag mới → xem diff các skill giữ → chạy 2–3 task mẫu cố định so trước/sau → cập nhật `external/superpowers.md` → `/ship`.
- Loại `external/` khỏi format.sh, lint, `pnpm verify`, workspace, changelog hook.
- Kiểm tra đường lui: xóa `external/superpowers/` → flow gốc vẫn chạy.
- ADR `--rong`, cập nhật sơ đồ `docs/workflows/` + `node scripts/workflow.mjs index`, changelog `.claude`.

## Bảng định tuyến theo case (nháp)

| Case                                    | Skill                          | Gắn vào                                       |
| --------------------------------------- | ------------------------------ | --------------------------------------------- |
| Task vừa/lớn, yêu cầu chưa rõ           | brainstorming                  | plan ngắn trong chat / bước 2 `/plan-feature` |
| Viết logic có test                      | test-driven-development        | pha 1 RED, pha 2 GREEN                        |
| Bug khó, verify/test đỏ không rõ lý do  | systematic-debugging           | mọi loại task                                 |
| Trước khi báo xong/commit               | verification-before-completion | bằng chứng `pnpm verify`                      |
| Xử lý kết quả code-reviewer / review PR | receiving-code-review          | bước 6 `/build-feature`, `/ship`              |

Không dùng: using-superpowers, using-git-worktrees, finishing-a-development-branch, executing-plans, subagent-driven-development, requesting-code-review (giữ subagent `code-reviewer` của dự án), `/build-feature` + `app-builder` giữ nguyên.

## Câu hỏi còn mở (cần người dùng chốt)

1. Cách vendor: submodule (người dùng chọn trước đó) hay copy skill chọn lọc + script bump (đề xuất, khớp "chỉ vendor skill cần dùng")?
2. Tùy biến skill: gắn vào command sẵn có (đề xuất) hay skill wrapper trong `.claude/skills/` (lưu ý: sẽ tự kích hoạt theo description)?
3. Bảng case đủ chưa? `writing-plans`, `dispatching-parallel-agents` có dùng không?
