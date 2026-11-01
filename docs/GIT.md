# Quy ước Git

> Nạp vào mọi session qua `CLAUDE.md`. Áp dụng cho Claude và người. Ép bằng công cụ: `.githooks/` (commit-msg, pre-commit, cho người), hook `commit-guard.sh` (PreToolUse, cho Claude; luôn chạy), `scripts/commit-msg.mjs` (bộ kiểm tra dùng chung), `.gitattributes`. Hook SessionStart báo nhánh, file chưa commit, nhánh chưa merge, tag thiếu. Quyết định: ADR 0014R.

## Commit message

[Conventional Commits 1.0](https://www.conventionalcommits.org/en/v1.0.0/), viết **tiếng Anh**:

```
<type>(<scope>)!: <subject>        ← header ≤ 72 ký tự; scope và ! tùy chọn

<body: vì sao, không phải làm gì; dòng ≤ 72; gạch đầu dòng "- " được>

BREAKING CHANGE: <điều gì vỡ, cách chuyển>
Refs: docs/specs/<tên>.md | ADR 0014
Co-Authored-By: <model> <noreply@anthropic.com>
```

| type       | Dùng khi                                        | Mục changelog         |
| ---------- | ----------------------------------------------- | --------------------- |
| `feat`     | Thêm hành vi cho người dùng hoặc cho kit        | Added                 |
| `fix`      | Sửa lỗi                                         | Fixed                 |
| `refactor` | Đổi cấu trúc, không đổi hành vi                 | Changed (nếu đáng kể) |
| `perf`     | Nhanh hơn, không đổi hành vi                    | Changed               |
| `test`     | Chỉ thêm/sửa test                               | —                     |
| `docs`     | Chỉ tài liệu, ADR, changelog                    | —                     |
| `style`    | Format, không đổi logic                         | —                     |
| `build`    | Dependency, cấu hình build, turbo, tsconfig     | Changed               |
| `ci`       | CI, git hook                                    | —                     |
| `chore`    | Việc lặt vặt khác (cấu hình, dọn dẹp, log)      | —                     |
| `revert`   | Đảo commit cũ; body ghi `This reverts <sha>`    | Theo commit bị đảo    |
| `release`  | Chỉ do `version.mjs release`: `release: vX.Y.Z` | —                     |

- **scope**: chữ thường, kebab-case. Dùng nhãn phần trong `versions.json` (`claude`, `docs`, `scripts`, `example`, `shared`, `be`, `fe`, `mobile`) hoặc tên tính năng (`feat/<tên>` → scope `<tên>`). Đổi nhiều phần → bỏ scope hoặc chọn phần chính.
- **subject**: mệnh lệnh (`add`, không `added`/`adds`), chữ đầu viết thường, không dấu chấm cuối, nói _cái gì_, không nói _file nào_.
- **`!` / `BREAKING CHANGE:`**: khi đổi contract API, xoá/đổi tên lệnh, script, hook hoặc đường dẫn mà người khác dựa vào. Changelog ghi `**BREAKING:**` tương ứng.
- **Trailer**: commit do Claude tạo luôn có `Co-Authored-By` của model đang chạy. Commit gắn với spec/ADR thì thêm `Refs:`.
- Commit tạo tự động bởi git (`Merge ...`, `Revert "..."`, `fixup! ...`, `squash! ...`) được chấp nhận nguyên dạng.

Ví dụ: `feat(todos): add contract, stub and failing tests` · `fix(shared): encode query params in listTodos` · `feat(shared)!: rename Todo.title to Todo.name` · `docs(changelog): fill unreleased for be and fe` · `release: v0.2.0`.

## Commit

- **Một commit = một thay đổi logic**, gồm code + test + changelog (`Unreleased`) + sơ đồ/ADR liên quan. Không trộn refactor với feat; không commit "WIP".
- **`pnpm verify` xanh trước khi commit.** Ngoại lệ duy nhất: commit pha 1 (`.claude/.allow-red`) trên nhánh `feat/`, khi test đỏ có chủ đích. Không bao giờ commit đỏ vào `main`.
- Stage có chủ đích: `git add <đường dẫn>`; chỉ `git add -A` khi đã xem `git status` và mọi file đều thuộc commit này.
- Không commit: `.env*` (trừ `.env.example`), secret, token, build output, `node_modules/`, `.claude/state/`, `.claude/.allow-red`, `CLAUDE.local.md`.
- `history/prompts/` do hook ghi; đi kèm commit bất kỳ, không cần commit riêng.
- Không dùng `--no-verify`. Hook chặn thì sửa nguyên nhân.

## Nhánh

| Nhánh                                         | Khi nào                                                             |
| --------------------------------------------- | ------------------------------------------------------------------- |
| `main`                                        | Luôn xanh, lịch sử thẳng. Task nhỏ (1 chỗ) commit thẳng vào đây.    |
| `feat/<tên>`                                  | Task lớn (bắt buộc, tạo trong `/plan-feature`). `<tên>` = tên spec. |
| `fix/<tên>`                                   | Sửa lỗi cần > 1 commit hoặc cần thử nghiệm.                         |
| `refactor/<tên>`, `chore/<tên>`, `docs/<tên>` | Task vừa có > 1 commit; tùy chọn.                                   |

- `<tên>`: kebab-case, chữ thường, ≤ 40 ký tự, không dấu tiếng Việt.
- Tạo nhánh từ `main` mới nhất: `git switch main && git switch -c feat/<tên>`.
- Một nhánh = một tính năng/việc. Việc khác phát sinh → ghi vào spec, làm ở nhánh khác.

## Merge

- Chỉ **fast-forward**: `git switch main && git merge --ff-only <nhánh>`. Không merge commit, không squash (giữ commit theo lớp để quay lại được).
- `main` đã đi tiếp → trên nhánh: `git rebase main`, `pnpm verify`, rồi merge lại.
- Merge vào `main` là **điểm duyệt của người**: Claude hỏi trước, không tự merge.
- Sau merge: `git branch -d <nhánh>` (chữ `d` thường: git từ chối nếu chưa merge).

## Viết lại lịch sử

- Được: `commit --amend`, `rebase` trên **nhánh của mình, với commit chưa push**.
- Không bao giờ: viết lại `main`, commit đã push, tag đã tạo.
- Muốn bỏ commit đã có trên `main` → `git revert <sha>`, không `reset`.

## Tag và phát hành

- Tag dạng `vX.Y.Z` (annotated), **chỉ** tạo bởi `node scripts/version.mjs release` (`/release`). Không tạo, sửa, xoá tag bằng tay.
- `version.mjs` so thay đổi với tag gần nhất; thiếu tag → `check` báo thiếu changelog cho cả lịch sử.

## Push và remote

- Claude **không tự push**; chỉ push khi người yêu cầu trong lượt đó. Người push: `git push && git push origin vX.Y.Z`.
- Cấm: `push --force`, `reset --hard` (`deny` trong `settings.json`); `clean`, `branch -D`, `tag -d`, `git config` (không dùng; muốn ép thì thêm vào `deny`, xem SETUP.md).
- Muốn bỏ thay đổi chưa commit: hỏi người trước — `restore`/`checkout -- <file>` không lấy lại được.

## Xuống dòng

LF ở mọi file text, ép bằng `.gitattributes` (kể cả khi `core.autocrlf=true`). Không đổi `.gitattributes` để "sửa" diff — chuẩn hoá file thay vì vậy.

## Cài trên máy mới

```bash
git config core.hooksPath .githooks   # bật commit-msg + pre-commit cho người
git config pull.ff only               # pull không tạo merge commit
```
