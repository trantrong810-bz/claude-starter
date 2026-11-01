---
number: 0019
scope: broad # broad | feature
status: accepted # proposed | accepted | superseded
superseded-by: # number of the new ADR, only when superseded
date: 2026-11-01
model: claude-opus-5-5
source: yêu cầu "định nghĩa git flow để claude làm việc" và "cần push lên github và merge tự động qua github"; plan docs/plans/github-pr-flow.md; thay 0007R, điều chỉnh 0014R
---

# Mọi thay đổi vào main qua PR trên GitHub; người đồng ý trong chat, GitHub rebase-merge khi CI xanh

## Bối cảnh

Theo 0007R và 0014R, Claude không tự push, merge `--ff-only` ở máy local sau khi người duyệt trong chat, và task nhỏ commit thẳng vào `main`. Người dùng muốn push lên GitHub và để GitHub tự merge. Có ba điểm cần chốt: người còn duyệt hay không, task nhỏ có cần PR không, và tag phát hành gắn ở đâu. Claude mở PR bằng tài khoản của người, mà GitHub không cho tác giả tự approve PR của mình, nên "required review" không dùng được khi làm một mình.

## Phương án

- Duyệt:
  - (a) Claude hỏi trong chat rồi mới bật auto-merge. Giữ điểm duyệt, nhưng người phải có mặt.
  - (b) Hoàn toàn tự động khi CI xanh. Nhanh, nhưng chỉ có CI làm trọng tài.
  - (c) Tự động trừ task lớn. Phải tự phân loại, dễ lệch.
- Task nhỏ:
  - (a) Mọi thay đổi qua PR, `main` được ruleset bảo vệ. Một luồng duy nhất, CI kiểm mọi commit.
  - (b) Task nhỏ vẫn push thẳng `main`. Ít bước hơn, nhưng ruleset phải cho bypass, nên CI không chặn được commit hỏng.
- Phát hành:
  - (a) `/release` trên nhánh `release/vX.Y.Z` qua PR, Action gắn tag sau merge. Vẫn do người gọi.
  - (b) Action tự bump và tag sau mỗi merge. Action phải được push vào `main` đã bảo vệ, và version nhảy theo từng PR.

## Quyết định

Chọn (a) cho cả ba điểm (người dùng chọn). Merge chỉ bằng rebase: giữ commit theo lớp và lịch sử thẳng như 0007R/0014R. Squash bỏ mất các lớp, merge commit làm lịch sử rẽ nhánh. `/ship` gom cả luồng. Lệnh `gh pr merge` nằm trong `ask` của `settings.json`, thêm một lớp duyệt ở mức công cụ.

## Hệ quả

- `main` chỉ đổi qua PR có job `verify` xanh. Commit trên `main` local bị chặn bởi `commit-guard.sh` và `.githooks/pre-commit`.
- Rebase-merge đổi mã commit, nên có hai hệ quả:
  - `git branch -d` không xoá được nhánh đã merge. Thay bằng `scripts/pr.mjs cleanup` (so theo patch).
  - Không tag được trước khi merge. `version.mjs release --no-tag`, rồi Action `release-tag` gắn tag.
- Cần `gh` CLI đã đăng nhập, và chạy `scripts/github-setup.sh` một lần cho mỗi repo. Repo private trên gói Free không có ruleset/auto-merge.
- Nhánh đã push mà cần rebase thì phải force push, việc này bị cấm. Claude dừng và hỏi người.
- Điều chỉnh 0014R ở phần push, merge và tag. Các quy ước khác của 0014R (commit message, lệnh cấm, xuống dòng) giữ nguyên.
