#!/usr/bin/env bash
# Set up the GitHub repo for the PR flow (docs/GIT.md): main only accepts PRs, CI `verify` must be green,
# linear history, rebase merges, auto-merge. Safe to rerun (updates the ruleset by name).
#
#   bash scripts/github-setup.sh
#
# Needs: gh CLI logged in (gh auth login). Private repos on the Free plan have no rulesets/auto-merge.
set -euo pipefail

RULESET="main"
CHECK="verify" # job name in .github/workflows/verify.yml

command -v gh >/dev/null || { echo "gh CLI not found: winget install GitHub.cli, then gh auth login." >&2; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "gh is not logged in: run gh auth login." >&2; exit 1; }

repo=$(gh repo view --json nameWithOwner -q .nameWithOwner)

# Check before changing anything: private repos on the Free plan return 403 for rulesets.
if ! existing=$(gh api "repos/$repo/rulesets" --jq ".[] | select(.name == \"$RULESET\") | .id" 2>&1); then
  echo "Cannot read the rulesets of $repo: $existing" >&2
  echo "Rulesets and auto-merge need a public repo, or GitHub Pro/Team for a private one. Nothing changed." >&2
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
  echo "Updated ruleset \"$RULESET\" (id $existing)."
else
  printf '%s' "$body" | gh api -X POST "repos/$repo/rulesets" --input - >/dev/null
  echo "Created ruleset \"$RULESET\"."
fi

gh api -X PATCH "repos/$repo" \
  -F allow_auto_merge=true \
  -F allow_rebase_merge=true \
  -F allow_merge_commit=false \
  -F allow_squash_merge=false \
  -F delete_branch_on_merge=true >/dev/null
echo "Configured $repo: rebase-merge only, auto-merge on, branches deleted after merge."
