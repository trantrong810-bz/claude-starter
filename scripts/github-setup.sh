#!/usr/bin/env bash
# Thiết lập repo GitHub cho luồng PR (docs/GIT.md): main chỉ nhận qua PR, CI `verify` phải xanh,
# lịch sử thẳng, merge bằng rebase, auto-merge. Chạy lại nhiều lần được (cập nhật ruleset theo tên).
#
#   bash scripts/github-setup.sh
#
# Cần: gh CLI đã đăng nhập (gh auth login). Repo private trên gói Free không có ruleset/auto-merge.
set -euo pipefail

RULESET="main"
CHECK="verify" # tên job trong .github/workflows/verify.yml

command -v gh >/dev/null || { echo "Chưa có gh CLI: winget install GitHub.cli, rồi gh auth login." >&2; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "gh chưa đăng nhập: chạy gh auth login." >&2; exit 1; }

repo=$(gh repo view --json nameWithOwner -q .nameWithOwner)

# Kiểm tra trước khi đổi gì: repo private gói Free trả 403 cho rulesets.
if ! existing=$(gh api "repos/$repo/rulesets" --jq ".[] | select(.name == \"$RULESET\") | .id" 2>&1); then
  echo "Không đọc được ruleset của $repo: $existing" >&2
  echo "Ruleset và auto-merge cần repo public, hoặc GitHub Pro/Team cho repo private. Chưa đổi gì." >&2
  exit 1
fi

body=$(cat <<EOF
{
  "name": "$RULESET",
  "target": "branch",
  "enforcement": "active",
  "bypass_actors": [],
  "conditions": { "ref_name": { "include": ["~DEFAULT_BRANCH"], "exclude": [] } },
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    { "type": "required_linear_history" },
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 0,
        "dismiss_stale_reviews_on_push": false,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": false,
        "allowed_merge_methods": ["rebase"]
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": false,
        "required_status_checks": [{ "context": "$CHECK" }]
      }
    }
  ]
}
EOF
)

if [ -n "$existing" ]; then
  printf '%s' "$body" | gh api -X PUT "repos/$repo/rulesets/$existing" --input - >/dev/null
  echo "Đã cập nhật ruleset \"$RULESET\" (id $existing)."
else
  printf '%s' "$body" | gh api -X POST "repos/$repo/rulesets" --input - >/dev/null
  echo "Đã tạo ruleset \"$RULESET\"."
fi

gh api -X PATCH "repos/$repo" \
  -F allow_auto_merge=true \
  -F allow_rebase_merge=true \
  -F allow_merge_commit=false \
  -F allow_squash_merge=false \
  -F delete_branch_on_merge=true >/dev/null
echo "Đã đặt $repo: chỉ rebase-merge, bật auto-merge, tự xoá nhánh sau merge."
