# Plan: Todo/WIP có hệ thống, mang theo được khi đổi máy hoặc đổi tài khoản Claude

## Context

Hiện tại chỉ tính năng lớn có nơi ghi tiến độ (`docs/specs/<tên>.md` + `/handoff`). Task nhỏ/vừa, việc chưa làm, và **code đang sửa dở** không có chỗ lưu; memory của Claude nằm trong `~/.claude` (gắn với máy + tài khoản) nên không đi theo. Mục tiêu: mọi thứ cần để làm tiếp nằm trong git → `git pull` + `/resume` trên máy/tài khoản bất kỳ là làm tiếp được.

Đã chốt với người dùng:

- Code dở mang sang bằng **snapshot ref** `wip/<nhánh>` trên remote (không commit WIP vào nhánh thật).
- Phạm vi: **root, shared, be, fe, mobile** (khớp nhãn `versions.json`).
- `/handoff` **tự push** (gọi /handoff = đồng ý push).

## Thiết kế

### 0. Mọi trạng thái nằm trong repo, không trong `~/.claude`

| Thứ                       | Mặc định (trên máy)                     | Sau thay đổi (trong repo)                                                                                    |
| ------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| File plan (plan mode)     | `~/.claude/plans/*.md`                  | `docs/plans/` — `"plansDirectory": "docs/plans"` trong `.claude/settings.json`                               |
| Memory tự động của Claude | `~/.claude/projects/<repo>/memory/`     | Tắt cho dự án (`"autoMemoryEnabled": false`); thay bằng `TODO.md`, spec, ADR, CLAUDE.md                      |
| Todo / WIP                | (không có)                              | `TODO.md` + `docs/todo/`                                                                                     |
| Code dở                   | working tree trên máy                   | ref `wip/<nhánh>` trên remote                                                                                |
| Prompt                    | transcript `~/.claude/projects/*.jsonl` | đã có: `history/prompts/` (transcript gốc vẫn ở máy — Claude Code không cho đổi chỗ; không cần cho làm tiếp) |
| Usage, state session      | —                                       | `.claude/state/` (gitignore, theo máy — đúng ý vì là số của máy/tài khoản đó)                                |

- Plan file chép ngay plan này vào `docs/plans/todo-wip.md` làm file đầu tiên.
- `/handoff`: nếu session có plan file trong `docs/plans/` chưa commit → đổi tên theo nội dung (`<kebab>.md`, tên ngẫu nhiên khó tra) và commit cùng todo.
- Thêm `"docs/plans/"` vào `ignore` của `versions.json`.
- Tên chính xác của 2 setting (`plansDirectory`, `autoMemoryEnabled`) xác minh ở bước Verification 0 (tra docs Claude Code / `/config`) trước khi ghi.

### 1. Hai lớp todo cho mỗi phần (root, shared, be, fe, mobile)

| File                       | Ai viết                             | Nội dung                                                                            |
| -------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------- |
| `docs/todo/<phần>.md`      | **Người, viết tay**                 | Tự do: ý tưởng, việc cần làm, ưu tiên, ghi chú. Claude chỉ đọc.                     |
| `docs/todo/<phần>.auto.md` | **Claude** (`/todo`, `/handoff`)    | Đang làm (WIP), việc Claude ghi nhận, Xong gần đây. Dòng đầu trỏ tới file viết tay. |
| `TODO.md` (gốc repo)       | **Sinh tự động** (`todo.mjs index`) | Bảng tổng quan mọi phần, link tới cả 2 file của từng phần.                          |

**File viết tay** — chỉ một quy ước để đếm được: việc là dòng `- [ ] ...`, `[P1]` tuỳ chọn. Còn lại viết gì cũng được. Claude **không sửa chữ** trong file này; ngoại lệ duy nhất: đánh `[x]` khi việc đó xong (và ghi sha ở file auto).

**File auto** (`docs/todo/be.auto.md`):

```md
# Todo tự động: be

← [Tổng quan](../../TODO.md) · Viết tay: [be.md](be.md)

## Đang làm

- [ ] Phân trang /todos — từ: [be.md#L12](be.md#L12) · nhánh: feat/todo-paging · spec: docs/specs/todo-paging.md · 2026-11-01
  - Đang dở: service xong, controller chưa map query `cursor`
  - Tiếp theo: sửa `apps/backend/src/todos/routes.ts`, chạy test todos

## Việc cần làm

- [ ] [P2] Bỏ endpoint cũ /v0/todos (Claude phát hiện khi làm feat/todo-paging)

## Xong gần đây

- [x] Sửa encode query trong listTodos (2026-10-30, a1b2c3d)
```

- Bắt đầu một việc từ file viết tay → tạo item "Đang làm" ở file auto, ghi `từ: <file>#L<dòng>` trỏ ngược về.
- Task lớn: item trỏ tới spec, không chép lại tiến độ (spec là nguồn sự thật).
- "Xong gần đây" tối đa 10 dòng; cũ hơn xoá (git còn lịch sử).

**`TODO.md` gốc** — toàn bộ là khối sinh tự động (marker, không sửa tay):

```md
# Todo — tổng quan

<!-- todo:overview:start — sinh bởi node scripts/todo.mjs index, đừng sửa tay -->

| Phần     | Viết tay                     | Tự động                                | WIP   | Todo tay | Todo auto | P1    | Đang làm                             |
| -------- | ---------------------------- | -------------------------------------- | ----- | -------- | --------- | ----- | ------------------------------------ |
| root     | [root.md](docs/todo/root.md) | [root.auto.md](docs/todo/root.auto.md) | 0     | 2        | 0         | 1     | —                                    |
| be       | [be.md](docs/todo/be.md)     | [be.auto.md](docs/todo/be.auto.md)     | 1     | 3        | 1         | 1     | Phân trang /todos (feat/todo-paging) |
| ...      |                              |                                        |       |          |           |       |                                      |
| **Tổng** |                              |                                        | **2** | **9**    | **2**     | **2** |                                      |

Snapshot code dở: wip/feat/todo-paging (may-ban, 2026-11-01 17:40)
<!-- todo:overview:end -->

## Cách dùng

<ngắn: viết tay ở đâu, /todo, /handoff, /resume khi đổi máy>
```

- Thêm `"TODO.md"`, `"docs/todo/"` vào `ignore` của `versions.json` → sửa todo không đòi changelog.

### 1c. Script `scripts/todo.mjs` (cùng phong cách `adr.mjs`)

- `index` — với mỗi phần trong hằng `SCOPES = ["root","shared","be","fe","mobile"]`: đếm `- [ ]` (và `[P1]`) trong file viết tay; đếm "Đang làm"/"Việc cần làm" trong file auto, lấy dòng đầu + nhánh của item WIP; đọc snapshot từ `refs/remotes/origin/wip/*` (local, không fetch); ghi lại khối giữa marker trong `TODO.md`. Thiếu file → tạo khung rỗng.
- `check` — khối tổng quan khớp nội dung (như `adr.mjs check`); gọi trong `scripts/verify.sh` (cả `--quick`) → tổng quan không bao giờ lệch, kể cả khi người sửa file viết tay rồi quên index (verify báo, Claude chạy `index`).
- `/todo`, `/handoff`, `/resume` chạy `todo.mjs index` sau khi sửa todo, trước khi commit.
- `sync [phần...]` — đồng bộ file viết tay → file auto (rồi tự gọi `index`):
  - Mục sinh tự động `## Từ viết tay` trong file auto (giữa marker): danh sách việc `- [ ]` còn mở của file viết tay, `[P1]` lên đầu, mỗi dòng link `[be.md#L12](be.md#L12)`.
  - Việc viết tay đã đánh `[x]` mà đang có item "Đang làm" trỏ tới nó (`từ: be.md#L..`) → chuyển item sang "Xong gần đây".
  - Link `#L<dòng>` lệch vì người chèn/xoá dòng → tìm lại theo nội dung chữ, cập nhật số dòng; không tìm thấy (việc bị xoá) → item WIP giữ nguyên, thêm ghi chú `(việc gốc đã bị xoá khỏi be.md)`.
  - Chỉ ghi file auto + `TODO.md`; không bao giờ ghi file viết tay.

### 1d. Tự đồng bộ khi commit file viết tay

Khi commit có file viết tay (`docs/todo/<phần>.md`, không phải `.auto.md`) trong danh sách staged → chạy `node scripts/todo.mjs sync <các phần đó>` rồi `git add` file auto + `TODO.md` → **cùng một commit**.

- Người commit: thêm bước vào `.githooks/pre-commit` (đã có sẵn cơ chế format rồi stage lại file — làm theo đúng mẫu đó).
- Claude commit: `.claude/hooks/commit-guard.sh` đã bắt mọi `git commit`; thêm bước sync + `git add` trước khi cho qua (chạy cả khi máy chưa bật `.githooks`). Hai đường gọi chung `todo.mjs sync`, chạy lại lần 2 vô hại (idempotent).
- Commit chỉ đổi file todo/`TODO.md` không đòi verify xanh, không đòi changelog (đã nằm trong `ignore`).

### 2. Script `scripts/wip.mjs` (Node, không thư viện ngoài, theo phong cách `adr.mjs`; execSync dùng nháy kép)

- `save` — chụp working tree (cả file untracked, tôn trọng .gitignore) bằng index tạm: `GIT_INDEX_FILE=<tmp> git add -A` → `git write-tree` → `git commit-tree <tree> -p HEAD -m "wip: <nhánh> @ <hostname> <ISO time>"`. Push một lệnh: `git push origin <nhánh> +<sha>:refs/heads/wip/<nhánh>` (đẩy cả nhánh thật để parent có trên remote). Không đổi working tree, index, hay lịch sử nhánh. Working tree sạch → bỏ qua snapshot, chỉ push nhánh.
- `status` — `git fetch --prune origin "+refs/heads/wip/*:refs/remotes/origin/wip/*"`, liệt kê snapshot: nhánh, máy, thời gian, parent có khớp HEAD nhánh không.
- `restore [nhánh]` — điều kiện: working tree sạch (không thì dừng, báo). Switch sang nhánh (tạo tracking nếu chưa có), `git merge --ff-only origin/<nhánh>`; nếu HEAD ≠ parent của snapshot → dừng, báo snapshot cũ. Áp bằng `git diff HEAD <sha> --binary | git apply` (xử lý cả file xoá/thêm/binary; thay đổi nằm ở working tree, chưa stage). Thành công → xoá ref remote `git push origin :refs/heads/wip/<nhánh>`.
- `drop <nhánh>` — xoá snapshot thủ công.
- Chuẩn hoá CRLF khi đọc output (như `readText` trong `scripts/version.mjs`).

### 3. Commands (`.claude/commands/`)

- **`todo.md` (mới)** — `/todo` liệt kê; `/todo <scope> <mô tả> [P1|P2|P3]` thêm; `/todo start <...>` chuyển sang "Đang làm" (ghi nhánh/spec); `/todo done <...>` chuyển sang "Xong gần đây" kèm sha. Scope không ghi → suy từ đường dẫn file theo `versions.json` (`example/apps/backend` → be...), mơ hồ thì hỏi. Ghi vào file **auto** (không vào file viết tay); `/todo` không đối số: in bảng `TODO.md` + mục chưa xong của cả 2 lớp. Commit `chore(todo): <...>` gồm `TODO.md` + `docs/todo/`.
- **`handoff.md` (sửa)** — ngoài cập nhật spec: cập nhật mục "Đang làm" trong file **auto** của mọi phần bị ảnh hưởng (Đang dở / Tiếp theo phải cụ thể tới file). Commit `docs/todo/` + spec (`chore(todo): handoff <nhánh>`), rồi `node scripts/wip.mjs save` (tự push). Cuối cùng in 1 dòng: "Máy khác: git pull rồi /resume".
- **`resume.md` (mới)** — `git pull --ff-only`, `node scripts/wip.mjs status`, đọc bảng tổng quan trong `TODO.md` rồi mục "Đang làm" của các file con có WIP; chọn việc (một việc thì lấy luôn, nhiều thì hỏi); `wip.mjs restore <nhánh>` nếu có snapshot; đọc spec liên quan; báo 3 dòng: đang ở đâu, bước tiếp, lệnh verify.

### 4. Hook `session-context.sh` (sửa)

Thêm khối ngắn: 1 dòng tổng từ bảng tổng quan của `TODO.md` (`Todo: 2 WIP, 8 việc (2 P1) — xem TODO.md`) + mỗi item WIP 1 dòng (phần, tiêu đề, nhánh). Nếu có `refs/remotes/origin/wip/<nhánh hiện tại>` (local, không fetch để hook nhanh) → in "Có snapshot code dở cho nhánh này: chạy /resume". Giữ output vài dòng.

### 4b. Tự lưu WIP và dừng khi usage ≥ 90%

Hook không nhận được số usage; chỉ **statusline** nhận (JSON stdin có `rate_limits.five_hour` / `seven_day` với `used_percentage`, `resets_at` — chỉ có với gói Pro/Max — và `context_window.used_percentage`). Nên dùng statusline làm cảm biến, hook làm cái phanh:

- **`.claude/hooks/statusline.mjs` (mới)**, khai báo `statusLine` trong `.claude/settings.json`: đọc stdin, ghi `.claude/state/usage.json` `{fiveHour, sevenDay, resetsAt, context, at}`, in 1 dòng `5h 72% · 7d 40% · ctx 35%` (≥ 80% thêm dấu cảnh báo). Thiếu `rate_limits` → in `usage: n/a`, guard không kích hoạt.
- **`.claude/hooks/usage-guard.mjs` (mới)**, `PreToolUse` mọi tool + `Stop`. Ngưỡng 90% (đổi bằng env `CLAUDE_WIP_THRESHOLD`). Kích hoạt khi `max(fiveHour, sevenDay) ≥ ngưỡng` và `resetsAt` chưa qua (cửa sổ đã reset hoặc đổi tài khoản → số mới ghi đè, tự hết chặn).
  - Chưa handoff: `PreToolUse` chặn (exit 2) mọi tool **trừ** việc của handoff — Read/Edit/Write trong `docs/todo/`, `docs/specs/`; Bash `git status|diff|add|commit`, `node scripts/wip.mjs`. Thông báo: "Usage X% ≥ 90%: dừng việc đang làm, làm /handoff ngay (todo + spec, commit, `wip.mjs save`), rồi dừng." `Stop` cũng chặn để Claude không bỏ dở mà chưa lưu.
  - `wip.mjs save` thành công ghi marker `.claude/state/handoff-<resetsAt>.done` → `Stop` được phép; `PreToolUse` vẫn chặn mọi tool sửa đổi (Claude dừng hẳn, báo "Đã lưu WIP, đổi tài khoản/máy rồi /resume").
  - Marker theo `resetsAt` nên sang cửa sổ mới tự hết hiệu lực.
- Context window ≥ 90% không chặn (Claude tự compact, không mất việc) — chỉ hiển thị trên statusline.

### 5. Quy tắc & tài liệu

- `docs/GIT.md`: mục mới "Snapshot WIP": ref `wip/<nhánh>` chỉ do `wip.mjs` tạo/xoá, được force-update (`+`), không checkout, không merge. Ngoại lệ: commit chỉ gồm `docs/todo/` (và spec) được phép khi verify đỏ; `/handoff` được push (người gọi /handoff = yêu cầu push).
- `CLAUDE.md`: 1–2 dòng: "Tổng quan việc: `TODO.md` (tự sinh). Việc người viết tay: `docs/todo/<phần>.md` — Claude chỉ đọc, chỉ được đánh `[x]`. Claude ghi WIP/việc vào `docs/todo/<phần>.auto.md` (`/todo`), không lưu vào memory của Claude. Đổi máy/tài khoản: `/handoff` trước, `git pull` + `/resume` sau."
- `docs/WORKFLOW.md`: thêm sơ đồ Mermaid "Đổi máy / đổi tài khoản" (handoff → save → push → pull → resume → restore) và cập nhật node SessionStart trong sơ đồ lớp bảo vệ.
- `SETUP.md`: dòng "Máy mới" nhắc `/resume`.
- `.claude/settings.json`: allow `Bash(node scripts/wip.mjs:*)` (file đang có thay đổi chưa commit của người dùng — xem diff trước, chỉ thêm dòng).
- ADR: `node scripts/adr.mjs new todo-va-snapshot-wip --rong --model claude-opus-5-5` (phương án bị loại: commit wip + squash, chỉ ghi todo; memory Claude), rồi `adr.mjs index`.
- Changelog `Unreleased`: `.claude/CHANGELOG.md`, `docs/CHANGELOG.md`, `scripts/CHANGELOG.md`.

## Commit (trên `main`, task vừa — có thể tách nhánh `chore/todo-wip` nếu muốn)

1. `feat(scripts): add wip snapshot save and restore`
2. `feat(claude): add todo and resume commands with wip handoff` (commands, hook, settings, CLAUDE.md, docs, ADR, changelog, `scripts/todo.mjs`, `TODO.md` + `docs/todo/` khởi tạo)

## Verification

1. `node scripts/wip.mjs save` trên nhánh thử với: file sửa, file mới untracked, file xoá → kiểm tra `git ls-remote origin "refs/heads/wip/*"` có ref; `git status` không đổi.
2. Mô phỏng máy thứ 2: `git clone` repo vào scratchpad → `node scripts/wip.mjs restore <nhánh>` → `git status` khớp đủ 3 loại thay đổi; ref remote đã bị xoá.
3. Trường hợp lỗi: restore khi working tree bẩn → dừng; snapshot có parent cũ → dừng với thông báo.
   4a. Xác nhận tên setting `plansDirectory` / `autoMemoryEnabled`; đặt xong vào plan mode thử → file plan mới nằm trong `docs/plans/`.
4. Trước khi viết guard: cho statusline tạm dump stdin vào `.claude/state/statusline-sample.json` để xác nhận đúng tên trường `rate_limits` trên bản Claude Code đang dùng; khác thì chỉnh parser.
   4b. Usage guard: ghi tay `usage.json` với `fiveHour: 91` → Edit file ngoài `docs/todo` bị chặn kèm thông báo; Edit `docs/todo/be.md` và `node scripts/wip.mjs save` được phép; sau save, Stop được phép. `fiveHour: 50` hoặc `resetsAt` đã qua → không chặn gì.
5. `bash .claude/hooks/session-context.sh` in WIP + gợi ý /resume.
   5b. Sửa tay `docs/todo/fe.md` thêm 1 dòng `- [ ]` → `node scripts/todo.mjs check` báo lệch → `index` → bảng `TODO.md` tăng cột Todo tay của fe; Claude không đổi chữ nào trong `fe.md`.
   5c. Người sửa `docs/todo/be.md` (thêm 1 việc, đánh `[x]` 1 việc đang WIP), `git add docs/todo/be.md && git commit -m "chore(todo): update be"` → commit chứa cả `be.auto.md` (mục "Từ viết tay" có việc mới, item WIP chuyển sang Xong) và `TODO.md`. Lặp lại qua Claude (hook commit-guard) với `.githooks` tắt → kết quả giống.
6. `node scripts/adr.mjs check`, `node scripts/version.mjs check`, `pnpm verify` (hoặc `bash scripts/verify.sh`) → VERIFY OK.
7. Dọn: `node scripts/wip.mjs drop <nhánh thử>`, xoá nhánh thử.
