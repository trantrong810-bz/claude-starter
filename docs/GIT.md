# Quy ước Git

> Nạp vào mọi session qua `CLAUDE.md`. Áp dụng cho Claude và người. Ép bằng công cụ: `.githooks/` (commit-msg, pre-commit — chặn file cấm và tự chạy Prettier trên file đã stage — cho người), hook `commit-guard.sh` (PreToolUse, cho Claude; luôn chạy), `scripts/commit-msg.mjs` (bộ kiểm tra dùng chung), `.gitattributes`, ruleset `main` trên GitHub (`scripts/github-setup.sh`) và CI `.github/workflows/verify.yml`. Hook SessionStart báo nhánh, file chưa commit, nhánh chưa merge hoặc đã merge cần dọn, tag thiếu. Quyết định: ADR 0014R, 0016R, 0019R. Sơ đồ: [workflows/git.md](workflows/git.md).

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
- Ngoại lệ verify: commit **chỉ** gồm `TODO.md`, `docs/todo/`, `docs/specs/`, `docs/plans/` (ví dụ `/handoff` giữa chừng) được phép khi verify đỏ — code dở đi theo snapshot WIP, không vào commit.
- Commit có file todo viết tay (`docs/todo/<phần>.md`) → hook tự chạy `todo.mjs sync` và stage file auto + `TODO.md` vào cùng commit.

## Nhánh

| Nhánh                                         | Khi nào                                                                |
| --------------------------------------------- | ---------------------------------------------------------------------- |
| `main`                                        | Luôn xanh, lịch sử thẳng. **Chỉ nhận qua PR**, không commit trực tiếp. |
| `feat/<tên>`                                  | Task lớn (tạo trong `/plan-feature`). `<tên>` = tên spec.              |
| `fix/<tên>`                                   | Sửa lỗi.                                                               |
| `refactor/<tên>`, `chore/<tên>`, `docs/<tên>` | Task nhỏ và vừa theo loại thay đổi.                                    |
| `release/vX.Y.Z`                              | Chỉ do `/release` tạo.                                                 |

- `<tên>`: kebab-case, chữ thường, ≤ 40 ký tự, không dấu tiếng Việt.
- Tạo nhánh từ `main` mới nhất: `git switch main && git pull --ff-only && git switch -c feat/<tên>`.
- Mọi task, kể cả sửa 1 chỗ, đều có nhánh. Commit trên `main` bị chặn bởi `commit-guard.sh` (Claude) và `.githooks/pre-commit` (người).
- Một nhánh = một tính năng/việc. Việc khác phát sinh → ghi vào spec, làm ở nhánh khác.

## Merge

Merge diễn ra trên GitHub qua PR, bằng `/ship`:

- Claude push nhánh, mở PR (`gh pr create`), gửi link và **hỏi người**. Merge vào `main` vẫn là điểm duyệt của người. Câu trả lời nằm trong chat, vì GitHub không cho tác giả tự approve PR của mình.
- Người đồng ý thì Claude bật auto-merge: `gh pr merge --auto --rebase`. GitHub merge khi job `verify` xanh.
- Chỉ **rebase-merge**: lịch sử thẳng, giữ commit theo lớp. Không merge commit, không squash (ruleset chỉ cho rebase).
- `main` đã đi tiếp: trên nhánh chạy `git rebase origin/main`, `pnpm verify`, rồi push. Nhánh đã push mà cần rebase thì phải force push, việc này bị cấm, nên hỏi người.
- Rebase-merge tạo commit mới trên `main`, nên `git branch -d` từ chối xoá nhánh. Sau merge: `git switch main && git pull --ff-only && node scripts/pr.mjs cleanup <nhánh>`. Script chỉ xoá khi mọi patch đã có trên `main`. Nhánh remote do GitHub tự xoá.
- Thiết lập repo một lần: `bash scripts/github-setup.sh`. Script đặt ruleset `main` (chỉ qua PR, CI xanh, lịch sử thẳng, cấm force push và xoá), chỉ cho rebase, bật auto-merge.

## Viết lại lịch sử

- Được: `commit --amend`, `rebase` trên **nhánh của mình, với commit chưa push**.
- Không bao giờ: viết lại `main`, commit đã push, tag đã tạo.
- Muốn bỏ commit đã có trên `main` → `git revert <sha>` trên nhánh `fix/<tên>`, rồi `/ship`; không `reset`.

## Tag và phát hành

- `/release` chạy trên nhánh `release/vX.Y.Z`: `version.mjs release --no-tag` tạo commit `release: vX.Y.Z`, rồi `/ship`.
- Tag dạng `vX.Y.Z` (annotated), **chỉ** do Action `release-tag` tạo (chạy `node scripts/version.mjs tag`) sau khi commit release vào `main`. Không tạo trước khi merge được, vì rebase-merge đổi mã commit. Không tạo, sửa, xoá tag bằng tay.
- `version.mjs` so thay đổi với tag gần nhất; thiếu tag → `check` báo thiếu changelog cho cả lịch sử.

## Snapshot WIP

Code đang sửa dở mang sang máy/tài khoản khác bằng `node scripts/wip.mjs` (gọi qua `/handoff`, `/resume`), không bằng commit "WIP".

- Ref `refs/heads/wip/<nhánh>` trên remote: một commit rời, cha = HEAD của nhánh, chứa toàn bộ working tree trừ `history/`. Chỉ `wip.mjs` tạo (force-update), áp và xoá.
- Không checkout, không merge, không tạo nhánh từ `wip/*`. `restore` áp thay đổi vào working tree (chưa stage) rồi xoá ref trên remote.
- `restore` từ chối khi working tree bẩn hoặc snapshot cũ (nhánh đã có commit sau khi chụp) — hỏi người, không tự bỏ thay đổi.

## Push và remote

- Claude push **nhánh của mình** trong `/ship` (`git push -u origin <nhánh>`) và `/handoff` (nhánh + `wip/<nhánh>`). Không bao giờ push `main` (ruleset cũng chặn), không push tag.
- Cấm: `push --force`, `reset --hard` (`deny` trong `settings.json`); `clean`, `branch -D`, `tag -d`, `git config` (không dùng; muốn ép thì thêm vào `deny`, xem SETUP.md).
- Muốn bỏ thay đổi chưa commit: hỏi người trước — `restore`/`checkout -- <file>` không lấy lại được.

## Xuống dòng

LF ở mọi file text, ép bằng `.gitattributes` (kể cả khi `core.autocrlf=true`). Không đổi `.gitattributes` để "sửa" diff — chuẩn hoá file thay vì vậy.

## Cài trên máy mới

```bash
git config core.hooksPath .githooks   # bật commit-msg + pre-commit cho người
git config pull.ff only               # pull không tạo merge commit
gh auth login                         # GitHub CLI cho /ship (cài: winget install GitHub.cli)
```
