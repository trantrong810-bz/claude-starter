#!/usr/bin/env bash
# Stop hook: do not let Claude finish while verify fails.
# Exit 2 + stderr => Claude gets the errors and keeps fixing.
input=$(cat)

# Avoid an endless loop: if already blocked once this turn, let it stop.
if printf '%s' "$input" | grep -q '"stop_hook_active":[[:space:]]*true'; then
  exit 0
fi

# No code change (questions, reading code, plans, logs/docs only) => quick checks only:
# secret scan of the prompt log, ADR check and the like. Code changed => full checks.
mode=""
if git diff --quiet HEAD -- apps packages 2>/dev/null && \
   [ -z "$(git ls-files --others --exclude-standard apps packages 2>/dev/null)" ]; then
  mode="--quick"
fi

out=$(bash scripts/verify.sh $mode 2>&1)
if [ $? -ne 0 ]; then
  echo "pnpm verify does not pass. Fix these errors before reporting done:" >&2
  echo "$out" >&2
  exit 2
fi
exit 0
