# Git flow qua GitHub: Claude push, mở PR, GitHub tự merge khi CI xanh

## Context

Hiện tại `docs/GIT.md` quy định: Claude không tự push, merge `--ff-only` ở máy local, và người duyệt merge trong chat (ADR 0007R, 0014R). Người dùng muốn **push lên GitHub và để GitHub tự merge**. Ba điểm đã chốt:

- **Duyệt:** Claude push và mở PR, gửi link, **hỏi trong chat**. Bạn đồng ý thì Claude bật auto-merge, và GitHub merge khi CI xanh. GitHub không cho tác giả tự approve PR của mình, nên không dùng "required review".
- **Mọi thay đổi qua PR:** `main` được bảo vệ (cấm push thẳng, bắt buộc CI xanh, lịch sử thẳng). Task nhỏ cũng tạo nhánh ngắn.
- **Phát hành qua PR:** `/release` chạy trên nhánh `release/vX.Y.Z`, commit nhưng không tag. Sau khi merge, GitHub Action gắn tag lên đúng commit trên `main`.

Merge dùng **rebase** (giữ commit theo lớp, lịch sử thẳng). Merge commit và squash bị tắt.

## Bước 0: hoàn tất việc trước

Nhánh `docs/split-workflows` chưa merge (đã báo ở lượt trước). Merge local theo luồng cũ: `git switch main && git merge --ff-only docs/split-workflows && git branch -d docs/split-workflows`. Push `main` lên origin trước khi bật bảo vệ. Sau đó tạo nhánh `feat/github-pr-flow`.

**Bạn cần tự làm** (đăng nhập tương tác, Claude không làm được):

```powershell
winget install GitHub.cli
gh auth login          # GitHub.com, HTTPS, scope có repo + workflow
```

File plan này trùng tên với plan tách workflow, đã commit ở `8535b27`. Khi bắt đầu làm: chép nội dung sang `docs/plans/github-pr-flow.md`, rồi `git restore docs/plans/t-ch-c-c-workflow-floofy-biscuit.md` để file cũ giữ nguyên.

## 1. CI: `.github/workflows/verify.yml` (mới)

- Chạy khi có `pull_request` và khi `push` vào `main`. Job tên `verify`, đây là status check bắt buộc.
- Bước: `actions/checkout@v4` với `fetch-depth: 0` (để có tag và `main` cho `version.mjs` và `turbo`), `actions/setup-node@v4` (Node 22).
- Có `package.json` (dự án thật): `pnpm/action-setup`, `pnpm install --frozen-lockfile`, rồi `VERIFY_BASE=origin/${{ github.base_ref || 'main' }} bash scripts/verify.sh`.
- Không có (repo kit): `bash scripts/verify.sh --quick`.

[scripts/verify.sh](scripts/verify.sh): đổi `--filter='...[HEAD]'` thành `--filter="...[${VERIFY_BASE:-HEAD}]"`. Ở máy local hành vi giữ nguyên; trong CI thì so với nhánh đích.

## 2. CI gắn tag: `.github/workflows/release-tag.yml` (mới)

- Chạy khi `push` vào `main`, quyền `contents: write`.
- Nếu subject của HEAD là `release: vX.Y.Z` và tag chưa có: chạy `node scripts/version.mjs tag` rồi `git push origin vX.Y.Z` (đặt user git là `github-actions[bot]`).

[scripts/version.mjs](scripts/version.mjs):

- `release --no-tag`: commit nhưng không tag. Câu báo cuối đổi thành "mở PR: /ship".
- Lệnh mới `tag`: kiểm subject HEAD khớp `release: v<project.version>` trong `versions.json`, tag chưa có, rồi tạo annotated tag. Sai điều kiện thì báo rõ và `exit 1`.
- Cập nhật chú thích đầu file.

## 3. Thiết lập repo GitHub: `scripts/github-setup.sh` (mới, chạy lại nhiều lần vẫn an toàn)

Dùng `gh api` để:

- Repo: `allow_auto_merge=true`, `allow_rebase_merge=true`, `allow_merge_commit=false`, `allow_squash_merge=false`, `delete_branch_on_merge=true`.
- Ruleset `main` (tạo mới hoặc cập nhật theo tên): bắt buộc PR (0 approval), bắt buộc status check `verify`, `required_linear_history`, chặn force push và xoá nhánh. Không có bypass.
- Kiểm trước: `gh auth status`. Repo private trên gói Free không có ruleset/auto-merge, API trả 403; khi đó báo rõ "cần public hoặc GitHub Pro" rồi dừng, không đổi nửa chừng.

Claude chạy script này một lần (bước 9), sau khi bạn duyệt. Ghi vào SETUP.md cho dự án dùng kit.

## 4. Luồng của Claude: command `/ship` (mới, `.claude/commands/ship.md`)

1. Đang ở nhánh khác `main`, working tree sạch (`history/` được bỏ qua), `pnpm verify` qua.
2. `git fetch origin`. Nếu `main` đã đi tiếp thì `git rebase origin/main` rồi `pnpm verify` lại (rebase vẫn là `ask`).
3. `git push -u origin <nhánh>`.
4. `gh pr create --base main`:
   - title: header của commit chính, hoặc `<type>(<scope>): <tóm tắt>` khi có nhiều commit;
   - body: tóm tắt 3–5 dòng, danh sách commit, `Refs:` spec/ADR, kết quả verify, dòng attribution.
   - PR đã tồn tại thì chỉ push.
5. Gửi link và tóm tắt, rồi **hỏi bạn**. Không đồng ý thì dừng; PR để mở.
6. Đồng ý: `gh pr merge --auto --rebase`, sau đó `gh pr checks --watch`.
   - CI đỏ: đọc log (`gh run view --log-failed`), sửa, commit, push, lặp lại bước 6. Auto-merge vẫn đang bật.
   - Đã merge: `git switch main && git pull --ff-only`, rồi `node scripts/pr.mjs cleanup <nhánh>`.
7. Sau merge: `version.mjs mode` là `full` thì làm `/release`, không thì nhắc có thể `/release`. Nhánh `feat/` thì nhắc `/retro`.

## 5. Dọn nhánh sau rebase-merge: `scripts/pr.mjs` (mới)

Rebase-merge tạo mã commit mới, nên `git branch -d` từ chối xoá nhánh.

- `cleanup <nhánh>`: nếu `git cherry main <nhánh>` không còn dòng `+` (mọi patch đã có trên `main`) thì xoá ref local bằng `git update-ref -d` và `git fetch --prune`. Còn patch chưa có thì báo danh sách và không xoá.
- `stale`: liệt kê các nhánh local mà mọi patch đã có trên `main`.

`git branch -D` vẫn bị cấm; việc xoá chỉ đi qua kiểm tra này.

## 6. Hook và quyền

- [.claude/hooks/commit-guard.sh](.claude/hooks/commit-guard.sh):
  - chặn commit khi đang ở `main` ("main được bảo vệ: tạo nhánh `<type>/<tên>` rồi commit");
  - regex tên nhánh nhận thêm `release/v[0-9]+\.[0-9]+\.[0-9]+`.
- [.claude/hooks/session-context.sh](.claude/hooks/session-context.sh): dòng "Nhánh chưa merge vào main" dùng `pr.mjs stale` để tách hai loại: nhánh đã merge trên GitHub (gợi ý `pr.mjs cleanup`) và nhánh thật sự chưa merge.
- [.claude/settings.json](.claude/settings.json):
  - `allow`: `git push -u origin:*`, `git fetch:*`, `git pull --ff-only`, `gh pr create:*`, `gh pr view:*`, `gh pr checks:*`, `gh run view:*`, `node scripts/pr.mjs:*`;
  - `ask`: `gh pr merge:*`, `bash scripts/github-setup.sh`. Thêm một lớp duyệt ở mức công cụ, cùng với câu hỏi trong chat;
  - giữ `git push` trong `ask` cho trường hợp khác. `deny` giữ nguyên (force push, `branch -D`, ...).
- `.githooks/pre-commit`: chặn commit trên `main` cho người, kể cả khi GitHub đã chặn push. Lý do: tránh commit nằm kẹt ở `main` local.

## 7. Command hiện có

- [build-feature.md:19](.claude/commands/build-feature.md#L19): thay đoạn merge local bằng "chạy `/ship`".
- [release.md](.claude/commands/release.md), làm lại:
  1. mode, check, dry-run, hỏi (giữ nguyên);
  2. `git switch -c release/v<X.Y.Z>` từ `main` mới nhất;
  3. `version.mjs release --no-tag`;
  4. `/ship`.

  Tag do CI gắn. Mô tả command đổi "Không push" thành "Push qua PR".

- `plan-feature.md`: giữ nguyên tạo nhánh `feat/`. Push chỉ khi `/handoff` hoặc `/ship`.
- CLAUDE.md, quy tắc phân loại task: "nhỏ → nhánh ngắn rồi `/ship`", "vừa → plan ngắn trong chat → nhánh → `/ship`".

## 8. Tài liệu

- [docs/GIT.md](docs/GIT.md):
  - viết lại mục Nhánh: `main` chỉ nhận qua PR, thêm `release/vX.Y.Z`;
  - Merge: PR, rebase-merge, auto-merge sau khi người đồng ý trong chat, dọn bằng `pr.mjs`;
  - Tag: CI gắn;
  - Push: Claude push nhánh của mình trong `/ship` và `/handoff`, không bao giờ push `main`;
  - Cài trên máy mới: `gh auth login`.
- `docs/workflows/git.md` (mới, `thu-tu: 3`): sơ đồ Mermaid vòng đời git của Claude, từ task đến nhánh, commit (qua commit-guard), `/ship`, PR, CI, người đồng ý, auto-merge, pull, cleanup, rồi release/retro. Các workflow sau đó lùi thứ tự một bậc.
- Sửa sơ đồ:
  - `tong-quan.md`: nút MERGE/FF thành `/ship`; đường task nhỏ và vừa đi qua nhánh;
  - `lop-bao-ve.md`: commit-guard chặn trên main, CI trên GitHub;
  - `phat-hanh.md`: nhánh release, PR, CI gắn tag.
- Chạy `node scripts/workflow.mjs index`.
- SETUP.md (mục Cài đặt, bước git): `gh auth login`, chép `.github/`, chạy `bash scripts/github-setup.sh`. README: một dòng về luồng PR.
- **ADR 0019R** `git-flow-qua-github-pr`: các phương án (merge local / PR có duyệt trong chat / tự động hoàn toàn; release qua PR hay CI tự phát hành). ADR 0007R chuyển `bi-thay-the` với `thay-the-boi: 0019`. Ghi rõ 0019R điều chỉnh phần push/merge/tag của 0014R. Chạy `adr.mjs index`.
- Changelog `Unreleased`:
  - root: `.github/`;
  - scripts: `pr.mjs`, `github-setup.sh`, `version.mjs tag`/`--no-tag`, `VERIFY_BASE`;
  - claude: `/ship`, hook, quyền, `**BREAKING:**` commit trên main bị chặn;
  - docs.

## 9. Thứ tự làm và commit trên `feat/github-pr-flow`

1. `feat(scripts): add pr cleanup, github setup and release tag support`: pr.mjs, github-setup.sh, version.mjs, verify.sh.
2. `ci: add verify and release tag workflows`
3. `feat(claude)!: ship changes through github pull requests`: `/ship`, hook, settings, command, CLAUDE.md, githooks.
4. `docs: describe github pr flow`: GIT.md, workflows, SETUP, README, ADR.
5. `/ship` lần đầu, để chính PR này thử luồng mới: push, mở PR, CI chạy. Sau đó **hỏi bạn** rồi chạy `bash scripts/github-setup.sh`, và **hỏi bạn** lần nữa trước khi bật auto-merge.

## Verification

- Local:
  - `bash scripts/verify.sh --quick` in OK;
  - commit thử trên `main` bị commit-guard chặn;
  - `node scripts/version.mjs release --dry-run` chạy được;
  - `node scripts/version.mjs tag` khi HEAD không phải commit release thì báo lỗi;
  - `node scripts/pr.mjs stale` liệt kê đúng.
- GitHub, trên chính PR này:
  - job `verify` xanh;
  - sau `github-setup.sh`, `gh api repos/{owner}/{repo}/rulesets` thấy ruleset `main`;
  - `git push origin main` bị từ chối;
  - auto-merge rebase merge PR;
  - `pr.mjs cleanup feat/github-pr-flow` xoá được nhánh local.
- Release, chỉ khi bạn muốn thử ngay: `/release` tạo PR `release/v...`; sau merge, Action `release-tag` tạo tag `v...` trên commit release.
